#!/usr/bin/env python3
import argparse
import csv
import io
import json
import re
import shutil
import sys
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

TAXONOMY_CODE = "343900000X"
CMS_FILES_PAGE = "https://download.cms.gov/nppes/NPI_Files.html"

STATES = {
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","DC":"District of Columbia","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"
}

CATEGORIES = ["Wheelchair", "Ambulatory", "Dialysis", "Doctor Visit", "Stretcher", "Companion"]
CATEGORY_KEYWORDS = {
    "Wheelchair": ("wheelchair", "wheel chair"),
    "Ambulatory": ("ambulatory",),
    "Dialysis": ("dialysis",),
    "Doctor Visit": ("doctor visit", "doctor visits", "physician appointment", "medical appointment", "medical appointments"),
    "Stretcher": ("stretcher",),
    "Companion": ("companion", "escort assistance", "companion assistance"),
}

MONTHS = "January February March April May June July August September October November December".split()


def latest_monthly_v2_url():
    with urllib.request.urlopen(CMS_FILES_PAGE, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    month_alt = "|".join(MONTHS)
    pat = re.compile(r'href=["\']([^"\']*NPPES_Data_Dissemination_(?:' + month_alt + r')_\d{4}_V2\.zip)["\']', re.I)
    m = pat.search(html)
    if not m:
        raise RuntimeError("Could not locate the latest monthly NPPES V2 ZIP on the CMS file page")
    return urllib.parse.urljoin(CMS_FILES_PAGE, m.group(1))


def download(url, dest):
    print(f"Downloading {url}", flush=True)
    req = urllib.request.Request(url, headers={"User-Agent":"EazyMedicalTransportation/1.0 provider-directory-builder"})
    with urllib.request.urlopen(req, timeout=180) as src, open(dest, "wb") as out:
        total = int(src.headers.get("Content-Length", "0") or 0)
        copied = 0
        while True:
            block = src.read(8 * 1024 * 1024)
            if not block:
                break
            out.write(block)
            copied += len(block)
            if total:
                print(f"  {copied/1024/1024:.0f} / {total/1024/1024:.0f} MB", flush=True)
    print(f"Downloaded {Path(dest).stat().st_size/1024/1024:.1f} MB", flush=True)


def hindex(headers, *candidates, required=True):
    lookup = {h.strip(): i for i, h in enumerate(headers)}
    for c in candidates:
        if c in lookup:
            return lookup[c]
    if required:
        raise KeyError(f"Missing required column. Tried: {candidates}")
    return None


def clean(v):
    return (v or "").strip()


def phone_format(v):
    digits = re.sub(r"\D", "", clean(v))
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    return clean(v)


def zip5(v):
    digits = re.sub(r"\D", "", clean(v))
    return digits[:5] if len(digits) >= 5 else clean(v)


def classify(name, claim):
    parts = [name]
    if isinstance(claim, dict):
        for key in ("services", "serviceTypes", "transportationServices"):
            val = claim.get(key)
            if isinstance(val, str):
                parts.append(val)
            elif isinstance(val, list):
                parts.extend(str(x) for x in val)
        tags = claim.get("tags")
        if isinstance(tags, list):
            parts.extend(str(x) for x in tags)
    text = " ".join(parts).lower()
    result = []
    for cat, words in CATEGORY_KEYWORDS.items():
        if any(w in text for w in words):
            result.append(cat)
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", dest="zip_path", help="Use an already-downloaded monthly NPPES ZIP")
    ap.add_argument("--url", help="Monthly NPPES V2 ZIP URL; otherwise auto-detect latest")
    ap.add_argument("--out", default="data/providers", help="Output directory for state files")
    ap.add_argument("--claims", default="providers-claimed.json")
    args = ap.parse_args()

    source_url = args.url or latest_monthly_v2_url()
    zip_path = Path(args.zip_path or "/tmp/nppes_monthly_v2.zip")
    if not args.zip_path:
        download(source_url, zip_path)

    claims = {}
    claims_path = Path(args.claims)
    if claims_path.exists():
        try:
            claims = json.loads(claims_path.read_text(encoding="utf-8")).get("claims", {})
        except Exception as exc:
            print(f"Warning: could not read claims file: {exc}", file=sys.stderr)

    by_state = defaultdict(list)
    generated = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    with zipfile.ZipFile(zip_path) as zf:
        csv_names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not csv_names:
            raise RuntimeError("No CSV files found in NPPES ZIP")
        main_csv = max(csv_names, key=lambda n: zf.getinfo(n).file_size)
        print(f"Reading {main_csv} ({zf.getinfo(main_csv).file_size/1024/1024/1024:.2f} GB uncompressed)", flush=True)
        with zf.open(main_csv, "r") as raw:
            text = io.TextIOWrapper(raw, encoding="utf-8-sig", errors="replace", newline="")
            reader = csv.reader(text)
            headers = next(reader)
            i_npi = hindex(headers, "NPI")
            i_entity = hindex(headers, "Entity Type Code")
            i_org = hindex(headers, "Provider Organization Name (Legal Business Name)", "Provider Organization Name (Legal Business Name) V2", required=False)
            i_last = hindex(headers, "Provider Last Name (Legal Name)", "Provider Last Name (Legal Name) V2", required=False)
            i_first = hindex(headers, "Provider First Name", "Provider First Name V2", required=False)
            i_addr1 = hindex(headers, "Provider First Line Business Practice Location Address")
            i_addr2 = hindex(headers, "Provider Second Line Business Practice Location Address", required=False)
            i_city = hindex(headers, "Provider Business Practice Location Address City Name")
            i_state = hindex(headers, "Provider Business Practice Location Address State Name")
            i_zip = hindex(headers, "Provider Business Practice Location Address Postal Code")
            i_phone = hindex(headers, "Provider Business Practice Location Address Telephone Number", required=False)
            i_deact = hindex(headers, "NPI Deactivation Date", required=False)
            i_last_update = hindex(headers, "Last Update Date", required=False)
            tax_idx = [i for i, h in enumerate(headers) if re.fullmatch(r"Healthcare Provider Taxonomy Code_\d+", h.strip())]
            if not tax_idx:
                raise RuntimeError("No taxonomy code columns found in NPPES CSV")

            matched = 0
            for row_num, row in enumerate(reader, 2):
                if row_num % 500000 == 0:
                    print(f"Processed {row_num:,} rows; matched {matched:,}", flush=True)
                if i_deact is not None and clean(row[i_deact]):
                    continue
                if not any(clean(row[i]) == TAXONOMY_CODE for i in tax_idx):
                    continue
                state = clean(row[i_state]).upper()
                if state not in STATES:
                    continue
                entity = clean(row[i_entity])
                if entity == "2" and i_org is not None:
                    name = clean(row[i_org])
                else:
                    first = clean(row[i_first]) if i_first is not None else ""
                    last = clean(row[i_last]) if i_last is not None else ""
                    name = " ".join(x for x in (first, last) if x)
                if not name:
                    continue
                npi = clean(row[i_npi])
                claim = claims.get(str(npi), {}) if isinstance(claims, dict) else {}
                cats = classify(name, claim)
                tags = ["NEMT", "Medical Transport Van"] + cats
                provider = {
                    "name": name,
                    "city": clean(row[i_city]),
                    "state": state,
                    "zip": zip5(row[i_zip]),
                    "address1": clean(row[i_addr1]),
                    "address2": clean(row[i_addr2]) if i_addr2 is not None else "",
                    "phone": phone_format(row[i_phone]) if i_phone is not None else "",
                    "npi": npi,
                    "tags": tags,
                    "categories": cats,
                    "source": "CMS NPPES",
                    "sourceUrl": f"https://npiregistry.cms.hhs.gov/provider-view/{npi}",
                }
                if i_last_update is not None:
                    provider["nppesLastUpdate"] = clean(row[i_last_update])
                if isinstance(claim, dict) and claim:
                    for k in ("claimed", "dispatchEmail", "dispatchPhone", "website", "serviceArea", "services", "acceptsOnlineRequests"):
                        if k in claim:
                            provider[k] = claim[k]
                by_state[state].append(provider)
                matched += 1

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    state_manifest = []
    for abbr, state_name in STATES.items():
        providers = by_state.get(abbr, [])
        dedup = {p["npi"]: p for p in providers}
        providers = sorted(dedup.values(), key=lambda p: (p.get("city", ""), p.get("name", ""), p.get("npi", "")))
        category_ids = {"All": [p["npi"] for p in providers]}
        for cat in CATEGORIES:
            category_ids[cat] = [p["npi"] for p in providers if cat in p.get("categories", [])]
        category_counts = {k: len(v) for k, v in category_ids.items()}
        payload = {
            "state": abbr,
            "stateName": state_name,
            "taxonomy": TAXONOMY_CODE,
            "taxonomyDescription": "Non-emergency Medical Transport (VAN)",
            "generatedAt": generated,
            "source": "CMS NPPES Data Dissemination",
            "sourceUrl": source_url,
            "providerCount": len(providers),
            "categoryCounts": category_counts,
            "categories": category_ids,
            "providers": providers,
        }
        (out_dir / f"{abbr}.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        state_manifest.append({"abbr": abbr, "name": state_name, "providerCount": len(providers), "categoryCounts": category_counts, "file": f"data/providers/{abbr}.json"})
        print(f"{abbr}: {len(providers):,}", flush=True)

    Path("states.json").write_text(json.dumps([{"abbr": a, "name": n} for a, n in STATES.items()], indent=2), encoding="utf-8")
    Path("data").mkdir(exist_ok=True)
    Path("data/provider-index.json").write_text(json.dumps({
        "generatedAt": generated,
        "source": "CMS NPPES Data Dissemination",
        "sourceUrl": source_url,
        "taxonomy": TAXONOMY_CODE,
        "categories": ["All"] + CATEGORIES,
        "states": state_manifest,
        "totalProviders": sum(x["providerCount"] for x in state_manifest),
        "classificationNote": "All Providers is complete for active NPPES records carrying taxonomy 343900000X in the monthly dissemination file. Service-specific categories are assigned only when explicit evidence appears in the provider name or verified/claimed service data; NPPES does not itself certify those service offerings."
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Total matched active NEMT providers: {sum(x['providerCount'] for x in state_manifest):,}")


if __name__ == "__main__":
    main()

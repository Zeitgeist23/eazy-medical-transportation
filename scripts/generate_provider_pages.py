#!/usr/bin/env python3
import html, json, re, urllib.parse
from pathlib import Path

ROOT=Path('.')
DATA=ROOT/'data/providers/IL.json'
OUT=ROOT/'providers'
SITEMAP=ROOT/'sitemap.xml'
BASE='https://eazymedicaltransportation.com'
PRIORITY_CITIES=['CHICAGO','SCHAUMBURG','WAUKEGAN','NAPERVILLE','EVANSTON','SKOKIE','DES PLAINES','ARLINGTON HEIGHTS','ELGIN','AURORA']
MAX_PAGES=150
MAX_PER_CITY=30

def slugify(s): return re.sub(r'[^a-z0-9]+','-',(s or '').lower()).strip('-')[:70] or 'provider'
def esc(s): return html.escape(str(s or ''))
def purl(p): return f"/providers/{slugify(p.get('name'))}-{p.get('npi')}/"
def city_link(city):
    s=slugify(city)
    return {'chicago':'/illinois/chicago/','schaumburg':'/illinois/schaumburg/','waukegan':'/illinois/waukegan/','naperville':'/illinois/naperville/'}.get(s,'/illinois/')

def select(providers):
    orgs=[p for p in providers if str(p.get('entityType'))=='2']
    selected=[]; seen=set()
    for city in PRIORITY_CITIES:
        count=0
        for p in orgs:
            if p.get('city','').upper()!=city or p.get('npi') in seen: continue
            selected.append(p); seen.add(p.get('npi')); count+=1
            if count>=MAX_PER_CITY or len(selected)>=MAX_PAGES: break
        if len(selected)>=MAX_PAGES: break
    for p in orgs:
        if len(selected)>=MAX_PAGES: break
        if p.get('npi') not in seen: selected.append(p); seen.add(p.get('npi'))
    return selected

def render(p):
    raw_name=p.get('name',''); raw_city=p.get('city',''); raw_npi=str(p.get('npi',''))
    name=esc(raw_name); city=esc(raw_city); npi=esc(raw_npi)
    url=purl(p); canonical=BASE+url; clink=city_link(raw_city)
    source=p.get('sourceUrl') or f'https://npiregistry.cms.hhs.gov/provider-view/{raw_npi}'
    desc=f"Directory profile for {raw_name}, an NPI-listed non-emergency medical transport organization in {raw_city}, Illinois."
    claim='/claim-provider/?'+urllib.parse.urlencode({'npi':raw_npi,'provider':raw_name,'city':raw_city})
    phone=p.get('phone') or ''
    address=', '.join(x for x in [p.get('address1',''),p.get('address2',''),raw_city,'IL',p.get('zip','')] if x)
    schema={"@context":"https://schema.org","@type":"Organization","name":raw_name,"url":canonical,"identifier":{"@type":"PropertyValue","propertyID":"NPI","value":raw_npi},"address":{"@type":"PostalAddress","streetAddress":" ".join(x for x in [p.get('address1',''),p.get('address2','')] if x),"addressLocality":raw_city,"addressRegion":"IL","postalCode":p.get('zip',''),"addressCountry":"US"}}
    if phone: schema['telephone']=phone
    crumbs={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":BASE+'/'},{"@type":"ListItem","position":2,"name":"Illinois NEMT","item":BASE+'/illinois/'},{"@type":"ListItem","position":3,"name":raw_name,"item":canonical}]}
    ld=json.dumps([schema,crumbs],separators=(',',':')).replace('</','<\\/')
    phone_html=f'<p><strong>Phone:</strong> <a href="tel:{esc(phone)}">{esc(phone)}</a></p>' if phone else '<p><strong>Phone:</strong> Verify through the provider or NPI source.</p>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{name} | NEMT Provider in {city}, IL | Eazy</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{canonical}"><script type="application/ld+json">{ld}</script><style>body{{margin:0;font-family:Arial,sans-serif;color:#153a56;background:#f7fbfc}}header{{background:#087f91;color:#fff;text-align:center;padding:11px 18px;font-weight:700;font-size:13px}}nav{{background:#fff;border-bottom:1px solid #d7e7eb;padding:18px 6%;display:flex;gap:24px;flex-wrap:wrap}}nav a{{color:#0b3552;text-decoration:none;font-weight:700}}main{{max-width:940px;margin:auto;padding:48px 22px 70px}}h1{{font-size:40px;line-height:1.08;margin:0 0 12px}}p,li{{font-size:16px;line-height:1.7;color:#4c6676}}.crumbs{{font-size:13px;margin-bottom:18px}}.card{{background:#fff;border:1px solid #d7e7eb;border-radius:16px;padding:24px;margin:26px 0}}.pill{{display:inline-block;background:#e6f5f6;color:#087f91;border-radius:999px;padding:6px 10px;font-weight:700;font-size:12px}}.actions{{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}}.actions a{{background:#087f91;color:#fff;padding:12px 16px;border-radius:9px;text-decoration:none;font-weight:700}}.actions a.secondary{{background:#fff;color:#087f91;border:1px solid #9fd5dc}}</style></head><body><header>EazyMedicalTransportation.com is an independent directory and is not owned by or affiliated with any transportation provider listed on this site.</header><nav><a href="/">Home</a><a href="/browse/">Browse Providers</a><a href="/guides/">NEMT Guides</a><a href="/illinois/">Illinois NEMT</a></nav><main><div class="crumbs"><a href="/">Home</a> › <a href="/illinois/">Illinois</a> › {name}</div><span class="pill">Independent business listing</span><h1>{name}</h1><p>Non-emergency medical transportation organization listed in {city}, Illinois.</p><div class="card"><h2>Directory information</h2><p><strong>Address:</strong> {esc(address)}</p>{phone_html}<p><strong>NPI:</strong> {npi}</p><p><strong>NPPES taxonomy:</strong> Non-emergency Medical Transport (VAN) — 343900000X</p></div><h2>What this listing means</h2><p>This profile is based on CMS NPPES data identifying the organization with the non-emergency medical transport (van) taxonomy. The taxonomy does not by itself confirm specific services, service area, current availability, insurance participation or pricing.</p><h2>Questions to ask before arranging a ride</h2><ul><li>Do you serve the pickup and destination locations?</li><li>Do you provide wheelchair or other mobility assistance if needed?</li><li>Can you accommodate recurring appointments such as dialysis?</li><li>What payment methods or transportation benefits do you accept?</li><li>How are return trips and changing appointment times handled?</li></ul><div class="actions"><a href="{clink}">Browse {city} providers</a><a href="{claim}" class="secondary">Claim / Update This Profile</a><a href="{esc(source)}" rel="nofollow" class="secondary">View NPI source</a></div><p style="margin-top:28px"><a href="/guides/how-to-choose-a-nemt-provider/">Read: How to choose an NEMT provider</a> · <a href="/guides/wheelchair-transportation-guide/">Wheelchair transportation guide</a></p></main></body></html>'''

def update_sitemap(urls):
    text=SITEMAP.read_text(encoding='utf-8')
    text=re.sub(r'\s*<url><loc>https://eazymedicaltransportation\.com/providers/.*?</url>','',text)
    block='\n'.join(f'  <url><loc>{BASE}{u}</loc><lastmod>2026-08-11</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>' for u in urls)
    SITEMAP.write_text(text.replace('</urlset>',block+'\n</urlset>'),encoding='utf-8')

def main():
    data=json.loads(DATA.read_text(encoding='utf-8')); chosen=select(data.get('providers',[])); OUT.mkdir(exist_ok=True)
    for d in list(OUT.iterdir()):
        if d.is_dir() and (d/'index.html').exists():
            for f in d.iterdir(): f.unlink()
            d.rmdir()
    urls=[]
    for p in chosen:
        d=ROOT/purl(p).strip('/'); d.mkdir(parents=True,exist_ok=True); (d/'index.html').write_text(render(p),encoding='utf-8'); urls.append(purl(p))
    (OUT/'index.json').write_text(json.dumps([{'name':p.get('name'),'city':p.get('city'),'npi':p.get('npi'),'url':purl(p)} for p in chosen],indent=2),encoding='utf-8')
    update_sitemap(urls); print(f'Generated {len(chosen)} organization provider pages')

if __name__=='__main__': main()

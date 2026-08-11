#!/usr/bin/env python3
from pathlib import Path
p=Path('scripts/build_national_provider_db.py')
s=p.read_text(encoding='utf-8')
needle='''                provider = {\n                    "name": name,\n                    "city": clean(row[i_city]),'''
repl='''                provider = {\n                    "name": name,\n                    "entityType": entity,\n                    "city": clean(row[i_city]),'''
if '"entityType": entity' not in s:
    if needle not in s:
        raise SystemExit('provider dictionary anchor not found')
    s=s.replace(needle,repl,1)
    p.write_text(s,encoding='utf-8')
    print('Added entityType to provider records')
else:
    print('entityType already present')

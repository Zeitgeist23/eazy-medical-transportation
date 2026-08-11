#!/usr/bin/env python3
from pathlib import Path
import re

ROOT=Path('.')
SRC=ROOT/'sitemap.xml'
PROVIDERS=ROOT/'provider-sitemap.xml'
CONTENT=ROOT/'content-sitemap.xml'

def wrap(urls):
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(urls) + '\n</urlset>\n'

def main():
    text=SRC.read_text(encoding='utf-8')
    entries=re.findall(r'\s*<url>.*?</url>',text,flags=re.S)
    provider=[]; content=[]
    for e in entries:
        if '/providers/' in e:
            provider.append(e.strip())
        else:
            content.append(e.strip())
    PROVIDERS.write_text(wrap(provider),encoding='utf-8')
    CONTENT.write_text(wrap(content),encoding='utf-8')
    print('provider sitemap URLs:',len(provider))
    print('content sitemap URLs:',len(content))

if __name__=='__main__': main()

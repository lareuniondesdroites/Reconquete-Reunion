#!/usr/bin/env python3
import json, re, sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CFG = json.loads((ROOT / 'automation' / 'local-config.json').read_text(encoding='utf-8'))
OUT = ROOT / CFG.get('output', 'local-auto-data.js')

MONTHS = {
    'janvier':1,'février':2,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'aout':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12,'decembre':12
}

def load_existing():
    if not OUT.exists(): return []
    text=OUT.read_text(encoding='utf-8')
    m=re.search(r'window\.LOCAL_AUTO_DATA\s*=\s*(\[.*\])\s*;?\s*$',text,re.S)
    if not m: return []
    try: return json.loads(m.group(1))
    except Exception: return []

def normalize_date(text):
    m=re.search(r'\b(\d{1,2})/(\d{1,2})/(20\d{2})\b', text)
    if m:
        d,mo,y=map(int,m.groups()); return f'{y:04d}-{mo:02d}-{d:02d}'
    low=' '.join(text.lower().split())
    m=re.search(r'\b(\d{1,2})\s+('+'|'.join(MONTHS)+r')\s+(20\d{2})\b', low)
    if m:
        d=int(m.group(1)); mo=MONTHS[m.group(2)]; y=int(m.group(3)); return f'{y:04d}-{mo:02d}-{d:02d}'
    return ''

def themes(title):
    t=title.lower(); out=[]
    rules=[
      ('Municipales','municipal'),('Élections','élection'),('Élections','election'),('Sécurité','sécur'),
      ('Éducation','école'),('Éducation','lycée'),('Agriculture','canne'),('Agriculture','agric'),
      ('Économie','économ'),('Identité','identit'),('Laïcité','laïc'),('Immigration','immig'),
      ('Vie de la fédération','déjeuner'),('Vie de la fédération','réunion'),('Vie de la fédération','nomination'),
      ('International','comores'),('International','azerbaïdjan'),('Communiqué','communiqué')]
    for label,needle in rules:
        if needle in t and label not in out: out.append(label)
    return out or ['Actualité locale']

def zone(title):
    t=title.lower()
    for label, needles in [('Nord',['saint-denis','sainte-marie','sainte suzanne','sainte-suzanne']),('Est',['saint-andré','saint-benoît','saint-andre','saint-benoit']),('Sud',['sud','saint-pierre','saint-joseph','saint-philippe','le tampon']),('Ouest',['ouest','saint-paul','le port','la possession','trois-bassins'])]:
        if any(n in t for n in needles): return label
    return 'La Réunion'

def fetch_detail(session,url):
    try:
        r=session.get(url,timeout=20); r.raise_for_status(); soup=BeautifulSoup(r.text,'html.parser')
        text=' '.join(soup.stripped_strings)
        date=normalize_date(text[:2500])
        desc=''
        meta=soup.find('meta',attrs={'name':'description'}) or soup.find('meta',attrs={'property':'og:description'})
        if meta and meta.get('content'): desc=' '.join(meta['content'].split())[:260]
        return date,desc
    except Exception:
        return '',''

def main():
    session=requests.Session(); session.headers['User-Agent']='Reconquete-Reunion-LocalArchive/1.0 (+GitHub Pages)'
    r=session.get(CFG['listing_url'],timeout=30); r.raise_for_status(); soup=BeautifulSoup(r.text,'html.parser')
    existing=load_existing(); by_url={x.get('url'):x for x in existing if x.get('url')}
    found=[]
    for a in soup.find_all('a',href=True):
        href=a.get('href','')
        if '/article/' not in href and '/communique-de-presse/' not in href: continue
        url=urljoin(CFG['base_url'],href)
        title=' '.join(a.stripped_strings).strip()
        if len(title)<5: continue
        parent=a.parent
        context=' '.join(parent.stripped_strings) if parent else title
        date=normalize_date(context)
        desc=''
        if not date:
            date,desc=fetch_detail(session,url)
        if not date: date=by_url.get(url,{}).get('date','')
        kind='communique' if '/communique-de-presse/' in href else 'article'
        item={
          'date':date,
          'type':kind,
          'title':title,
          'url':url,
          'source':'Fédération Reconquête La Réunion — site officiel',
          'sourceKind':'Communiqué officiel' if kind=='communique' else 'Publication officielle',
          'zone':zone(title),
          'themes':themes(('communiqué ' if kind=='communique' else '')+title),
          'excerpt':desc or ('Communiqué officiel de la fédération. Le portail renvoie vers la source pour le texte intégral.' if kind=='communique' else 'Publication publique de la fédération de La Réunion. Consultez la source officielle pour le texte intégral.'),
          'auto':True
        }
        found.append(item)
    merged={x.get('url') or (x.get('date','')+'|'+x.get('title','')):x for x in existing}
    for x in found:
        key=x.get('url') or (x.get('date','')+'|'+x.get('title',''))
        old=merged.get(key,{})
        if not x.get('date') and old.get('date'): x['date']=old['date']
        merged[key]={**old,**x}
    data=sorted(merged.values(),key=lambda x:(x.get('date',''),x.get('title','')),reverse=True)[:int(CFG.get('max_items',200))]
    OUT.write_text('// Mis à jour automatiquement par .github/workflows/update-local.yml\nwindow.LOCAL_AUTO_DATA = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    print(f'{len(found)} liens locaux détectés; {len(data)} entrées conservées.')

if __name__=='__main__':
    try: main()
    except Exception as exc:
        print(f'Erreur mise à jour locale: {exc}',file=sys.stderr); sys.exit(1)

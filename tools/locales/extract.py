from pathlib import Path
from lxml import html
import re,json,argparse
parser=argparse.ArgumentParser(description='Extract public-site strings while preserving existing translation IDs.')
parser.add_argument('--seed-app',type=Path,help='Optional application locale directory used to seed NEW translation catalogs.')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[2]
ATTRS=['placeholder','title','alt','aria-label','data-label-read','data-label-wait','data-error','data-empty','data-snapshot','data-open','data-remove','data-saved','data-failure']
SKIP='script,style,svg,.lang-menu,.footer-langs'.split(',')
strings={};pages={}
norm=lambda v:re.sub(r'\s+',' ',v).strip()
def add(v,page):
 t=norm(v)
 if t and re.search(r'[a-zA-Z]',t):
  strings.setdefault(t,[])
  if page not in strings[t]:strings[t].append(page)
def jsonstrings(value,page):
 if isinstance(value,str):
  if not value.startswith(('en-','http')):add(value,page)
 elif isinstance(value,list):
  for v in value:jsonstrings(v,page)
 elif isinstance(value,dict):
  for k,v in value.items():
   if k not in ['link','faq_link','id','agency']:jsonstrings(v,page)
files=sorted(ROOT.glob('en-*.html'),key=lambda p:(p.name!='en-index.html',p.name))
for f in files:
 name=f.name.removeprefix('en-')
 if re.match(r'^(w-|a-|e-|jobs|job-\d|login|forgot|register-(worker|employer|agency))',name):continue
 doc=html.fromstring(f.read_text());pages[f.name]=True
 for e in list(doc.xpath('//script|//style|//*[local-name()="svg"]|//*[contains(concat(" ",normalize-space(@class)," ")," lang-menu ") or contains(concat(" ",normalize-space(@class)," ")," footer-langs ")]')):
  if e.getparent() is not None:e.drop_tree()
 for t in doc.xpath('//text()'):add(str(t),f.name)
 for e in doc.iter():
  for a in ATTRS:
   if e.get(a):add(e.get(a),f.name)
  if e.tag=='meta' and (e.get('name')=='description' or e.get('property') in ['og:title','og:description']):add(e.get('content',''),f.name)
  for a in ['data-compare','data-compare-ui']:
   if e.get(a):jsonstrings(json.loads(e.get(a)),f.name)
jsonstrings(json.loads((ROOT/'en-assistant-faq.json').read_text()),'en-assistant-faq.json')
add('This feature is currently unavailable. No data was sent.','runtime')
add('Loading language…','runtime')
add('The language could not be loaded. Please try again.','runtime')
# Preserve IDs already used by deployed catalogs; append newly discovered strings.
existing=ROOT/'static/locales/site-source.json'
source=json.loads(existing.read_text()) if existing.exists() else {}
known=set(source.values())
next_id=max([int(key[1:]) for key in source]+[0])+1
for value in strings:
 if value not in known:
  source[f'p{next_id:04d}']=value;known.add(value);next_id+=1
(ROOT/'tools/locales/source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(ROOT/'tools/locales/pages.json').write_text(json.dumps(list(pages),indent=2)+'\n')
(ROOT/'static/locales/site-source.json').write_text(json.dumps(source,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'pages':len(pages),'strings':len(source),'characters':sum(map(len,source.values()))}))
if not args.seed_app:raise SystemExit(0)
app=args.seed_app;en=json.loads((app/'en.json').read_text());inverse={norm(v):k for k,v in en.items()}
for loc in ['ar','ur','bn','fil','de','fr','hi','ne','ru','ky','tg','ka','sw','uz']:
 catalog=json.loads((app/(loc+'.json')).read_text());seed={};remaining={}
 for key,value in source.items():
  if value in inverse:seed[key]=catalog[inverse[value]]
  elif re.search(r'\b(?:LLC|GmbH|Sp\. z o\.o\.|d\.o\.o\.|S\.L\.|s\.r\.o\.|BV|B\.V\.)\b',value) or value in ['Workify','HomeSend','YouTube','WhatsApp','PDF','JPG','PNG','English A2','USD','AED','EUR','SAR','QAR','KWD','OMR','BHD','CHF','PLN','CZK','HUF','RON','SEK','NOK','DKK','RSD','BAM','MKD','ALL'] or '@' in value or re.match(r'^https?://',value):seed[key]=value
  else:remaining[key]=value
 (ROOT/'tools/locales'/('seed-'+loc+'.json')).write_text(json.dumps(seed,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'tools/locales'/('remaining-'+loc+'.json')).write_text(json.dumps(remaining,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pages':len(pages),'strings':len(source),'characters':sum(map(len,source.values())),'remaining':len(remaining),'remainingChars':sum(map(len,remaining.values()))}))

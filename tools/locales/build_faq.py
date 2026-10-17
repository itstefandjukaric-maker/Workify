"""Validate public-site catalogs and build the matching local help answers."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
LOCALES = sys.argv[1:] or 'ar bn de fil fr hi ka ky ne ru sw tg ur uz'.split()
source = json.loads((ROOT / 'static/locales/site-source.json').read_text())
faq = json.loads((ROOT / 'en-assistant-faq.json').read_text())
norm = lambda value: re.sub(r'\s+', ' ', value).strip()

def translate(value, dictionary, key=None):
    if key in ('link', 'faq_link', 'id', 'agency'):
        return value
    if isinstance(value, str):
        return dictionary[norm(value)]
    if isinstance(value, list):
        return [translate(item, dictionary) for item in value]
    if isinstance(value, dict):
        return {k: translate(v, dictionary, k) for k, v in value.items()}
    return value

for locale in LOCALES:
    path = ROOT / f'static/locales/site-{locale}.json'
    catalog = json.loads(path.read_text())
    assert set(catalog) == set(source), f'{locale}: missing or extra keys'
    for key, original in source.items():
        value = catalog[key]
        assert isinstance(value, str) and value.strip(), f'{locale}/{key}: empty'
        assert sorted(re.findall(r'\{\w+\}', value)) == sorted(re.findall(r'\{\w+\}', original)), f'{locale}/{key}: placeholders'
    dictionary = {norm(value): catalog[key] for key, value in source.items()}
    target = translate(faq, dictionary)
    (ROOT / f'static/locales/faq-{locale}.json').write_text(json.dumps(target, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{locale}: {len(catalog)} translations, {len(target["entries"])} help answers')

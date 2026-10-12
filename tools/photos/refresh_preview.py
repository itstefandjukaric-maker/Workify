"""Refresh the existing static preview without changing its routes or demo functions.

The manifest maps every old gallery image explicitly to a reviewed stock photograph.
This migration is idempotent; actual employer uploads are not part of this repository.
"""
import html
import json
import re
from pathlib import Path

from fetch_workify import main as fetch_photos

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads(Path(__file__).with_name("workify-photos.json").read_text())
CSS = """
/* Real photographs: keep their illustrative role clear on fictional demo ads. */
.jc-photo-note { position: absolute; inset-inline-end: .75rem; inset-block-end: .75rem; z-index: 2; padding: .2rem .5rem; border-radius: .35rem; color: #fff; background: #131d32; font-size: .68rem; line-height: 1.4; pointer-events: none; }
.gallery-photo-note { margin-block: 1rem .25rem; }
.how-static { margin-block: 0 3rem; max-inline-size: 54rem; }
.how-static h2 { margin-block: 0 .25rem; }
.how-static p { margin: 0; }
"""


def static_steps(match):
    scenes = re.findall(r'<article class="ex-scene".*?</article>', match.group(), re.S)
    rows = []
    for i, scene in enumerate(scenes, 1):
        title = re.search(r'<h2 class="ex-title">(.*?)</h2>', scene, re.S).group(1)
        body = re.search(r'<p class="ex-text"[^>]*>(.*?)</p>', scene, re.S).group(1)
        rows.append(f'<li class="how-step"><span class="how-num" aria-hidden="true">{i}</span>'
                    f'<div class="how-body"><h2 class="h4">{title}</h2><p>{body}</p></div></li>')
    assert len(rows) == 8, "Expected all eight employment steps"
    return '<ol class="how-steps how-static">' + ''.join(rows) + '</ol>'


def main():
    fetch_photos()
    count = 0
    for path in ROOT.glob("*.html"):
        before = path.read_text()
        text = before
        lang = "en" if path.name.startswith("en-") else "bhs"
        label = "Stock photo" if lang == "en" else "Primjer fotografije"
        for old, new in MANIFEST["copy"][lang].items():
            text = text.replace(html.escape(old), html.escape(new)).replace(old, new)
        # Avoid stale cached art and broken absolute /media/ srcset URLs on GitHub Pages.
        for token, photo in MANIFEST["preview_media"].items():
            text = re.sub(rf'(?<![\w/])/?media/{token}(-sm|-xs)?\.jpg(?:\?[^\s,"<>]*)?',
                          lambda m: f'static/img/photos/{photo}{m.group(1) or ""}.jpg', text)
        text = re.sub(r'<figure class="gallery-item gallery-video">.*?</figure>', '', text, flags=re.S)
        if '<video' in text:
            text = re.sub(r'<li class="media-item">(?:(?!</li>).)*?<video.*?</li>', '', text, flags=re.S)
            text = text.replace('>1 od 1</span>', '>0 od 1</span>').replace('>1 of 1</span>', '>0 of 1</span>')
            text = re.sub(r'<ul class="media-grid">\s*</ul>', '', text)
        text = re.sub(r'<span class="jc-badge">(?:(?!</span>).)*?\bVideo</span>', '', text, flags=re.S)
        if 'jc-photo-note' not in text:
            text = text.replace('<div class="jc-media">', f'<div class="jc-media"><span class="jc-photo-note">{label}</span>')
        if 'gallery-band' in text and 'gallery-photo-note' not in text:
            text = text.replace('<div class="gallery-controls">',
                                f'<p class="small muted gallery-photo-note">{MANIFEST["demo_notes"][lang]}</p><div class="gallery-controls">')
        text = re.sub(r'<section class="explainer".*?</section>', static_steps, text, flags=re.S)
        text = text.replace('static/img/pictures/error.png', 'static/img/pictures/error.jpg')
        # A release query refreshes existing marketing image paths and the stylesheet.
        text = re.sub(r'(static/img/pictures/[\w-]+\.jpg)(?:\?[^\s,"<>]*)?', r'\1?v=europe-15', text)

        if text != before:
            path.write_text(text)
            count += 1
    css_path = ROOT / "static/css/app.css"
    css = css_path.read_text()
    if '.jc-photo-note {' not in css:
        css_path.write_text(css + CSS)
    print(f"Updated {count} pages; all {len(MANIFEST['preview_media'])} gallery photos mapped explicitly.")


if __name__ == "__main__":
    main()

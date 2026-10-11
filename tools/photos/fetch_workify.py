"""Download the licensed photographs in workify-photos.json; never generate substitutes.

Only resize/re-encode photographs, strip metadata, and keep their source links.
Run from the source repository or the static Pages repository.
"""
from concurrent.futures import ThreadPoolExecutor
import io
import json
from pathlib import Path
import urllib.request

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads(Path(__file__).with_name("workify-photos.json").read_text())
STATIC = ROOT / ("workify/static" if (ROOT / "workify").is_dir() else "static")


def encode(raw, width):
    with Image.open(io.BytesIO(raw)) as original:
        photo = ImageOps.exif_transpose(original).convert("RGB")
        photo.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        photo.save(out, "JPEG", quality=82, optimize=True, progressive=True)
        return out.getvalue()


def fetch(item):
    key, entry = item
    path = STATIC / "img" / "photos" / f"{key}.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        request = urllib.request.Request(entry["url"], headers={"User-Agent": "Workify-photo-import/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
        path.write_bytes(encode(data, 1600))
    raw = path.read_bytes()
    for suffix, width in (("-sm", 640), ("-xs", 256)):
        path.with_name(f"{key}{suffix}.jpg").write_bytes(encode(raw, width))
    print(f"Photo ready: {key}", flush=True)
    return key, raw


def main():
    with ThreadPoolExecutor(max_workers=4) as pool:
        pictures = dict(pool.map(fetch, MANIFEST["photos"].items()))
    target = STATIC / "img" / "pictures"
    target.mkdir(parents=True, exist_ok=True)
    for name, key in MANIFEST["marketing"].items():
        for suffix, width in (("", 1600), ("-sm", 800)):
            (target / f"{name}{suffix}.jpg").write_bytes(encode(pictures[key], width))
    (target / "VISUALS.md").write_text(
        "# Workify photography\n\n" + MANIFEST["notice"] + "\n\n"
        + "License: " + MANIFEST["license"] + "\n\n"
        + "\n".join(f"- {key}: {p['page']}" for key, p in MANIFEST["photos"].items()) + "\n")


if __name__ == "__main__":
    main()

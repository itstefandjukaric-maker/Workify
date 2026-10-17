# Public website translations

The original BHS and English HTML pages remain the base layouts. `static/js/preview.js`
loads the matching public catalog for the other 14 languages, retains the current
public page and selected language, and passes that language to application links.
Arabic and Urdu use RTL. Text inside the existing video is not dubbed or replaced.

- `static/locales/site-source.json`: stable IDs and original English strings.
- `static/locales/site-<language>.json`: 1:1 catalogs, including page metadata and help text.
- `static/locales/faq-<language>.json`: generated local assistant answers.
- `pages.json`: English base pages covered by translation.

After changing public copy, run `python tools/locales/extract.py` (requires `lxml`).
Existing IDs are preserved and new ones are appended. Translate new strings in every
catalog, preserving placeholders, factual amounts and official names. Then run
`python tools/locales/build_faq.py` to validate catalogs and rebuild the help assets.
Optional language arguments build only those catalogs.

The runtime test uses Node and `linkedom`. Install `linkedom` in a separate npm tools
directory, set `WORKIFY_TEST_TOOLS` to that directory, and run
`node tools/locales/test-runtime.mjs`. Optional language arguments limit the run.
It checks every public page's language choices, page retention, application links,
titles, RTL, remembered settings, dynamically inserted help text and user-text isolation.
It is a DOM test, not a visual browser test.

Publish catalogs before activating the runtime. Update the asset version in public
HTML and `sw.js` when changing runtime or CSS so previously installed clients refresh.

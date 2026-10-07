# Fonts

All fonts are licensed under the SIL Open Font License 1.1 (see the OFL-*.txt files).
They were subset to the scripts the site uses and converted to WOFF2.

| Files | Family | Source |
|---|---|---|
| `inter-*` | Inter 4.1 (text and UI) | github.com/rsms/inter |
| `fira-xc-*` | Fira Sans Extra Condensed (headings, departures board, numbers) | github.com/google/fonts (ofl/firasansextracondensed) |
| `noto-devanagari` | Noto Sans Devanagari (Hindi, Nepali), variable weight | github.com/notofonts |
| `noto-bengali` | Noto Sans Bengali, variable weight | github.com/notofonts |
| `noto-arabic` | Noto Sans Arabic, variable weight | github.com/notofonts |
| `noto-georgian` | Noto Sans Georgian, variable weight | github.com/notofonts |

`-lat` files cover Latin and Latin Extended-A (all Latin-script languages of the site, including
Uzbek ʻ and ʼ), `-cyr` files cover Cyrillic including Tajik letters. `@font-face` rules with
`unicode-range` in `css/app.css` make browsers download only the files a page needs.

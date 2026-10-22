# Workify – pregled dizajna

Statični pregled Workify sajta, aplikacije za radnike i konzole za agencije.
Sve firme, osobe i oglasi su izmišljeni, a forme ništa ne šalju.

Link: https://itstefandjukaric-maker.github.io/Workify/

*Design preview of Workify (website, worker app, agency console). Every company, person and job is fictional.*

## GitHub-only navigation (2026-10-21)

The shared public link and all login, registration, worker, employer and agency
preview pages stay under `https://itstefandjukaric-maker.github.io/Workify/`.
There is no navigation to the separate private application or a ChatGPT sign-in.
Direct bookmarks, dynamically inserted links, search links and language switches
use the same GitHub Pages origin and retain `lang`. A business registration form's
agency/employer selection also survives a language switch via the allowlisted
`kind` query parameter; this is a display preference, not an authenticated role.

This repository remains a static design preview. Email/phone sign-in, password
recovery, account creation, verification, applications and personal-data uploads
are **not implemented here**. Auth pages show an availability notice in the chosen
language, and submissions stay on the page without sending data or claiming
success. Search links retain filters, but the listed jobs remain static examples.
A separate authentication and data service is required for real accounts; it must
not be confused with allowing someone to view the public design.

### Regression checks

Run `npm ci --ignore-scripts` followed by `npm test` (Node 22 or newer).
The GitHub Actions workflow runs the same checks on main pushes and pull requests.

- Eight navigation tests exercise login, phone login, recovery, all three
  registration roles, public role CTAs, direct dashboard links, dynamic links,
  invalid/remembered language, blocked browser storage, role retention, form
  submission blocking, and refreshed assets.
- Navigation checks cover all 16 supported language selections and both RTL languages.
- The existing translation runtime tests cover 45 public pages × 16 languages
  (720 combinations). They now explicitly require same-origin GitHub links.
- The navigation tests fail against the old redirecting runtime. No production
  account, personal information or private application data is used by tests.

Validation includes a browser check of local navigation, the unavailable-login
message, and an employer selection retained when changing BHS to English.
The 14 additional translation catalogs primarily cover public marketing/help
pages; preserving a language selection on an older account/console preview does
not mean every string on those legacy screens is translated.

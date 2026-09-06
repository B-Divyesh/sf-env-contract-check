# Validate `.env` files before services start — verification 3

## Verdict

**PASS**

- Findings: **0**
- Untested public claims: **0**
- Verified: September 6, 2026 UTC
- Live URL: https://env-contract-check.sociobot.in
- Implementation reviewed: `655f7ee0eb7d46158578ef7a62d7ac3235039eb7`
- Documentation baseline reviewed: `fbfac54`
- Factory envelope reviewed: `d78fc15303301f0be0fed16c3e615b715e93f598`

The implementation and documentation SHAs differ because the live product was deployed from `655f7ee`, then verification and handoff documents were committed. The later factory envelope changes only pre-existing Graphify output. A clean build of `655f7ee` matches all 20 live application payloads by SHA-256.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 phone contexts showed the complete first action without scrolling.

| Required item | Live text and result |
| --- | --- |
| Job | “Validate `.env` files before services start” |
| Audience | Developers moving settings across laptops, CI, Docker, and deployments |
| First action | “Try it with sample data” |
| What happens | Loads a sample `.env` and checks Docker parser rules |
| Three facts | Runs offline; prints no secret values; free under the MIT License |

The action ended at 727 px on desktop and 565 px on phone. Both were inside the initial viewport. Neither viewport had horizontal overflow or a load-time console error.

## Clean checkout and build

A separate clone was checked out at the implementation SHA. Documented setup used `npm ci`, which reported zero vulnerabilities.

- Every command in `.factory/claims.json` passed independently.
- `npm test` passed 9 Rust tests and 31 browser tests with no failures or skips.
- `npm run build` passed. It created the release binary, verified the Cargo package, and created `dist/site/`.
- Production output is 5.65 kB JavaScript and 14.69 kB CSS before compression. The packaged crate is 16.4 KiB compressed.

## Public claims

Each exact claim command ran from the clean checkout after documented setup.

| Claim | Exact command | Result and observed outcome |
| --- | --- | --- |
| Typed parser validation | `npm run test:claims -- --grep @claim:typed-parser-validation` | PASS; Node, Docker, and Python fixtures produced the expected type, bound, placeholder, unused-key, quote, and interpolation diagnostics. |
| Redacted output | `npm run test:claims -- --grep @claim:redacted-output` | PASS; human and JSON reports omitted the canary while reporting changed state. |
| CI interface | `npm run test:claims -- --grep @claim:ci-interface` | PASS; JSON parsed and exit codes 0, 1, and 2 matched the documentation. |
| Demo command | `npm run test:claims -- --grep @claim:demo-command` | PASS; the CLI wrote bundled files under a new system temporary directory and ran them. |
| Docker demo findings | `npm run test:claims -- --grep @claim:docker-demo-findings` | PASS; a clean installed CLI returned 3 errors and 3 warnings, included `literal_quotes` and `invalid_type`, omitted values, and exited 1. |
| Local operation | `npm run test:claims -- --grep @claim:local-operation` | PASS; the socket-denial shim observed no attempted connection. |
| Demo sandbox | `npm run test:claims -- --grep @claim:demo-sandbox` | PASS; the sample stayed in memory, the canary was redacted, reset restored input, and reload discarded edits. |
| Offline reload | `npm run test:claims -- --grep @claim:offline-reload` | PASS; a dedicated service-worker context reloaded the populated demo after networking was disabled. |
| Consumer install | `npm run test:claims -- --grep @claim:consumer-install` | PASS; a new Cargo install root received the CLI, ran its sample, and verified the MIT grant. |

The landing page, demo, legal pages, README, and CLI help were cross-checked against the manifest. No false, incomplete, missing, or untested public product claim was found.

## Installed CLI

A separate consumer root installed the artifact and exercised the real binary.

- `--version`, `--help`, `check --help`, and `demo --help` were usable and non-interactive.
- The Node demo returned a valid report with 4 checked keys and exit 0.
- `demo --profile docker --json` returned the documented redacted 3-error, 3-warning report and exit 1.
- Ports 1 and 65535 passed the bundled contract. An unreadable contract returned a clear message and exit 2.
- The Docker report contained no bundled environment value.

This is the full CLI, not a browser-only demonstration.

## Live sample and recovery paths

- One keyboard-activated click opened `/demo/` with the persistent “Demo — sample data, nothing is saved” label.
- The first populated result showed three errors and three warnings for realistic quoted Docker input.
- The same input passed under Node. Port 0 produced the 1–65535 error. Port 65535 passed.
- Empty input explained that `KEY=VALUE` lines were required. Reset restored the quoted input, Docker profile, label, and populated result.
- A unique database canary never appeared in output or a request body. The interaction added zero network requests.
- Local storage, session storage, IndexedDB, OPFS, cookies, and document cookies remained empty. All observed requests were same-origin.
- “Start for real” linked to the install instructions. Reload discarded the edited input.

## Accessibility, routes, privacy, and offline use

- The skip link was the first keyboard target. It was visible at 232×48.8 px with a 3 px focus outline and moved the page to `#main`.
- Keyboard submission moved focus to the result region, whose visible outline was 3 px. No keyboard trap was found.
- Reduced-motion animation and transition durations computed to `0.01ms`.
- Axe found zero violations of any severity on `/`, `/demo/`, `/privacy/`, `/terms/`, and the missing-page route.
- Every checked route had `lang=en`, one `h1`, one `main`, header, navigation, footer, image alternatives, and a route-specific title.
- Every phone footer link measured at least 44×44 CSS px on all five routes.
- The privacy and terms pages loaded. All internal destinations, assets, source links, `robots.txt`, and `sitemap.xml` resolved.
- `/this-page-does-not-exist` returned the complete designed page with HTTP 404. Its expected failed-resource console entry is not a defect.
- A fresh service-worker context reloaded `/demo/` offline with the sample label, populated result, and offline recovery text.
- `/opt/fleet/lib/verify-url.sh` passed with HTTPS 200, no console errors, and all basic semantic checks.

The static site and CLI have no accounts, payments, backend, tenant data, or hosted product state. Tenant isolation, restart persistence, health, SQLite, and 429/`Retry-After` checks do not apply. Deterministic local parsing does not need an AI-assisted step.

## Live response and performance checks

- All 20 served payload hashes matched the clean candidate build.
- HTML and `/sw.js` return `Cache-Control: no-cache`. Hashed assets, fonts, images, and icons return one-year immutable caching.
- Live responses include the expected CSP with `frame-ancestors 'none'`, Permissions-Policy, Referrer-Policy, HSTS, and `nosniff`.
- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, TBT 0 ms, transfer 164 KiB.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Claims manifest was missing | Fixed; nine declared commands passed independently. |
| First screen omitted the audience | Fixed; the job, developer audience, action, next step, and facts are visible before scrolling on phone and desktop. |
| Live CSP and Permissions-Policy were absent | Fixed; current live responses contain both policies. |
| Live cache policy used short-lived assets | Fixed; HTML and service worker are `no-cache`, and static assets are immutable for one year. |
| README legal links were broken | Fixed; repository targets exist and both live legal routes return 200. |
| Docker demo did not produce its documented quote findings | Fixed; a clean installed CLI proves the redacted 3-error, 3-warning outcome and exit 1. |
| Docker demo outcome was not declared or tested | Fixed; `docker-demo-findings` is an outcome-based installed-consumer claim test. |
| Short phone footer links were narrower than 44 px | Fixed; every checked live footer link is at least 44×44 px, with regression coverage. |

## Evidence

Browser JSON, screenshots, Lighthouse output, and the basic live verification output are in `/work/.evidence/env-contract-check-verify-3/`. The required report copy is `/work/.evidence/qa-report.md`.

# Validate `.env` files before services start — strict review 2

## Verdict

**PASS**

- Findings: **0**
- Untested public claims: **0**
- Reviewed: September 6, 2026 UTC
- Live URL: https://env-contract-check.sociobot.in
- Implementation reviewed: `655f7ee0eb7d46158578ef7a62d7ac3235039eb7`
- Documentation reviewed: `4cf1eb0f97b8ddd5150b7727d49a4db9a08b19f4`
- Public README last changed: `1a8872807ace794de955510c0d0544a725bbe358`
- Factory envelope reviewed: `d4d4bece0413f77a8c865b5bfbfa72a0dfa0edf4`

The runtime inputs after `655f7ee` are unchanged. Later commits update the README, verification documents, handoff, or pre-existing Graphify output. All 20 served live payloads match the clean implementation build by SHA-256.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 phone contexts showed the complete first-screen contract.

| Required item | Live evidence |
| --- | --- |
| Job | “Validate `.env` files before services start” |
| Audience | Developers moving settings across laptops, CI, Docker, and deployments |
| First action | “Try it with sample data” |
| What happens | Loads a sample `.env` and checks Docker parser rules |
| Three facts | Runs offline; prints no secret values; free under the MIT License |

The action ended at 727 px on desktop and 565 px on phone, inside both initial viewports. Neither view had horizontal overflow or a load-time console error.

## Live sample and recovery paths

- One click opened `/demo/` and immediately showed the persistent “Demo — sample data, nothing is saved” label.
- The realistic Docker sample produced 3 errors and 3 warnings for quoted `APP_PORT`, `DEBUG`, and the redacted `DATABASE_URL`.
- The same values passed with the Node profile. Ports 1 and 65535 passed; 0 and 65536 returned the stated range error.
- Invalid integer, Boolean, and URL values produced three named type errors. A missing required key, extra key, and empty file each produced a specific recovery message.
- Reset restored the quoted input, Docker profile, sample label, and populated 3-error/3-warning result.
- Keyboard submission moved focus to the result region. The first Tab target was the 232×48.8 px skip link with a visible 3 px outline.
- A unique database canary did not appear in the result or any request body. The interaction made no request. Local storage, session storage, IndexedDB, cookies, and document cookies remained empty.
- Reload discarded edits. “Start for real” opened the install section without retaining demo data.

## Declared public claims

Every exact command in `.factory/claims.json` ran independently after `npm ci` in a fresh clone. Each claim ID has exactly one matching test tag.

| Claim | Exact command result |
| --- | --- |
| Typed parser validation | PASS — required keys, types, bounds, unsafe placeholders, unused keys, and Node, Docker, and Python differences were asserted. |
| Redacted output | PASS — human and JSON comparison reports omitted the canary while reporting changed state. |
| CI interface | PASS — valid, invalid, and unreadable inputs returned parseable JSON and exit codes 0, 1, and 2. |
| Demo command | PASS — bundled files were written under a new system temporary directory and checked. |
| Docker demo findings | PASS — a clean installed CLI returned 3 errors, 3 warnings, `literal_quotes`, `invalid_type`, redacted output, and exit 1. |
| Local operation | PASS — the socket-denial shim observed no network attempt. |
| Demo sandbox | PASS — populated output, redaction, same-origin requests, empty storage, reset, and reload behavior were asserted. |
| Offline reload | PASS — a dedicated service-worker context reloaded the populated sample after networking was disabled. |
| Consumer install | PASS — a new Cargo root installed the package, ran its demo, and verified the MIT grant. |

The landing page, demo, legal pages, README, and CLI help were cross-checked against the manifest. No missing, false, incomplete, or untested public claim was found.

## Clean checkout and installed CLI

The clean checkout at `d4d4bec` used the documented `npm ci` setup and reported zero audit vulnerabilities. Its runtime input diff from `655f7ee` is empty.

- `npm test` passed 9 Rust tests and 31 Playwright tests with no failures or skips.
- `npm run build` passed. It produced the release binary, package-verified the 16.5 KiB compressed crate, and created `dist/site/`.
- A separately extracted crate installed into a new consumer root with `cargo install --path … --root … --locked --debug`.
- Installed `--version`, `--help`, `check --help`, and `demo --help` were useful and non-interactive.
- The installed Node demo checked four keys and exited 0. The Docker demo returned the documented redacted 3-error/3-warning report and exited 1. An unreadable contract produced a clear error and exit 2.

## Accessibility, routes, privacy, and offline use

- Axe found zero violations of any severity on `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed missing route.
- Every route has `lang=en`, one `h1`, one `main`, header, navigation, footer, route-specific title, and complete image alternatives.
- Every phone footer link measured at least 44×44 CSS px. A 640 px reflow check had no horizontal overflow or lost primary content.
- Reduced-motion animation and transition durations were `0.01ms`. There is no flashing or looping motion.
- All internal and source links resolved. `robots.txt` and `sitemap.xml` loaded and list the public routes.
- `/this-page-does-not-exist` returned the complete designed page with HTTP 404 and a route home. Its expected failed-resource console entry is not a defect.
- A fresh service-worker-controlled context reloaded `/demo/` offline with the sample label, populated result, and offline recovery text.
- `/opt/fleet/lib/verify-url.sh` passed with HTTPS 200, no console errors, and all basic semantic checks.
- Live responses include the expected CSP with `frame-ancestors 'none'`, Permissions-Policy, Referrer-Policy, HSTS, and `nosniff`. HTML and `/sw.js` use `no-cache`; static assets use one-year immutable caching.

The product has no accounts, payments, backend, tenant data, or hosted product state. Tenant isolation, restart persistence, health, SQLite, and 429/`Retry-After` checks do not apply. Deterministic local parsing does not benefit from an AI-assisted step.

## Performance and live parity

- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, TBT 0 ms, speed index 1.1 s, total transfer 164 KiB.
- Production output is 5.65 kB JavaScript and 14.69 kB CSS before compression. Local fonts total 97.6 kB and the mobile hero is 58.7 kB.
- All 20 served payload hashes match the clean candidate build. `staticwebapp.config.json` correctly returns 404 because the host consumes it as deployment configuration.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Required claims manifest was missing | Fixed — nine declared commands passed independently, each with one claim test. |
| First screen omitted the audience | Fixed — job, audience, action, next step, and facts appear before scrolling on desktop and phone. |
| Live CSP and Permissions-Policy were absent | Fixed — both policies are present on current live responses. |
| Live assets and service worker used short caching | Fixed — HTML and service worker are `no-cache`; static assets are immutable for one year. |
| README legal links were broken | Fixed — repository paths exist and both live legal routes return 200. |
| Docker CLI demo did not produce documented quote findings | Fixed — the clean installed artifact returns the documented redacted result and exit 1. |
| Docker demo outcome was unlisted and untested | Fixed — `docker-demo-findings` is declared and its exact installed-consumer test passes. |
| Short phone footer links were under 44 px wide | Fixed — every checked footer link is at least 44×44 px on all five routes. |

## Evidence

Screenshots, Lighthouse JSON, and basic URL-verifier output are under `/work/.evidence/env-contract-check-review-2/`. The required report copy is `/work/.evidence/qa-report.md`.

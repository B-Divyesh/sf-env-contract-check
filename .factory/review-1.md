# Validate `.env` files before services start — strict review 1

## Verdict

**FAIL**

- Findings: **2**
- Untested public claims: **1**
- Reviewed: September 5, 2026 UTC
- Live URL: https://env-contract-check.sociobot.in
- Implementation candidate: `fa8774df74bc4ada7db7c796c47e4e22497f11b5`
- Documentation baseline: `1eb15e194240a053dca8a9481c03ec27f4296789`
- Reviewed factory envelope: `8cf97e73fac45c1e676a129494eaf47724de655f`

The later envelope changes only reports and pre-existing Graphify output. All 20 live payloads match the clean build of the implementation candidate by SHA-256.

## Findings

### 1. Medium — the documented Docker CLI demo does not show parser-specific quote findings

The public README links `.factory/demo.md` as the sample contract. That document says `env-contract-check demo --profile docker` shows parser-specific quote findings. A clean consumer install from the packaged crate returned `ok: true`, `0` errors, and `0` warnings for that command. The bundled `app.env` contains unquoted values, so Docker and Node produce the same successful result.

This specific promise is not listed or tested in `.factory/claims.json`. The `demo-command` claim only checks that bundled files are written to a temporary directory and that the report passes. The separate parser-validation claim uses a different temporary fixture. This leaves **1 untested public claim** and makes the documented claim false.

Recommended fix: either ship quoted values in the CLI demo so Docker exposes the advertised difference, or correct the documentation. Add one claim test for the exact documented `demo --profile docker` outcome.

### 2. Low — short footer links miss the 44 px phone touch-target minimum

At a 390×844 phone viewport, the visible `Terms` footer link measures 40×44 CSS px on `/`, `/demo/`, and the designed 404. `Home` measures 32×44 CSS px on `/privacy/` and `/terms/`. The attached accessibility and design contracts require touch targets of at least 44×44 CSS px.

Recommended fix: give footer links a 44 px minimum inline size or equivalent horizontal padding, then add an automated phone target-size check.

## First screen before scrolling

Fresh 1440×900 desktop and 390×844 phone contexts showed:

| Item | Live evidence |
| --- | --- |
| Job | “Validate `.env` files before services start” |
| Audience | Developers moving settings across laptops, CI, Docker, and deployments |
| First action | “Try it with sample data” |
| Next-step explanation | Loads a sample `.env` and checks Docker parser rules |
| Plain facts | Runs offline; prints no secret values; free under the MIT License |

The primary action ended at 727 px on desktop and 565 px on phone, before scrolling. Neither viewport had horizontal overflow or a load-time console error.

## Browser demo and privacy

- One click opened `/demo/` and showed the persistent “Demo — sample data, nothing is saved” label.
- The initial Docker sample showed realistic populated output: 3 errors and 3 warnings for `APP_PORT`, `DEBUG`, and the redacted `DATABASE_URL`.
- Node accepted the normal sample. `APP_PORT=0` produced the 1–65535 error. `APP_PORT=65535` passed.
- Empty input produced a clear recovery message. Reset restored the quoted sample, Docker profile, and populated result.
- A unique database canary never appeared in the result or request bodies. Reload discarded the edit.
- Local storage, session storage, IndexedDB, cookies, and document cookies remained empty. All 19 observed requests were same-origin.
- “Start for real” resolves to the install section. Every link across home, demo, legal, and 404 pages resolved, except that the 404 page’s same-document skip link naturally retains the deliberate 404 status.

## Accessibility, routes, offline use, and performance

- The skip link was the first keyboard target, had a visible 3 px outline, and moved to `#main`. The form submitted by keyboard without a trap.
- Reduced-motion animation and transition durations computed to `0.01ms`.
- Axe found zero serious or critical violations on `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed missing route.
- Each checked route has `lang=en`, one `<h1>`, one `<main>`, header and footer landmarks, and no image missing alternative text.
- Route titles are specific: landing, Demo, Privacy, Terms, and Page not found.
- `/this-page-does-not-exist` returned HTTP 404 with the complete designed page. Its expected failed-resource console entry is not a defect.
- A dedicated fresh service-worker context reloaded `/demo/` offline with the populated result and demo label intact.
- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, no console errors, title, language, heading, landmark, image-alt, and button-label checks.
- Fresh mobile Lighthouse after setting the preinstalled Chromium path: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.5 s, CLS 0, TBT 40 ms, transfer 164 KiB.
- JavaScript is 5.65 kB uncompressed and CSS is 14.64 kB uncompressed, below the declared budgets.

## Clean checkout and installed CLI

A separate clean checkout at `8cf97e7` used the documented `npm ci` setup. The product-code diff from `fa8774d` is empty.

- Every one of the eight commands in `.factory/claims.json` passed independently.
- `npm test` passed 9 Rust tests and 28 Playwright tests with no failures or skips.
- `npm run build` produced the release binary, verified the crate package, and produced `dist/site/`.
- A separate consumer directory installed the packaged crate. The installed `--help`, `check --help`, `demo`, and `demo --profile docker --json` commands ran.
- The installed Docker demo’s unexpected clean result is finding 1; it is not a build or installation failure.

## Declared claims

| Claim | Exact command result |
| --- | --- |
| Typed parser validation | Passed |
| Redacted output | Passed |
| CI JSON and exit codes | Passed |
| CLI demo temp directory | Passed |
| Local operation without network | Passed |
| Browser demo isolation and reset | Passed |
| Offline demo reload | Passed |
| Clean consumer install | Passed |

The additional Docker-demo outcome in `.factory/demo.md` is not declared and is false, so the review has one untested public claim even though all eight declared claim commands pass.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims file | Fixed; eight declared commands passed independently. |
| First screen omitted the audience | Fixed on fresh desktop and phone views. |
| Live CSP and Permissions-Policy absent | Fixed; both headers are present. |
| Live cache policy used short-lived assets | Fixed; HTML and service worker use `no-cache`, while static assets are immutable for one year. |
| README legal links were broken | Fixed; the repository paths and live routes resolve. |

## Other scope checks

The site has no backend, accounts, tenant state, payment path, or hosted product data. Tenant isolation, restart persistence, health, and 429/`Retry-After` checks are not applicable. An AI feature would not improve the deterministic, offline parser-validation job, so no missed AI leverage finding applies.

Evidence is in `/work/.evidence/env-contract-check-review-1/`.

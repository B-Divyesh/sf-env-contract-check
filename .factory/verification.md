# Independent release verification — FAIL

**Candidate:** `24f3e54b3d3b4ec4336f61f60d493a358740cdb1`  
**Live URL:** https://env-contract-check.sociobot.in  
**Verified:** 2026-08-28 09:10 UTC  
**Verdict:** **FAIL — do not release.**

## Release blockers

1. **BLOCKER — required claims gate is absent.** A fresh detached clone at the
   candidate commit contains no `.factory/claims.json`. Consequently there are
   no declared claim tests to run through the product demo entry point. The
   work order explicitly makes a missing manifest release-blocking.
2. **HIGH — first-read acceptance fails.** On a cold load the first screen says
   that parser drift can be caught, and provides `Try the demo` / `Test parser
   meaning`; it does *not* say in plain words who it is for (developers
   maintaining `.env` across laptops, CI, Docker, and deployments). The seeded
   `Check contract` action is one click, but the required first-screen
   what/for-whom/click-first contract is not completely met.
3. **HIGH — live response policy and asset caching do not match the built
   deployment artifact.** `dist/site/_headers` declares a self-only CSP,
   Permissions-Policy, `no-cache` for `/sw.js`, and one-year immutable caching
   for hashed assets, fonts, and WebP. Fresh live responses instead have no
   `Content-Security-Policy` or `Permissions-Policy`, and every checked asset
   and service worker reports `Cache-Control: public, must-revalidate,
   max-age=30`. This violates the deployment caching/security contract even
   though the rendered payload is current.

## Lower-severity defect

- **LOW — README legal-page links are broken in the repository.** It links to
  `site/privacy.html` and `site/terms.html`; the shipped files are
  `site/privacy/index.html` and `site/terms/index.html`. The live `/privacy/`
  and `/terms/` pages themselves work.

## Evidence from clean checkout

- Created a fresh detached clone of the candidate, ran `npm ci`, then ran
  `npm test` successfully: Rust 6 unit + 2 CLI integration tests passed and
  Playwright passed all 14 desktop/mobile tests (the final
  `test-results/.last-run.json` is `passed`).
- Ran the exact production command `npm run build` successfully: release Rust
  build, locked Cargo package verification, TypeScript check, and Vite build.
  The package is `target/package/env-contract-check-0.1.0.crate` (15.5 KiB).
- Extracted that crate into a separate temporary consumer, installed it with
  `cargo install --path ... --root ... --locked`, and exercised the installed
  binary. `--help` is useful; the documented Node example returns valid JSON;
  port `0` fails `below_minimum` with exit 1; Docker quoted URL fails without
  printing its secret; a baseline diff reports `changed` state, not values.
- Browser checks against the live URL at 1440px and 390px: no console/page
  errors, zero Axe serious/critical findings, exactly one `h1` and `main`,
  `lang=en`, no horizontal overflow at 390px, visible 3px focus outline, and
  same-origin-only runtime requests. Node sample passes; Docker yields 3
  redacted typed errors/3 warnings; blank input gives recoverable empty-file
  feedback. Reduced-motion CSS reduces animations/transitions to 0.01ms.
- Live PWA registered `/sw.js`, controlled the page, and successfully reloaded
  offline. Source inspection confirms `skipWaiting` and `clients.claim` for
  update activation. There are no product API endpoints: `/api/v1/` is the
  static HTML fallback and POST returns 405, so rate-limit testing is N/A.
- Fresh SHA-256 comparison of all 16 deployed static payloads (excluding the
  deployment configuration file `_headers`) against `dist/site/` found 0
  mismatches. This confirms the live content is the candidate, while the live
  host is not applying its header configuration.
- Bundle sizes from the production build: JS 5.50 kB, CSS 13.58 kB, local fonts
  97.6 kB total, mobile hero 58.7 kB. `npm audit --audit-level=high` reports 0
  vulnerabilities. The live response header check is the performance/security
  exception noted above.

## Privacy and authentication

The CLI and demo exhibited no telemetry, sign-in, local storage, uploads, or
third-party runtime requests. No Microsoft Entra flow is applicable because the
product has no sign-in. Secret values remained absent from human and JSON CLI
output in the exercised failure and diff paths.

## Required remediation before a new candidate

1. Add `.factory/claims.json` with executable demo-entry-point checks and make
   it pass from a clean clone.
2. State the target user plainly in the cold first screen.
3. Configure the deployment host to honor the built `_headers` policy, then
   re-verify live CSP, Permissions-Policy, immutable asset caching, and
   service-worker cache policy.
4. Correct the README privacy and terms links.

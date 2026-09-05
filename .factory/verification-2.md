# Independent verification 2 — PASS

**Verdict: PASS**

**Verified:** September 5, 2026 UTC
**Live URL:** https://env-contract-check.sociobot.in
**Implementation reviewed:** `fa8774df74bc4ada7db7c796c47e4e22497f11b5`
**Documentation reviewed:** `b9ff979fbc5de67b6c2dc1fb8abc091a19255acd`

The checked-out factory envelope was `910991e0879f32c14478e95c7b3f709fc97d6e75`. Its difference from the implementation candidate is reports and pre-existing Graphify output, not product code. The live checked asset bytes match the candidate build.

## Result

- Findings: **0**
- Untested public claims: **0**
- Verdict: **PASS**

## First screen

Before scrolling, fresh desktop (1440×900) and phone (390×844) contexts showed:

| Item | Evidence |
| --- | --- |
| Job | “Validate `.env` files before services start.” |
| Audience | Developers moving settings across laptops, CI, Docker, and deployments. |
| First action | “Try it with sample data”; it opens `/demo/` and loads Docker sample findings. |

The action was visible before scrolling in both viewports. The phone page had no horizontal overflow. Cold-load console errors were empty.

## Clean checkout and CLI

A separate clone at `910991e` was prepared with the documented `npm ci` command. The local product-code diff from `fa8774d` is empty; only documentation/factory-output files differ.

- `npm test` passed: 9 Rust tests and 28 browser tests, with no failures or skips.
- `npm run build` passed: release binary, `cargo package`, and `dist/site/` all completed.
- A new consumer directory installed `cargo install --path crates/env-contract-check --locked --debug`; the installed binary’s `--help` and `demo --json` both passed.
- The installed demo wrote its bundled sample files to a new system temporary directory and returned a successful redacted JSON report.

## Public claims

Each declared command in `.factory/claims.json` was run independently after clean setup. Every command passed.

| Claim | Command | Observable result |
| --- | --- | --- |
| Typed parser validation | `npm run test:claims -- --grep @claim:typed-parser-validation` | Passed; Node, Docker, and Python diagnostics covered type, bounds, placeholder, unused key, and parser differences. |
| Redacted output | `npm run test:claims -- --grep @claim:redacted-output` | Passed; human and JSON reports omitted the canary value while reporting change state. |
| CI interface | `npm run test:claims -- --grep @claim:ci-interface` | Passed; JSON and exit codes 0, 1, and 2 were asserted. |
| CLI demo command | `npm run test:claims -- --grep @claim:demo-command` | Passed; bundled samples were written to a temporary directory and checked. |
| Local operation | `npm run test:claims -- --grep @claim:local-operation` | Passed; socket-denial shim observed no attempted network connection. |
| Demo sandbox | `npm run test:claims -- --grep @claim:demo-sandbox` | Passed; no upload/storage, canary redaction, reset, and reload were asserted. |
| Offline reload | `npm run test:claims -- --grep @claim:offline-reload` | Passed in its own browser context after service-worker control and network disablement. |
| Consumer install | `npm run test:claims -- --grep @claim:consumer-install` | Passed; a clean installed CLI ran its demo and the MIT grant was asserted. |

No additional public promise was found in the landing page, README, CLI help, or legal pages without a declared claim. The browser’s sample is a bounded demonstration; the installed CLI is the full validator.

## Live product paths

Fresh desktop and phone browser contexts exercised the following paths at the live origin.

- `/demo/` showed the persistent “Demo — sample data, nothing is saved” label and a populated Docker result with 3 errors and 3 warnings.
- Node validation of a normal input passed. `APP_PORT=0` returned a clear boundary error. `APP_PORT=65535` passed. Reset restored the bundled Docker input, profile, and populated result.
- A unique value entered in `DATABASE_URL` did not appear in the result. `localStorage` and `sessionStorage` stayed at zero, cookies were empty, and observed demo requests remained same-origin.
- The first keyboard focus target was the visible 3 px skip-link outline. Forms and reset controls operated by keyboard in the local full suite.
- Reduced-motion result-panel duration was `1e-05s`. A service-worker-controlled fresh context reloaded `/demo/` offline with the populated sample result intact.
- Axe found zero serious or critical violations on `/`, `/demo/`, `/privacy/`, `/terms/`, and the missing-page route. Each has `lang=en`, one `<h1>`, one `<main>`, and no image without alternative text.
- Route titles are specific: landing, Demo, Privacy, Terms, and Page not found. All reachable product and source links returned 200. The skip link on the deliberate missing URL naturally retains that URL’s 404 response.
- `/this-page-does-not-exist` returned HTTP 404 with a complete styled page, one heading, one main landmark, and routes back to the product. The browser’s expected failed-resource console entry for that deliberate 404 is not a defect.

## Live response and candidate checks

- Landing HTML returned `Cache-Control: no-cache`, CSP with `frame-ancestors 'none'`, Permissions-Policy, Referrer-Policy, and `X-Content-Type-Options: nosniff`.
- `/sw.js` returned `no-cache`. JavaScript, CSS, self-hosted fonts, WebP art, SVG, and the Apple touch icon returned one-year immutable caching.
- SHA-256 matched the clean candidate build for the live JS, CSS, two checked fonts, three WebP assets, SVG mark, Apple icon, service worker, `robots.txt`, and `sitemap.xml`.
- No backend, accounts, tenant state, payments, or rate-limited request surface exists in this static CLI/docs product. Tenant isolation, restart persistence, health, and 429 checks are not applicable.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Claims file missing | Fixed; eight declared claims all passed independently. |
| First screen omitted the audience | Fixed; job, developer audience, and sample action appear before scrolling on desktop and phone. |
| Live CSP and Permissions-Policy absent | Fixed; both are present at the custom live origin. |
| Live cache policy used short-lived assets | Fixed; HTML/service worker are `no-cache` and static assets are immutable for one year. |
| README legal links were broken | Fixed; live Privacy and Terms links return 200 and their pages are accessible. |

## Evidence

Detailed command outputs, browser JSON, screenshots, asset-hash results, headers, and installed-consumer output are under `/work/.evidence/env-contract-check-verify-2/`.

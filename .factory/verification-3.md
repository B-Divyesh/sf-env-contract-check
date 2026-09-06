# Repair verification 3 — PASS

## Candidate

- Implementation SHA: `655f7ee0eb7d46158578ef7a62d7ac3235039eb7`
- Live URL: https://env-contract-check.sociobot.in
- Verified: September 6, 2026 UTC
- Deployment: existing static app `sf-env-contract-check`, deployment `5fd69cd9-15e9-4a99-8acd-926e5588f7dd`

## Result

The false Docker-demo promise, the missing exact claim test, and the phone footer touch-target defect are fixed. There are no remaining product findings from the available review history.

## Changes

- The bundled CLI `app.env` now has the three quoted values the Docker demo documents. `env-contract-check demo --profile docker --json` returns a redacted report with 3 errors and 3 warnings, including `literal_quotes` and `invalid_type`, and exits 1. The normal Node demo still exits 0.
- `docker-demo-findings` is now a ninth public claim. Its outcome-based test installs the CLI into a fresh consumer root, executes the documented Docker command, checks its parser-specific report, exit code, and redaction.
- Footer navigation links now have a minimum inline size of 44px. A mobile browser test measures every footer link on the landing, demo, privacy, terms, and designed 404 routes.

## Clean verification

From a fresh clone of the implementation SHA:

```sh
npm ci
npm run test:claims -- --grep @claim:typed-parser-validation
npm run test:claims -- --grep @claim:redacted-output
npm run test:claims -- --grep @claim:ci-interface
npm run test:claims -- --grep @claim:demo-command
npm run test:claims -- --grep @claim:docker-demo-findings
npm run test:claims -- --grep @claim:local-operation
npm run test:claims -- --grep @claim:demo-sandbox
npm run test:claims -- --grep @claim:offline-reload
npm run test:claims -- --grep @claim:consumer-install
npm test
npm run build
```

All commands passed. `npm ci` reported zero vulnerabilities. The full suite passed 9 Rust tests and 31 Playwright tests. The release build created `target/release/`, verified `cargo package`, and produced `dist/site/`.

## Live verification

- The deployment completed through the product's existing static configuration; no backend, volume, or replica setting was changed.
- All 20 served application payloads matched the clean `dist/site/` build by SHA-256.
- `verify-url.sh` passed: HTTPS 200, no load-time console errors, title, language, heading, main landmark, image alternatives, and button labels were present.
- Fresh 1440×900 desktop and 390×844 phone loads named the job, developer audience, and sample action before scrolling. The action appeared at 727px of 900px on desktop and 565px of 844px on phone.
- One click opened the populated demo with its persistent sample label. Normal, invalid, lower-boundary, upper-boundary, reset, keyboard, redaction, storage-isolation, and offline-reload paths passed. Browser storage and cookies remained empty; no request occurred after the demo interaction.
- Every checked route had a route title, one `h1`, one `main`, and zero serious or critical Axe findings. The deliberate missing route returned a complete styled HTTP 404; its expected failed-resource event was not treated as a defect.
- Live mobile footer link measurements were 44×44px or larger on all routes.
- Mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.67s, CLS 0, TBT 65ms, transfer 167,591 bytes.
- Live responses send the expected CSP, Permissions-Policy, Referrer-Policy, and `nosniff`; HTML and service worker are `no-cache`, while static assets are one-year immutable.

Evidence is under `/work/.evidence/env-contract-check-repair-2/`.

## Earlier finding disposition

| Finding | Disposition |
| --- | --- |
| Claims manifest missing | Fixed; nine claims pass independently from clean setup. |
| First screen did not name its audience | Fixed; verified on fresh desktop and phone loads. |
| CSP, Permissions-Policy, and cache policy absent live | Fixed; verified from live response headers. |
| Repository legal links were broken | Fixed; live Privacy and Terms links resolve. |
| Docker demo claimed quote findings but bundled an unquoted sample | Fixed; the installed Docker demo now proves the documented redacted 3-error, 3-warning outcome. |
| Phone footer links were narrower than 44px | Fixed; all live targets measure at least 44×44px. |
| Docker demo public claim was untested | Fixed; `docker-demo-findings` has an installed-consumer outcome test. |

## Scope notes

The product is a free static CLI and documentation site. It has no accounts, payment, backend, tenant data, or SQLite state, so billing metadata, tenant isolation, restart persistence, health, and HTTP 429 checks are not applicable. The crate is package-verified and ready to publish; registry publication remains a factory-owned release step.

# Env Contract Check — repair handoff

## Status

Release repair **passes**. Implementation `fa8774df74bc4ada7db7c796c47e4e22497f11b5` is deployed at https://env-contract-check.sociobot.in. The later handoff/report commit changes documentation only; the deployed payload still matches the implementation candidate.

## What changed

- Added the mandatory `.factory/claims.json` with eight independently runnable, outcome-based checks.
- Rewrote the cold first screen to name the job, the developer audience, and the first sample action in plain words.
- Replaced unsupported `_headers` deployment metadata with Azure Static Web Apps `staticwebapp.config.json` response policies.
- Added `/demo/` with realistic input, populated output, a persistent sample label, reset, start-for-real path, and DOM-only isolation.
- Added `env-contract-check demo`, which writes bundled samples to a new temporary directory and runs the real validator.
- Added a designed 404, route metadata, canonical/social images, an Apple touch icon, and consistent legal-page navigation/footer details.
- Corrected the README privacy and terms paths, documented clean setup and claims, and added demo/copy/provenance records.
- Updated service-worker precaching so a fresh first visit includes built JavaScript and CSS before an offline reload.

The original Rust validation behavior remains intact. Node, Python, and Docker rules, JSON output, redacted comparisons, and exit codes are unchanged.

## Run and verify

From a clean checkout:

```sh
npm ci
npm test
npm run build
```

Run every public claim with the exact command in `.factory/claims.json`. Run the shipped samples with:

```sh
./target/release/env-contract-check demo
./target/release/env-contract-check demo --profile docker
```

Build outputs:

- Static deployment: `dist/site/`
- Release binary: `target/release/env-contract-check`
- Ready-to-publish crate: `target/package/env-contract-check-0.1.0.crate`

Registry publication remains factory-owned; this worker did not publish a crate or create release binaries.

## Verification completed

- Fresh clone: all eight declared claim commands passed independently.
- Fresh clone `npm test`: 9 Rust tests and 28 Playwright tests passed, with no failures or skips.
- Fresh clone `npm run build`: release build, Cargo package verification, TypeScript, and Vite build passed.
- Clean extracted-package consumer: install, `--help`, and `demo --json` passed.
- Live candidate match: 20 of 20 deployed payload hashes matched the clean build.
- Live desktop/phone: first screen, one-click sample, populated output, pass/invalid/empty/reset recovery, keyboard, focus, mobile overflow, and reduced motion passed.
- Live privacy: empty browser storage and same-origin-only requests throughout the sample flow.
- Live offline: a dedicated fresh context reloaded `/demo/` after networking was disabled.
- Live accessibility: zero serious/critical Axe findings across desktop and phone; the factory URL verifier passed without console errors.
- Live response policy: CSP and Permissions-Policy present; HTML and service worker are `no-cache`; build assets/fonts/images are one-year immutable; designed missing route returns 404.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.7 s, CLS 0, TBT 0 ms, 164 KiB transfer.

Evidence screenshots, URL verifier output, and Lighthouse JSON are in `/work/.evidence/`. The catalog description was copied to `/work/.evidence/catalog-description.txt`.

## Known boundaries and next steps

- Python interpolation is reported but not expanded. Docker targets `docker run --env-file`, not Compose YAML interpolation.
- The browser sample covers the common typed/quoted case. The Rust CLI remains the complete validator.
- The factory may publish the verified crate and attach platform binaries. There are no code, deployment, billing, or external-integration blockers.

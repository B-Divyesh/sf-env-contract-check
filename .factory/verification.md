# Repair verification — PASS

**Implementation candidate:** `fa8774df74bc4ada7db7c796c47e4e22497f11b5`

**Live URL:** https://env-contract-check.sociobot.in

**Verified:** September 5, 2026 UTC

**Verdict:** **PASS**

This report supersedes the failed August 28 verification recorded in `1d47d3b`. The implementation candidate was built and tested from a fresh local clone, deployed from that clone, and then checked through the custom HTTPS origin.

## Previous findings

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| Missing `.factory/claims.json` | Fixed | Eight public claims are declared. Every listed command passed independently from the fresh clone. |
| Cold first screen did not name its audience | Fixed | Desktop and 390 px cold loads show the job, developers across laptops/CI/Docker/deployments, the sample action, and three facts before scrolling. |
| Live CSP and Permissions-Policy absent | Fixed | Both headers are present on the custom origin and match `staticwebapp.config.json`. |
| Live assets and service worker used 30-second caching | Fixed | HTML and `/sw.js` return `no-cache`; hashed assets, fonts, SVG/PNG, and WebP return `public, max-age=31536000, immutable`. |
| README privacy and terms paths were broken | Fixed | Links point to the shipped `site/privacy/index.html` and `site/terms/index.html`. |

## Clean-checkout evidence

The fresh clone at the candidate SHA used `npm ci` before any runtime measurement.

- All eight commands in `.factory/claims.json` passed independently: typed/parser validation, redaction, CI JSON/exit codes, bundled CLI demo, socket-denied local operation, browser sandbox isolation/reset, offline reload, and clean consumer install.
- `npm test`: 9 Rust unit/integration tests and 28 Playwright desktop/mobile/claim tests passed with no failures or skips.
- `npm run build`: release binary, verified Cargo package, and `dist/site/` completed. The crate contains the bundled demo and is 16.4 KiB compressed.
- The packaged crate was extracted into a separate temporary consumer, installed with `cargo install --path ... --root ... --locked`, and its installed `--help` and `demo --json` paths passed.
- Production sizes: 5.65 kB JavaScript, 14.64 kB CSS, 97.6 kB fonts, and 58.7 kB mobile hero image.
- `npm ci` audit reported zero vulnerabilities.

## Live evidence

- All 20 public payloads matched the clean candidate build by SHA-256. Deployment configuration is host-consumed and was checked by response behavior.
- Fresh 1440×900 and 390×844 contexts showed the complete first-screen contract before scrolling and had no horizontal overflow.
- One click opened `/demo/` with the persistent sample label and populated Docker result: three errors and three warnings. Node passed, blank input returned a recoverable empty-file message, and reset restored the Docker sample and result.
- Browser storage remained empty. All 51 observed requests were same-origin. No user or sample data was uploaded.
- Keyboard submission passed on desktop and phone. Reduced-motion computed animation duration was effectively zero.
- Home, demo, privacy, terms, and designed 404 pages have one `h1`, one `main`, route-specific titles, and no serious/critical Axe findings. The deliberate missing route returned HTTP 404.
- A dedicated fresh browser context loaded the demo, disabled networking, reloaded, and retained the populated result through the service worker.
- `/opt/fleet/lib/verify-url.sh` passed with no console errors, `lang=en`, one `h1`, one `main`, and no missing image alt text.
- Mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, total blocking time 0 ms, speed index 1.1 s, transfer 164 KiB.

The product has no backend, tenants, authentication, or hosted state. Backend persistence and 429 checks are not applicable. The researched offer is free, so no billing registration or billing metadata is applicable.

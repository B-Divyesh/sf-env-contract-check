# Env Contract Check — strict review handoff

## Status

Strict review 1 is **FAIL** with **2 findings** and **1 untested public claim**. No product code was changed.

- Implementation reviewed: `fa8774df74bc4ada7db7c796c47e4e22497f11b5`
- Documentation baseline: `1eb15e194240a053dca8a9481c03ec27f4296789`
- Reviewed factory envelope: `8cf97e73fac45c1e676a129494eaf47724de655f`
- Live URL: https://env-contract-check.sociobot.in
- Full report: `.factory/review-1.md`

## Findings to fix

1. The linked `.factory/demo.md` says `demo --profile docker` shows quote findings, but a clean installed package returns a clean report because its bundled sample is unquoted. Correct the sample or documentation and add an exact claim test.
2. Phone footer links named `Home` and `Terms` are 32×44 and 40×44 CSS px on affected routes. Increase their inline target size to at least 44 px and test it.

## Verification completed

- Fresh clone: `npm ci` completed with zero audit vulnerabilities.
- All eight declared claim commands passed independently.
- `npm test`: 9 Rust tests and 28 browser tests passed.
- `npm run build`: release binary, verified crate, and `dist/site/` completed.
- Clean consumer install: `--help`, `check --help`, `demo`, and Docker JSON demo ran.
- Live candidate match: 20 of 20 deployed payload hashes matched.
- Fresh desktop and phone: first-screen job, audience, action, facts, sample flow, normal/invalid/boundary/reset paths, privacy isolation, keyboard, focus, reduced motion, offline reload, links, legal pages, and designed 404 checked.
- Axe: zero serious or critical findings across all five checked routes.
- URL verifier: passed with no load-time console errors.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.5 s, CLS 0, TBT 40 ms, 164 KiB transfer.

Evidence is under `/work/.evidence/env-contract-check-review-1/`. After product repair, rerun the exact claim commands, clean consumer install, mobile target-size check, full suite, build, and live comparison.

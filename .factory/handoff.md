# Env Contract Check repair handoff

## Status

The strict-review findings are fixed and verified.

- Implementation SHA: `655f7ee0eb7d46158578ef7a62d7ac3235039eb7`
- Verification documentation SHA: `1a8872807ace794de955510c0d0544a725bbe358`
- Live URL: https://env-contract-check.sociobot.in
- Static deployment: `5fd69cd9-15e9-4a99-8acd-926e5588f7dd`

The implementation and documentation SHAs differ because the product was deployed from the implementation commit, then the verification report was recorded.

## What changed

The bundled CLI sample now keeps `APP_PORT`, `DEBUG`, and `DATABASE_URL` quoted. The documented `env-contract-check demo --profile docker --json` path now uses the real installed artifact to return a redacted report with 3 errors and 3 warnings, including literal-quote findings, and exits with code 1.

`.factory/claims.json` now declares `docker-demo-findings`. Its regression test installs the CLI in a new consumer root, runs the Docker demo, checks the documented failure result, and confirms that the sample value is absent.

Footer navigation links now have a 44px minimum inline size. The mobile browser test measures links on the landing, demo, Privacy, Terms, and designed 404 pages.

## How to verify

From a clean checkout:

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

All commands passed from a clean clone. The suite passed 9 Rust and 31 Playwright tests. The release build produced `target/release/`, package-verified the crate, and produced `dist/site/`.

Live checks passed after deployment: `verify-url.sh`, fresh desktop and phone browser flows, 20 matching payload hashes, route titles and legal pages, internal links, mobile touch targets, offline reload, and Axe checks with zero serious or critical issues. Mobile Lighthouse scored 99 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO.

## Earlier finding disposition

| Finding | Current disposition |
| --- | --- |
| Claims manifest missing | Fixed; nine declared claims passed independently. |
| Audience missing from the first screen | Fixed; shown before scrolling on phone and desktop. |
| Live security headers and cache policy missing | Fixed; current live responses match the static configuration. |
| README legal links broken | Fixed; Privacy and Terms links resolve. |
| Docker demo claimed quote findings without quoted bundled data | Fixed; installed Docker demo proves the documented result. |
| Phone footer links under 44px wide | Fixed; every checked live footer link is at least 44×44px. |
| Docker demo public claim lacked a test | Fixed; installed-consumer claim test added. |

## Known gaps and next steps

There are no known product defects from this repair. This is a free, static CLI and docs site, so payment, billing metadata, accounts, tenants, backend health, SQLite persistence, and rate-limit checks do not apply. The crate has passed `cargo package`; publishing a registry release or prebuilt binary remains a factory-owned release action.

Evidence is in `/work/.evidence/env-contract-check-repair-2/`. The catalog description is also copied to `/work/.evidence/catalog-description.txt`.

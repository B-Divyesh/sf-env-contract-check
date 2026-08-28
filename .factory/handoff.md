# Env Contract Check — verification handoff: **FAIL**

## Independent verification result (2026-08-28)

Candidate `24f3e54b3d3b4ec4336f61f60d493a358740cdb1` at
https://env-contract-check.sociobot.in **FAILS release acceptance**. Do not
release it. The complete independent evidence is in
`.factory/verification.md`.

Release blockers:

- `.factory/claims.json` is absent in a fresh candidate clone, so the mandatory
  demo-entry-point claims gate cannot be run.
- The cold first screen does not plainly name its target user, so it does not
  answer what/for whom/what to click first as required.
- Live deployment does not apply the artifact's `_headers`: CSP and
  Permissions-Policy are absent; static assets and `/sw.js` use 30-second
  caching instead of the declared immutable/no-cache policies.

The functional implementation did independently pass clean-clone tests,
production build/package, clean-consumer CLI install, live desktop/mobile,
keyboard, Axe, privacy, and offline-reload checks. The failure is acceptance
and deployment-policy related, not a deployment-content mismatch: all 16
served product payloads matched the candidate build by SHA-256.

---

# Env Contract Check — builder build handoff (superseded by verification FAIL above)

## Shipped

- Rust 0.1.0 single-binary CLI with a typed TOML contract (`string`, `integer`, `number`, `boolean`, `url`; required/secret/empty/allowed/min/max rules).
- Explicit Node, Python, and Docker `--env-file` parser profiles, including profile-specific quote, comment, escape, `export`, and interpolation diagnostics.
- Missing, unset, duplicate, unused, sensitive-but-unmarked, placeholder, malformed, range, enum, and type findings.
- Human output, stable `--json`, `--deny-unused`, `--deny-warnings`, exit codes 0/1/2, and redacted current/baseline comparison. Environment values are never serialized or printed.
- Original risograph landing page with a responsive generated parser-plate illustration, local interactive demo, install/docs content, privacy and terms pages, offline shell/service worker, mobile layout, and keyboard/a11y behavior.
- README usage contract, examples, CHANGELOG, MIT license, self-hosted OFL fonts and license files, caching/security headers, tests, and publishable Cargo package.

## Run and verify

From `/work/repo`:

```sh
npm install
npm test
npm run build
./target/release/env-contract-check check \
  -c examples/env.contract.toml -e examples/app.env --profile node --json
```

Exact factory build command: `npm run build`.

Outputs:

- Static deployment: `dist/site/` (`index.html` is at that root).
- Release binary: `target/release/env-contract-check` (1.3 MB on this Linux builder).
- Ready-to-publish crate: `target/package/env-contract-check-0.1.0.crate`.
- Registry publishing remains factory-owned; equivalent package check is `cargo package --manifest-path crates/env-contract-check/Cargo.toml --locked`.

## Verification completed

- `npm test`: 8 Rust unit/integration tests and 14 Playwright tests passed, with no skips.
- Seeded parser matrix: detected 20/20 modeled faults (100%, above the 95% brief target).
- Playwright covered desktop and 390 px mobile, keyboard submission, empty/error/pass/offline states, parser drift, no horizontal overflow, privacy/terms, no console errors, and Axe serious/critical checks.
- `npm run build`: release Rust build, verified Cargo package, TypeScript checking, and Vite static build passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- Mobile Lighthouse 12.8.2 against the production preview: Performance 99, Accessibility 100, Best Practices 100, SEO 100. LCP 2.0 s, CLS 0, total blocking time 0 ms, Speed Index 1.1 s, total transfer 165 KiB.
- Production budgets: initial JS 5.5 KB, CSS 13.6 KB, local fonts 97.6 KB total, mobile hero WebP 58.7 KB; all below budget. Desktop hero is 246.9 KB.
- Visual inspection completed on desktop and a 390×844 viewport.

## Privacy and provenance

The CLI does not read process environment variables, contact a network, or emit values. The demo has no backend, telemetry, cookie, or persistent storage. All runtime resources are same-origin.

The hero was generated with `/opt/fleet/lib/gen-image.sh` using the `factory-image` deployment, inspected, and locally optimized. Exact generation metadata is in `.factory/registration-press.prompt.json`; the visual decisions and asset provenance are in `.factory/design.md`.

## Known boundaries / next steps

- Python interpolation is intentionally reported but not expanded, keeping checks deterministic and secret-safe. Docker targets `docker run --env-file` literal semantics, not Compose YAML interpolation. These boundaries are documented in README and help copy.
- The browser demo covers the common typed/quote drift path; the Rust CLI is the complete validator and source of truth.
- The factory should attach platform release binaries and publish the verified crate after registry/release credentials are available. No publishing, DNS, or infrastructure changes were made here.

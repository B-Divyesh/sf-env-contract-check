# Env Contract Check

Validate `.env` files before services start.

Env Contract Check is for developers moving configuration across laptops, CI, Docker, and deployments. It catches typed and parser-specific mistakes before runtime. Reports show key names and finding codes, but never environment values.

## Install

Prebuilt binaries will be published with releases. From a source checkout:

```sh
cargo install --path crates/env-contract-check
```

Rust 1.85 or newer is required when building from source.

## Try the sample

Open the [browser demo](https://env-contract-check.sociobot.in/demo/) to see Docker handle quoted values. The sample stays in the tab and resets in one click.

The installed CLI includes a sample command:

```sh
env-contract-check demo
env-contract-check demo --profile docker
```

Each run writes bundled sample files to a new system temporary directory and prints its path. It uses the normal validation code.

## Usage

Create `env.contract.toml`:

```toml
version = 1

[variables.APP_PORT]
type = "integer"
required = true
min = 1
max = 65535

[variables.DEBUG]
type = "boolean"
required = true

[variables.DATABASE_URL]
type = "url"
required = true
secret = true

[variables.LOG_LEVEL]
type = "string"
allowed = ["debug", "info", "warn", "error"]
```

Check the runtime meaning of a file:

```sh
env-contract-check check \
  --contract env.contract.toml \
  --env .env \
  --profile node
```

Compare it with another environment. Output is redacted; it reports states such as `changed`, `only in current`, and `only in baseline`, never secret contents.

```sh
env-contract-check check \
  -c env.contract.toml -e .env.production \
  --baseline .env.staging --profile docker
```

Use strict and JSON modes in CI:

```sh
env-contract-check check -c env.contract.toml -e .env \
  --profile python --deny-warnings --json
```

The CLI reads only the files named in the command. It has no account or telemetry feature. Reports never print environment values. Paths and key names can appear in diagnostics.

Run `env-contract-check --help` or `env-contract-check check --help` for every option.

### Contract fields

Each entry under `[variables]` supports:

- `type`: `string`, `integer`, `number`, `boolean`, or `url` (default: `string`).
- `required`: fail when absent (default: `false`).
- `secret`: apply placeholder/empty-value safety checks (default: `false`).
- `allow_empty`: accept an explicitly empty value (default: `false`).
- `allowed`: exact allowed strings after profile parsing.
- `min` / `max`: numeric bounds for `integer` and `number`.

Unknown keys are warnings by default. `--deny-unused` upgrades them to errors; `--deny-warnings` makes every warning fail CI.

### Parser profiles

- `node`: dotenv-style quoting, inline comments, and double-quoted escapes.
- `python`: python-dotenv-style `export` prefixes, quoting, comments, and `${NAME}` interpolation warnings (values are not expanded, so validation stays deterministic and secret-safe).
- `docker`: Docker `--env-file` semantics; quotes are literal and interpolation is not performed.

Exit codes are `0` for a valid contract, `1` for validation findings that fail policy, and `2` for unreadable input or an invalid contract.

## Development

```sh
npm ci
npm test
npm run build
```

`npm test` runs Rust unit/integration tests plus the site tests. `npm run build` produces the release binary in `target/release/`, the static deploy at `dist/site/`, and verifies the Rust package with `cargo package`. The factory publishes packages and release artifacts; contributors should not publish from this repository.

For focused work:

```sh
cargo test --manifest-path crates/env-contract-check/Cargo.toml
npm run dev:site
npm run build:site
npm run test:claims -- --grep @claim:demo-sandbox
```

Every public product claim and its command are listed in [`.factory/claims.json`](.factory/claims.json). The sample isolation contract is in [`.factory/demo.md`](.factory/demo.md).

## Deploy

Deploy `dist/site/` as an Azure Static Web App. The included `staticwebapp.config.json` sets security headers, cache policies, and the designed 404 response.

The site needs no server or runtime environment variables. The browser demo has no analytics, cookies, storage, uploads, or third-party requests.

## Project documents

- [Visual thesis](.factory/design.md)
- [Release notes](CHANGELOG.md)
- [Privacy](site/privacy/index.html)
- [Terms](site/terms/index.html)

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).

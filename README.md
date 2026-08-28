# Env Contract Check

Catch the `.env` file that parses cleanly—and means something different in Node, Python, or Docker.

Env Contract Check is an offline, zero-telemetry CLI for developers who move environment configuration between laptops, CI jobs, containers, and deployments. It validates required keys and types, points out parser-specific quoting hazards, flags unused or unsafe settings, and compares two environments without printing secret values.

## Install

Prebuilt binaries will be published with releases. From a source checkout:

```sh
cargo install --path crates/env-contract-check
```

Rust 1.85 or newer is required when building from source.

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

The CLI never reads the process environment, contacts a network, expands a secret, or prints an environment value. Paths and key names can appear in diagnostics. Run `env-contract-check --help` or `env-contract-check check --help` for every option.

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
npm install
npm test
npm run build
```

`npm test` runs Rust unit/integration tests plus the site tests. `npm run build` produces the release binary in `target/release/`, the static deploy at `dist/site/`, and verifies the Rust package with `cargo package`. The factory publishes packages and release artifacts; contributors should not publish from this repository.

For focused work:

```sh
cargo test --manifest-path crates/env-contract-check/Cargo.toml
npm run dev:site
npm run build:site
```

## Deploy

Deploy `dist/site/` as a static site. No server, runtime environment variables, analytics, cookies, local storage, or third-party requests are used. The interactive demo runs entirely in the browser and does not upload pasted text.

## Project documents

- [Visual thesis](.factory/design.md)
- [Release notes](CHANGELOG.md)
- [Privacy](site/privacy.html)
- [Terms](site/terms.html)

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).

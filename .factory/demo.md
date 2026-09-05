# Demo sandbox

## Browser

- URL: `https://env-contract-check.sociobot.in/demo/`
- Entry action: **Try it with sample data** on the first screen.
- Sample: a quoted application port, debug flag, internal database URL, and log level checked with Docker parser rules.
- Expected first result: three typed errors and three literal-quote warnings. Environment values do not appear in the result.
- Reset: **Reset demo** restores the bundled input, Docker profile, and populated result.
- Exit: **Start for real** opens the source-install instructions.
- Isolation: the demo uses DOM memory only. It does not use local storage, session storage, IndexedDB, OPFS, cookies, uploads, or a backend. Reloading discards edits.

## CLI

Run:

```sh
env-contract-check demo
```

The installed binary writes its bundled contract and `.env` sample to a new system temporary directory. It prints that path and runs the real validation code. Pass `--profile docker` to see parser-specific quote findings, or `--json` for the CI report.

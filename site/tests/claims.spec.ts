import { expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const binary = join(root, "target", "debug", process.platform === "win32" ? "env-contract-check.exe" : "env-contract-check");

function runBinary(args: string[], executable = binary) {
  return spawnSync(executable, args, { cwd: root, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
}

function fixture(contract: string, environment: string, baseline?: string) {
  const directory = mkdtempSync(join(tmpdir(), "env-contract-check-claim-"));
  const contractPath = join(directory, "env.contract.toml");
  const environmentPath = join(directory, "app.env");
  writeFileSync(contractPath, contract);
  writeFileSync(environmentPath, environment);
  const baselinePath = baseline === undefined ? undefined : join(directory, "baseline.env");
  if (baselinePath) writeFileSync(baselinePath, baseline);
  return { directory, contractPath, environmentPath, baselinePath };
}

const typedContract = `version = 1
[variables.APP_PORT]
type = "integer"
required = true
min = 1
max = 65535
[variables.DEBUG]
type = "boolean"
required = true
[variables.API_TOKEN]
type = "string"
required = true
secret = true
`;

test("@claim:typed-parser-validation catches typed and parser-specific faults", () => {
  const quoted = fixture(typedContract, 'APP_PORT="3000"\nDEBUG="false"\nAPI_TOKEN="safe-token"');
  const node = runBinary(["check", "-c", quoted.contractPath, "-e", quoted.environmentPath, "--profile", "node", "--json"]);
  const docker = runBinary(["check", "-c", quoted.contractPath, "-e", quoted.environmentPath, "--profile", "docker", "--json"]);
  expect(node.status).toBe(0);
  expect(docker.status).toBe(1);
  const dockerReport = JSON.parse(docker.stdout);
  expect(dockerReport.diagnostics.map((item: { code: string }) => item.code)).toEqual(expect.arrayContaining(["literal_quotes", "invalid_type"]));

  const faults = fixture(typedContract, "APP_PORT=0\nDEBUG=yes\nAPI_TOKEN=changeme\nEXTRA=1");
  const failure = runBinary(["check", "-c", faults.contractPath, "-e", faults.environmentPath, "--json"]);
  const codes = JSON.parse(failure.stdout).diagnostics.map((item: { code: string }) => item.code);
  expect(failure.status).toBe(1);
  expect(codes).toEqual(expect.arrayContaining(["below_minimum", "invalid_type", "unsafe_placeholder", "unused_key"]));

  const python = fixture(typedContract, "export APP_PORT=3000\nDEBUG=false\nAPI_TOKEN=${TOKEN}");
  const pythonResult = runBinary(["check", "-c", python.contractPath, "-e", python.environmentPath, "--profile", "python", "--json"]);
  expect(JSON.parse(pythonResult.stdout).diagnostics.map((item: { code: string }) => item.code)).toContain("interpolation_not_resolved");

  for (const directory of [quoted.directory, faults.directory, python.directory]) rmSync(directory, { recursive: true });
});

test("@claim:redacted-output reports changes without environment values", () => {
  const canary = "secret-canary-74c9d";
  const files = fixture(
    typedContract,
    `APP_PORT=3000\nDEBUG=false\nAPI_TOKEN=${canary}`,
    "APP_PORT=3001\nDEBUG=false\nAPI_TOKEN=other-private-value",
  );
  const args = ["check", "-c", files.contractPath, "-e", files.environmentPath, "--baseline", files.baselinePath!];
  const human = runBinary(args);
  const json = runBinary([...args, "--json"]);
  expect(human.stdout).toContain("changed");
  expect(human.stdout).not.toContain(canary);
  expect(json.stdout).not.toContain(canary);
  expect(JSON.parse(json.stdout).comparison).toEqual(expect.arrayContaining([expect.objectContaining({ key: "API_TOKEN", state: "changed", secret: true })]));
  rmSync(files.directory, { recursive: true });
});

test("@claim:ci-interface returns JSON and documented exit codes", () => {
  const valid = fixture(typedContract, "APP_PORT=3000\nDEBUG=false\nAPI_TOKEN=safe-token");
  const pass = runBinary(["check", "-c", valid.contractPath, "-e", valid.environmentPath, "--json"]);
  expect(pass.status).toBe(0);
  expect(JSON.parse(pass.stdout).ok).toBe(true);

  writeFileSync(valid.environmentPath, "APP_PORT=nope\nDEBUG=false\nAPI_TOKEN=safe-token");
  const fail = runBinary(["check", "-c", valid.contractPath, "-e", valid.environmentPath, "--json"]);
  expect(fail.status).toBe(1);
  expect(JSON.parse(fail.stdout).ok).toBe(false);

  const unreadable = runBinary(["check", "-c", join(valid.directory, "missing.toml")]);
  expect(unreadable.status).toBe(2);
  rmSync(valid.directory, { recursive: true });
});

test("@claim:demo-command runs bundled sample files in a temporary directory", () => {
  const demo = runBinary(["demo", "--json"]);
  expect(demo.status).toBe(0);
  const report = JSON.parse(demo.stdout);
  expect(report.ok).toBe(true);
  expect(report.summary.checked).toBe(4);
  const directory = demo.stderr.replace("Demo files: ", "").trim();
  expect(directory.startsWith(tmpdir())).toBe(true);
  expect(statSync(join(directory, "app.env")).isFile()).toBe(true);
  expect(statSync(join(directory, "env.contract.toml")).isFile()).toBe(true);
  rmSync(directory, { recursive: true });
});

test("@claim:docker-demo-findings reports Docker literal quotes from an installed CLI", () => {
  const installRoot = mkdtempSync(join(tmpdir(), "env-contract-check-docker-demo-"));
  const install = spawnSync("cargo", ["install", "--path", join(root, "crates", "env-contract-check"), "--root", installRoot, "--locked", "--debug"], {
    cwd: tmpdir(),
    encoding: "utf8",
    env: { ...process.env, CARGO_TARGET_DIR: join(root, "target", "claim-docker-demo") },
  });
  expect(install.status, install.stderr).toBe(0);

  const installed = join(installRoot, "bin", process.platform === "win32" ? "env-contract-check.exe" : "env-contract-check");
  const demo = runBinary(["demo", "--profile", "docker", "--json"], installed);
  expect(demo.status).toBe(1);
  const report = JSON.parse(demo.stdout);
  expect(report).toMatchObject({
    ok: false,
    profile: "docker",
    summary: { errors: 3, warnings: 3, checked: 4 },
  });
  expect(report.diagnostics.map((item: { code: string }) => item.code)).toEqual(expect.arrayContaining(["literal_quotes", "invalid_type"]));
  expect(`${demo.stdout}\n${demo.stderr}`).not.toContain("https://database.internal/app");
  rmSync(installRoot, { recursive: true });
});

test("@claim:local-operation validates named files without a network attempt", () => {
  const files = fixture(typedContract, "APP_PORT=3000\nDEBUG=false\nAPI_TOKEN=safe-token");
  const shimSource = join(files.directory, "deny-network.c");
  const shim = join(files.directory, "deny-network.so");
  writeFileSync(shimSource, `#include <sys/socket.h>
#include <errno.h>
#include <unistd.h>
int socket(int domain, int type, int protocol) {
  const char marker[] = "NETWORK_ATTEMPT";
  write(2, marker, sizeof(marker) - 1);
  errno = EPERM;
  return -1;
}
`);
  const compile = spawnSync("cc", ["-shared", "-fPIC", shimSource, "-o", shim], { encoding: "utf8" });
  expect(compile.status, compile.stderr).toBe(0);
  const result = spawnSync(binary, ["check", "-c", files.contractPath, "-e", files.environmentPath, "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, LD_PRELOAD: shim },
  });
  expect(result.status).toBe(0);
  expect(result.stderr).not.toContain("NETWORK_ATTEMPT");
  expect(JSON.parse(result.stdout).ok).toBe(true);
  rmSync(files.directory, { recursive: true });
});

test("@claim:demo-sandbox shows, resets, and discards browser sample data", async ({ page }) => {
  const requests: { url: string; data: string | null }[] = [];
  page.on("request", (request) => requests.push({ url: request.url(), data: request.postData() }));
  await page.goto("/demo/");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#result-panel")).toContainText("3 errors, 3 warnings");

  const canary = "secret-browser-canary-a821";
  await page.getByLabel("Sample environment file").fill(`APP_PORT=3000\nDEBUG=false\nDATABASE_URL=${canary}`);
  await page.getByRole("button", { name: "Check sample contract" }).click();
  await expect(page.locator("#result-panel")).not.toContainText(canary);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(requests.every((request) => new URL(request.url).origin === new URL(page.url()).origin)).toBe(true);
  expect(requests.every((request) => !request.data?.includes(canary))).toBe(true);

  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByLabel("Sample environment file")).toHaveValue('APP_PORT="3000"\nDEBUG="false"\nDATABASE_URL="https://db.internal/app"\nLOG_LEVEL=info');
  await expect(page.getByLabel("Target parser")).toHaveValue("docker");
  await expect(page.locator("#result-panel")).toContainText("3 errors, 3 warnings");
  await page.reload();
  await expect(page.getByLabel("Sample environment file")).not.toHaveValue(new RegExp(canary));
});

test("@claim:offline-reload reloads the sample after the network is disabled", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  await page.goto("/demo/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.locator("#result-panel")).toContainText("3 errors, 3 warnings");
  await context.close();
});

test("@claim:consumer-install installs and runs the free MIT-licensed core", () => {
  const installRoot = mkdtempSync(join(tmpdir(), "env-contract-check-consumer-"));
  const install = spawnSync("cargo", ["install", "--path", join(root, "crates", "env-contract-check"), "--root", installRoot, "--locked", "--debug"], {
    cwd: tmpdir(),
    encoding: "utf8",
    env: { ...process.env, CARGO_TARGET_DIR: join(root, "target", "claim-consumer") },
  });
  expect(install.status, install.stderr).toBe(0);
  const installed = join(installRoot, "bin", process.platform === "win32" ? "env-contract-check.exe" : "env-contract-check");
  const demo = runBinary(["demo", "--json"], installed);
  expect(demo.status).toBe(0);
  expect(JSON.parse(demo.stdout).ok).toBe(true);
  expect(readFileSync(join(root, "LICENSE"), "utf8")).toContain("Permission is hereby granted, free of charge");
  rmSync(installRoot, { recursive: true });
});

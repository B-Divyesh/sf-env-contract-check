import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
});

test("has a semantic, accessible landing page", async ({ page }) => {
  await expect(page).toHaveTitle(/Env Contract Check/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("img:not([alt])")).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""));
  expect(serious).toEqual([]);
});

test("first screen names the job, audience, and sample action", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Validate .env files before services start");
  await expect(page.locator(".hero .lede")).toContainText("developers");
  await expect(page.locator(".hero .lede")).toContainText("laptops, CI, Docker, and deployments");
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
  await expect(page.locator(".action-note")).toContainText("Loads a sample .env");
});

test("demo exposes parser-specific meaning and empty errors", async ({ page }) => {
  const result = page.locator("#result-panel");
  await page.getByRole("button", { name: "Check sample contract" }).click();
  await expect(result).toContainText("Contract holds");

  await page.getByLabel("Target parser").selectOption("docker");
  await page.getByRole("button", { name: "Check sample contract" }).click();
  await expect(result).toContainText("3 errors, 3 warnings");
  await expect(result).toContainText("Docker keeps the surrounding quotes");
  await expect(result).not.toContainText("https://db.internal");

  await page.getByLabel("Environment file").fill("");
  await page.getByRole("button", { name: "Check sample contract" }).click();
  await expect(result).toContainText("environment file is empty");
});

test("keyboard path reaches and runs the primary demo action", async ({ page }) => {
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.getByLabel("Target parser").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Check sample contract" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#result-panel")).toContainText("Contract holds");
});

test("390px layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await expect(page.getByRole("link", { name: "Try it with sample data" })).toBeVisible();
});

test("footer links provide 44px touch targets on every route", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/demo/", "/privacy/", "/terms/", "/this-page-does-not-exist"]) {
    await page.goto(path);
    const targets = await page.locator("footer nav a").evaluateAll((links) => links.map((link) => {
      const { width, height } = link.getBoundingClientRect();
      return { label: link.textContent?.trim(), width, height };
    }));
    expect(targets).not.toHaveLength(0);
    for (const target of targets) {
      expect(target.width, `${path} footer link ${target.label}`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${path} footer link ${target.label}`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("offline state explains that local tools remain available", async ({ page, context }) => {
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.locator("#offline-note")).toBeVisible();
  await expect(page.locator("#offline-note")).toContainText("demo and docs still work");
  await context.setOffline(false);
});

test("deployment policy sends security, cache, and designed 404 responses", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(home.headers()["permissions-policy"]).toContain("camera=()");
  expect(home.headers()["cache-control"]).toBe("no-cache");

  const html = await home.text();
  const assetPath = html.match(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/)?.[1];
  expect(assetPath).toBeTruthy();
  const asset = await request.get(assetPath!);
  expect(asset.headers()["cache-control"]).toContain("max-age=31536000");
  expect(asset.headers()["cache-control"]).toContain("immutable");

  for (const path of ["/fonts/fraunces-latin.woff2", "/registration-press-720.webp"]) {
    const response = await request.get(path);
    expect(response.headers()["cache-control"]).toContain("max-age=31536000");
    expect(response.headers()["cache-control"]).toContain("immutable");
  }

  const serviceWorker = await request.get("/sw.js");
  expect(serviceWorker.headers()["cache-control"]).toBe("no-cache");

  const missing = await request.get("/this-page-does-not-exist");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("This page does not exist");
});

for (const path of ["/demo/", "/privacy/", "/terms/"]) {
  test(`${path} is accessible`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""));
    expect(serious).toEqual([]);
  });
}

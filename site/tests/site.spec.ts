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

test("demo exposes parser-specific meaning and empty errors", async ({ page }) => {
  const result = page.locator("#result-panel");
  await page.getByRole("button", { name: "Check contract" }).click();
  await expect(result).toContainText("Contract holds");

  await page.getByLabel("Target parser").selectOption("docker");
  await page.getByRole("button", { name: "Check contract" }).click();
  await expect(result).toContainText("3 errors, 3 warnings");
  await expect(result).toContainText("Docker keeps the surrounding quotes");
  await expect(result).not.toContainText("https://db.internal");

  await page.getByLabel("Environment file").fill("");
  await page.getByRole("button", { name: "Check contract" }).click();
  await expect(result).toContainText("environment file is empty");
});

test("keyboard path reaches and runs the primary demo action", async ({ page }) => {
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.getByLabel("Target parser").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Check contract" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#result-panel")).toContainText("Contract holds");
});

test("mobile layout has no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await expect(page.getByRole("link", { name: "Install the CLI" })).toBeVisible();
});

test("offline state explains that local tools remain available", async ({ page, context }) => {
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.locator("#offline-note")).toBeVisible();
  await expect(page.locator("#offline-note")).toContainText("demo and docs still work");
  await context.setOffline(false);
});

for (const path of ["/privacy/", "/terms/"]) {
  test(`${path} is accessible`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""));
    expect(serious).toEqual([]);
  });
}

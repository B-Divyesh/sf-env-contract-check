import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./site/tests",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  projects: [
    { name: "desktop", testIgnore: /claims\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-390", testIgnore: /claims\.spec\.ts/, use: { viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: "claims", testMatch: /claims\.spec\.ts/, use: { ...devices["Desktop Chrome"] } }
  ],
  webServer: {
    command: "swa start dist/site --host 127.0.0.1 --port 4173 --swa-config-location dist/site",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

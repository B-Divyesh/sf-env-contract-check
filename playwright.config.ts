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
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true } }
  ],
  webServer: {
    command: "npx vite preview --config site/vite.config.ts --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  }
});

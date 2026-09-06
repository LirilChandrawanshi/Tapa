import { defineConfig, devices } from "@playwright/test";

/**
 * Tapa frontend E2E suite.
 *
 * Assumes:
 *  - the seeded Spring backend is UP on :8080 (verified in global-setup,
 *    which fails fast with a clear message otherwise);
 *  - the frontend has been built (`npm run build`) — the webServer below
 *    only runs `next start` on port 3100. All browser API calls go through
 *    the Next `/api/v1` rewrite proxy, so :3100 is same-origin everywhere.
 *  - feature flags kits_launched / purohit_tab_visible are OFF (their
 *    documented default); global-setup normalises them to OFF if needed.
 */
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup",
  retries: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      // Signs in as the seeded admin once and stores the session cookies.
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

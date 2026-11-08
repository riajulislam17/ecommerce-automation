import { defineConfig, devices } from "@playwright/test";
import { environment } from "./config/environment";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  // Record every failure and continue with the remaining independent cases.
  maxFailures: 2,
  // A retry must never create a second staging order.
  retries: 1,
  forbidOnly: !!process.env.CI,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results/artifacts",
  // Discovery must not replace completed HTML/JSON reports with unexecuted tests.
  reporter: process.argv.includes("--list")
    ? [["list"]]
    : [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
      ],
  use: {
    baseURL: environment.baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    locale: "en-GB",
    timezoneId: "Asia/Dhaka",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        channel: environment.browserChannel,
      },
    },
  ],
});

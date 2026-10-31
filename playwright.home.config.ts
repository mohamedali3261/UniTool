import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./src/pages/Home/tests",
  outputDir: "./test-results/home",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    headless: true,
    screenshot: "only-on-failure",
    trace: "off",
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  webServer: process.env.HOME_QA_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        url: "http://localhost:3000/",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

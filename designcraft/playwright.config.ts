import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "../test-results/designcraft",
  workers: 1,
  timeout: 45000,
  use: {
    headless: true,
    screenshot: "only-on-failure",
    trace: "off",
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  webServer: process.env.DESIGN_QA_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        cwd: "..",
        url: "http://localhost:3000/designcraft.html",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});

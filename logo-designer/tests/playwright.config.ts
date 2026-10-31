import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../test-results/logo-designer",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.LOGO_QA_URL || "http://localhost:3000",
    headless: true,
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
    screenshot: "only-on-failure",
  },
  webServer: process.env.LOGO_QA_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        url: "http://localhost:3000/logo-designer/",
        reuseExistingServer: true,
      },
});

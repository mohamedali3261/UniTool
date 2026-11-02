import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../test-results/pdf-studio",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: process.env.PDF_QA_URL || "http://localhost:3000",
    headless: true,
    viewport: { width: 1440, height: 1050 },
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
    screenshot: "only-on-failure",
  },
  webServer: process.env.PDF_QA_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        url: "http://localhost:3000/pdf-studio/",
        reuseExistingServer: true,
      },
});

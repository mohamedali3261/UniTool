import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../test-results/excel-studio",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.EXCEL_QA_URL || "http://localhost:3000",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      env: { ...process.env, LANG: process.env.LANG || "C.UTF-8" },
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
    screenshot: "only-on-failure",
  },
  webServer: process.env.EXCEL_QA_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        url: "http://localhost:3000/excel-studio/",
        reuseExistingServer: true,
      },
});

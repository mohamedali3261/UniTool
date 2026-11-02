import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../../../test-results/qr-logo",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.QR_QA_URL || "http://localhost:4173",
    headless: true,
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
});

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 60000,
  outputDir: "../../test-results/product-studio",
  use: {
    baseURL: process.env.PRODUCT_URL || "http://localhost:3000",
    headless: true,
    deviceScaleFactor: 2,
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: process.env.PRODUCT_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        url: "http://localhost:3000/product-studio/",
        reuseExistingServer: true,
        timeout: 120000,
      },
});

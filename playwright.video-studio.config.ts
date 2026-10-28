import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./video-studio/tests/browser",
  outputDir: "./test-results/video-studio",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    headless: true,
    // Never capture request headers containing the shared API credential in traces.
    trace: "off",
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
  webServer: process.env.STUDIO_QA_URL
    ? undefined
    : {
        command: "npm run dev -- --strictPort",
        url: "http://localhost:3000/video-studio.html",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

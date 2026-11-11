import { defineConfig, devices } from '@playwright/test';

/**
 * Download QA. The reported bug was "the download buttons do nothing in
 * Safari", so this suite is meant to run on WebKit as well as Chromium:
 *
 *   npx playwright install webkit
 *   npm run test:tools:downloads
 *
 * It can still run in Chromium-only environments (CI sandboxes without a
 * WebKit build) — the assertions then guard the shared plumbing, and the
 * Safari-specific rules are covered by `src/tests/downloadSafari.test.ts`.
 */
const onlyChromium = process.env.DOWNLOADS_CHROMIUM_ONLY === '1';

export default defineConfig({
  testDir: './src/tests',
  testMatch: 'tool-downloads.spec.ts',
  outputDir: './test-results/tool-downloads',
  workers: 1,
  timeout: 90_000,
  projects: onlyChromium
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ],
  use: {
    baseURL: process.env.TOOLS_QA_URL || 'http://localhost:3000',
    headless: true,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: process.env.TOOLS_QA_URL
    ? undefined
    : {
        command: 'npm run dev -- --strictPort',
        url: 'http://localhost:3000/app.html',
        reuseExistingServer: !process.env.CI,
      },
});

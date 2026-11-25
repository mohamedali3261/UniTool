import { defineConfig } from '@playwright/test';

/**
 * Browser QA for the font studio. Run it locally (Playwright browsers cannot be
 * installed in the sandbox):
 *
 *   npm run dev -- --strictPort        # in one terminal
 *   npm run test:font-lab:browser      # in another
 */
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '../../test-results/font-lab',
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: process.env.FONT_LAB_URL || 'http://localhost:3000',
    headless: true,
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
    screenshot: 'only-on-failure',
  },
  webServer: process.env.FONT_LAB_URL
    ? undefined
    : {
        command: 'npm run dev -- --strictPort',
        url: 'http://localhost:3000/font-lab/',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

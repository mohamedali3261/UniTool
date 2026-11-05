import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/tests', testMatch: 'site-appearance.spec.ts',
  outputDir: './test-results/site-appearance', workers: 2, timeout: 60_000,
  use: {
    baseURL: process.env.SITE_QA_URL || 'http://localhost:3000', headless: true,
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] },
  },
  webServer: process.env.SITE_QA_URL ? undefined : { command: 'npm run dev -- --strictPort', url: 'http://localhost:3000/', reuseExistingServer: !process.env.CI },
});

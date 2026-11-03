import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.ts', workers: 1, timeout: 60000,
  outputDir: '../test-results/site-storage',
  use: { headless: true, screenshot: 'only-on-failure', launchOptions: { executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined, args: ['--no-sandbox','--disable-dev-shm-usage'] } },
});

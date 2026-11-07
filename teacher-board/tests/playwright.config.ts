import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.BOARD_QA_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
});

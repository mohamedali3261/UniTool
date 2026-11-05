import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/tests',
  testMatch: 'tools-appearance.spec.ts',
  outputDir: './test-results/tools-appearance',
  workers: 2,
  timeout: 45_000,
  use: {
    baseURL: process.env.TOOLS_QA_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.STUDIO_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: process.env.TOOLS_QA_URL ? undefined : {
    command: 'npm run dev -- --strictPort', url: 'http://localhost:3000/app.html', reuseExistingServer: !process.env.CI,
  },
});

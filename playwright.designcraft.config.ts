import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './designcraft/tests/browser',
  outputDir: './test-results/designcraft',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    headless: true,
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.DESIGNCRAFT_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: process.env.DESIGNCRAFT_QA_URL ? undefined : {
    command: 'npm run dev -- --strictPort',
    url: 'http://localhost:3000/designcraft.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

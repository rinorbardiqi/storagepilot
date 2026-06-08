import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const demoPauseMs = Number(process.env.DEMO_PAUSE_MS ?? '1200');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'providers',
      testMatch: 'providers.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'demo',
      testMatch: 'demo-video.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        video: {
          mode: 'on',
          size: { width: 1920, height: 1080 },
        },
        launchOptions: {
          slowMo: Number(process.env.DEMO_SLOW_MO ?? '120'),
        },
      },
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_START_WEBSERVER === '1'
      ? {
          command: 'pnpm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          cwd: '.',
        }
      : undefined,
});

export { demoPauseMs };

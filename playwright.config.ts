import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests',
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev:e2e --workspace apps/api',
      url: 'http://127.0.0.1:4100/health',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        NODE_ENV: 'test',
        PORT: '4100',
        WEB_ORIGIN: 'http://127.0.0.1:5174',
        AI_PROVIDER: 'mock',
        RESEND_API_KEY: 'replace-with-test-disabled',
      },
    },
    {
      command: 'npm run dev:e2e --workspace apps/web',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        VITE_API_URL: 'http://127.0.0.1:4100',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

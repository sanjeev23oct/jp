import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 240000, // 4 minutes per test (for LLM generation)
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5189',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd backend && npm run dev',
      port: 3001,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 5189,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});


import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright configuration for smoke tests.
 * Tests verify core routes render without errors.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    // Override with E2E_BASE_URL env var for testing against different deployments
    // Example: E2E_BASE_URL=https://preview.example.com npm run e2e
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  forbidOnly: !!process.env.CI,
});

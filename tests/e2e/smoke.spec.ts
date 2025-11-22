import { test, expect } from '@playwright/test';
import { mockAuthSession } from './helpers/auth';

/**
 * Smoke tests: verify core routes render successfully with key content.
 * Minimal coverage to catch hard failures before Lighthouse CI runs.
 */

const publicPages = [
  { path: '/', selector: 'text=Understand Next.js Rendering Strategies' },
  { path: '/lab', selector: 'text=Rendering Strategy Lab' },
  { path: '/analyze', selector: 'text=Website Performance Analyzer' },
];

const protectedPages = [
  { path: '/dashboard', selector: 'h1:has-text("Performance Dashboard")' },
  { path: '/platform', selector: 'h1:has-text("Vercel Platform Features")' },
  { path: '/trends', selector: 'text=Performance Trends' },
];

test.describe('Public Pages - Smoke Tests', () => {
  for (const p of publicPages) {
    test(`renders ${p.path}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(p.path, { timeout: 10_000 });
      await expect(page.locator(p.selector)).toBeVisible({ timeout: 10_000 });
      
      // Allow some expected warnings (e.g., React hydration) but fail on critical errors
      const criticalErrors = consoleErrors.filter(
        (msg) => !msg.includes('Hydration') && !msg.includes('Warning')
      );
      expect(criticalErrors, `Console errors on ${p.path}`).toEqual([]);
    });
  }
});

test.describe('Protected Pages - Smoke Tests', () => {
  // Mock authentication before each test
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
  });

  for (const p of protectedPages) {
    test(`renders ${p.path} with auth`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(p.path, { timeout: 10_000 });
      await expect(page.locator(p.selector)).toBeVisible({ timeout: 10_000 });
      
      // Allow some expected warnings (e.g., React hydration) but fail on critical errors
      const criticalErrors = consoleErrors.filter(
        (msg) => !msg.includes('Hydration') && !msg.includes('Warning')
      );
      expect(criticalErrors, `Console errors on ${p.path}`).toEqual([]);
    });
  }
});

test.describe('Authentication Flow', () => {
  test('redirects to login when accessing protected page without auth', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    await expect(page.locator('text=Access is restricted')).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
    await expect(page.locator('text=Access is restricted')).toBeVisible();
  });
});

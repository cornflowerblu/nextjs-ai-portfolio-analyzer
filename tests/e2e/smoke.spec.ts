import { test, expect } from '@playwright/test';

/**
 * Smoke tests: verify core routes render successfully with key content.
 * Minimal coverage to catch hard failures before Lighthouse CI runs.
 */

const pages = [
  { path: '/', selector: 'text=Understand Next.js Rendering Strategies' },
  { path: '/dashboard', selector: 'text=SSR' },
  { path: '/lab', selector: 'text=Rendering Strategy Lab' },
  { path: '/analyze', selector: 'text=Website Performance Analyzer' },
  { path: '/platform', selector: 'text=Platform Features' },
  { path: '/trends', selector: 'text=Performance Trends' },
];

test.describe('Smoke Tests', () => {
  for (const p of pages) {
    test(`renders ${p.path}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(p.path);
      await expect(page.locator(p.selector)).toBeVisible({ timeout: 10_000 });
      
      // Allow some expected warnings (e.g., React hydration) but fail on critical errors
      const criticalErrors = consoleErrors.filter(
        (msg) => !msg.includes('Hydration') && !msg.includes('Warning')
      );
      expect(criticalErrors, `Console errors on ${p.path}`).toEqual([]);
    });
  }
});

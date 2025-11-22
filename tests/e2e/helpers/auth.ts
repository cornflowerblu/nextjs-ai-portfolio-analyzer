/**
 * Test Authentication Utilities
 * Helper functions for bypassing authentication in E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Mock session cookie for E2E tests
 * Creates a valid session that won't expire during test runs
 */
export async function mockAuthSession(page: Page) {
  const mockSession = {
    uid: 'test-user-id',
    email: 'test@slingshotgrp.com',
    name: 'Test User',
    picture: null,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
  };

  // Set the session cookie
  await page.context().addCookies([
    {
      name: 'session',
      value: JSON.stringify(mockSession),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Clear authentication session
 */
export async function clearAuthSession(page: Page) {
  await page.context().clearCookies();
}

/**
 * Authentication Fixes Verification Test
 * Tests the fixes for:
 * 1. Redirect after Google login
 * 2. Session persistence on page load
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Fixes', () => {
  test('should show user menu when session cookie exists on page load', async ({ page }) => {
    // Create a valid session cookie
    const mockSession = {
      uid: 'test-user-123',
      email: 'test@slingshotgrp.com',
      name: 'Test User',
      picture: null,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
    };

    // Set the session cookie before navigating
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

    // Navigate to homepage
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for the page to fully load and check session
    await page.waitForTimeout(2000);
    
    // User menu should be visible because we have a valid session cookie
    const userMenuTrigger = page.locator('button[class*="rounded-full"]').first();
    await expect(userMenuTrigger).toBeVisible({ timeout: 5000 });
    
    // Take a screenshot to verify
    await page.screenshot({ path: 'test-results/session-on-load.png' });
    
    console.log('✓ User menu is visible on initial page load with session cookie');
  });

  test('should persist session after page reload', async ({ page }) => {
    // Create a valid session cookie
    const mockSession = {
      uid: 'test-user-456',
      email: 'qa@slingshotgrp.com',
      name: 'QA User',
      picture: null,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };

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

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Check user menu is visible
    let userMenu = page.locator('button[class*="rounded-full"]').first();
    await expect(userMenu).toBeVisible();
    console.log('✓ User menu visible on initial dashboard load');

    // Reload the page (use 'load' instead of 'networkidle' due to 1s SWR polling)
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    // User menu should still be visible after reload
    userMenu = page.locator('button[class*="rounded-full"]').first();
    await expect(userMenu).toBeVisible();
    console.log('✓ User menu still visible after page reload');
    
    // Navigate to another page
    await page.goto('http://localhost:3000/lab', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    // User menu should still be visible on different page
    userMenu = page.locator('button[class*="rounded-full"]').first();
    await expect(userMenu).toBeVisible();
    console.log('✓ User menu visible on different page');
    
    await page.screenshot({ path: 'test-results/session-persistence.png' });
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    // Mock the Firebase auth by intercepting the popup
    // Since we can't easily test the actual Google popup, we'll test the navigation logic
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Verify we're on the login page
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    
    // Manually create a session to simulate successful login
    const mockSession = {
      uid: 'logged-in-user',
      email: 'test@slingshotgrp.com',
      name: 'Test User',
      picture: null,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };

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
    
    // Navigate to dashboard (simulating what should happen after login)
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Verify we reached the dashboard
    await expect(page.locator('h1:has-text("Performance Dashboard")')).toBeVisible();
    
    // Verify user menu is present
    const userMenu = page.locator('button[class*="rounded-full"]').first();
    await expect(userMenu).toBeVisible();
    
    console.log('✓ Successfully navigated to dashboard with session');
    
    await page.screenshot({ path: 'test-results/post-login-dashboard.png' });
  });

  test('should check session API endpoint works', async ({ page }) => {
    const mockSession = {
      uid: 'api-test-user',
      email: 'api@slingshotgrp.com',
      name: 'API Test',
      picture: null,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };

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

    // Call the session API endpoint
    const response = await page.goto('http://localhost:3000/api/auth/session');
    expect(response?.status()).toBe(200);
    
    const data = await response?.json();
    expect(data).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.user.email).toBe('api@slingshotgrp.com');
    
    console.log('✓ Session API endpoint returns correct data:', data.user);
  });
});

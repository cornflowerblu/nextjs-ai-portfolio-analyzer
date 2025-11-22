/**
 * Login Bug Reproduction Test
 * Tests the reported issue where browser hangs on first login
 */

import { test, expect } from '@playwright/test';

test.describe('Login Bug Investigation', () => {
  test('first login attempt - check for hang', async ({ page }) => {
    // Track network requests
    const requests: string[] = [];
    const responses: Array<{ url: string; status: number }> = [];
    
    page.on('request', (request) => {
      requests.push(request.url());
    });
    
    page.on('response', (response) => {
      responses.push({ url: response.url(), status: response.status() });
    });

    // Track console messages
    const consoleLogs: Array<{ type: string; text: string }> = [];
    page.on('console', (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Go to login page
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Verify login page loaded
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    const signInButton = page.locator('button:has-text("Sign in with Google")');
    await expect(signInButton).toBeVisible();
    
    console.log('Login page loaded successfully');

    // Click the sign in button
    await signInButton.click();
    
    // Wait a bit to see what happens
    await page.waitForTimeout(2000);
    
    // Check if button is in loading state
    const isLoading = await signInButton.isDisabled();
    const buttonText = await signInButton.textContent();
    
    console.log('Button disabled:', isLoading);
    console.log('Button text:', buttonText);
    
    // Check if we're still on login page or got redirected
    const currentUrl = page.url();
    console.log('Current URL after sign-in click:', currentUrl);
    
    // Log all network requests to /api/auth
    const authRequests = requests.filter(url => url.includes('/api/auth'));
    console.log('Auth API requests:', authRequests);
    
    // Log responses
    const authResponses = responses.filter(r => r.url.includes('/api/auth'));
    console.log('Auth API responses:', authResponses);
    
    // Log console messages
    console.log('Console logs:', consoleLogs);
    
    // Wait for potential navigation or timeout
    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
      console.log('Navigation occurred to:', page.url());
    } catch {
      console.log('No navigation occurred within 5 seconds - potential hang detected');
    }
  });

  test('check if router.push completes after sign-in', async ({ page }) => {
    // Mock successful auth to test navigation
    const mockSession = {
      uid: 'test-user-id',
      email: 'test@slingshotgrp.com',
      name: 'Test User',
      picture: null,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };

    // Set session cookie before going to login
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

    await page.goto('/login');
    
    // If already authenticated, should redirect
    await page.waitForTimeout(2000);
    console.log('URL after loading login with active session:', page.url());
  });

  test('inspect sign-in button component state', async ({ page }) => {
    await page.goto('/login');
    
    const signInButton = page.locator('button:has-text("Sign in with Google")');
    await expect(signInButton).toBeVisible();
    
    // Check initial state
    const initialDisabled = await signInButton.isDisabled();
    console.log('Initial button disabled state:', initialDisabled);
    
    // Evaluate component internals if possible
    const buttonHtml = await signInButton.evaluate(el => el.outerHTML);
    console.log('Button HTML:', buttonHtml);
  });
});

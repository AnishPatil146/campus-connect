import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Requires the Next.js dev server running on http://localhost:3000
 */

test.describe('Navigation & Auth Guards', () => {
  test('FRONT_NAV_001: unauthenticated user accessing /dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test('FRONT_NAV_002: unauthenticated user accessing /timetable is redirected to /login', async ({ page }) => {
    await page.goto('/timetable');
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test('FRONT_NAV_003: /login page should load correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});

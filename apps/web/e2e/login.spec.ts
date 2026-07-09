import { test, expect } from '@playwright/test';

/**
 * Login Page E2E Tests
 * Requires the Next.js dev server running on http://localhost:3000
 * Run with: pnpm --filter @campus-connect/web exec playwright test
 */

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('FRONT_E2E_001: should display the login form', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('FRONT_E2E_002: should show error for empty form submission', async ({ page }) => {
    await page.locator('button[type="submit"]').first().click();
    // Either a browser validation message or custom error should appear
    const emailInput = page.locator('input[type="email"]').first();
    const validationMsg = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMsg.length).toBeGreaterThan(0);
  });

  test('FRONT_E2E_003: should navigate to dashboard on valid login', async ({ page }) => {
    // Fill credentials (these must match your seeded admin account)
    await page.locator('input[type="email"]').first().fill('admin@campusconnect.edu');
    await page.locator('input[type="password"]').first().fill('Admin@123456');
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('FRONT_E2E_004: should show error message for wrong credentials', async ({ page }) => {
    await page.locator('input[type="email"]').first().fill('wrong@college.edu');
    await page.locator('input[type="password"]').first().fill('WrongPassword!');
    await page.locator('button[type="submit"]').first().click();

    // An error notification/alert should appear
    await expect(page.locator('[role="alert"], .error, [data-testid="error"]').first()).toBeVisible({ timeout: 5000 });
  });
});

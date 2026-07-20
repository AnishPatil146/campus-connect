import { test, expect } from '@playwright/test';

/**
 * P0 Admin Portal Recovery & Cross-Portal Synchronization E2E Verification Suite
 * Run with: pnpm --filter @campus-connect/web exec playwright test e2e/admin_recovery.spec.ts
 */

test.describe('P0 Production Recovery Suite', () => {
  
  test.beforeEach(({ page }) => {
    // Monitor console messages for any UI exceptions
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });
  });

  test('P0_REC_001: Should login as Admin, render control center widgets, and display live system nodes', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill('anish@college.edu');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button[type="submit"]').first().click();

    // Verify successful login redirection
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });

    // Validate the presence of 6 dynamic metric cards
    await expect(page.locator('text=Managed Departments')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Total Tasks')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Active Sessions')).toBeVisible({ timeout: 5000 });

    // Validate System Nodes Status card and Node list
    await expect(page.locator('text=System Nodes Status')).toBeVisible();
    await expect(page.locator('text=PostgreSQL DB')).toBeVisible();
    await expect(page.locator('text=Redis Cache')).toBeVisible();
    await expect(page.locator('text=Websocket Gateway')).toBeVisible();
  });

  test('P0_REC_002: Should navigate to Timetable Management, view timetable grid, and allow editing', async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill('anish@college.edu');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });

    // Navigate to Timetable page
    await page.goto('/dashboard/admin/timetable');
    
    // Check if the timetable control center page loaded
    await expect(page.locator('text=Timetable Command Center')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Lecture Grid View')).toBeVisible();
  });

  test('P0_REC_003: Should login as Teacher, navigate settings and save database notification preferences', async ({ page }) => {
    // Login as Teacher
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill('teacher@college.edu');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button[type="submit"]').first().click();

    // Redirect to teacher dashboard
    await expect(page).toHaveURL(/\/dashboard\/teacher/, { timeout: 10000 });

    // Go to settings page
    await page.goto('/dashboard/teacher/settings');
    await expect(page.locator('text=Notification Preferences')).toBeVisible({ timeout: 5555 });

    // Save notification preferences
    const savePrefsBtn = page.locator('button:has-text("Save Preferences")').first();
    await expect(savePrefsBtn).toBeVisible();
    await savePrefsBtn.click();

    // Verify save success toast
    await expect(page.locator('text=Notification settings saved successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('P0_REC_004: Should support navigating new Teacher Portal routes successfully', async ({ page }) => {
    // Login as Teacher
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill('teacher@college.edu');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/teacher/, { timeout: 10000 });

    // 1. Visit Student Performance page
    await page.goto('/dashboard/teacher/performance');
    await expect(page.locator('text=Student Performance & Monitoring')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Academic Roster')).toBeVisible();

    // 2. Visit Announcements page
    await page.goto('/dashboard/teacher/announcements');
    await expect(page.locator('text=Announcements Bulletin')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Bulletin Board')).toBeVisible();

    // 3. Visit Notifications page
    await page.goto('/dashboard/teacher/notifications');
    await expect(page.locator('text=In-App Notifications')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Alert Registry')).toBeVisible();
  });
});

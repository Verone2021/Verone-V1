import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Back-Office Finance (COMPTA)
 * Validates: Transactions, Dépenses, Factures, Organisations
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Back-Office Finance Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill(
      'input[name="email"], input[placeholder*="email"]',
      'veronebyromeo@gmail.com'
    );
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button:has-text("Se connecter")');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('1. Dashboard loads successfully', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 10000,
    });
  });

  test('2. Transactions page loads with Qonto data', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance/transactions`);
    await expect(page.locator('h1:has-text("Transactions")')).toBeVisible({
      timeout: 10000,
    });
    // Verify Sync Qonto button exists
    await expect(page.locator('button:has-text("Sync Qonto")')).toBeVisible();
    // Verify tabs exist
    await expect(page.locator('text=A traiter')).toBeVisible();
  });

  test('3. Dépenses page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance/depenses`);
    await page.waitForLoadState('networkidle');
    // Page should load without errors
    await expect(page).not.toHaveTitle(/error/i);
  });

  test('4. Factures page loads with Qonto sync', async ({ page }) => {
    await page.goto(`${BASE_URL}/factures`);
    await expect(page.locator('h1:has-text("Factures")')).toBeVisible({
      timeout: 10000,
    });
    // Verify Sync Qonto button exists
    await expect(page.locator('button:has-text("Sync Qonto")')).toBeVisible();
  });

  test('5. Organisations page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts-organisations`);
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible({
      timeout: 10000,
    });
    // Verify stats are displayed
    await expect(page.locator('text=Total Organisations')).toBeVisible();
  });
});

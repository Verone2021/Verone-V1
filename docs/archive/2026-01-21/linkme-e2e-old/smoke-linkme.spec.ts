import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - LinkMe (Affiliation Platform)
 * Validates: Catalogue, Commissions, Commandes
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

test.describe('LinkMe Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login with Pokawa test account
    await page.goto(`${BASE_URL}/login`);
    // Wait for page to load (may auto-login via shared session)
    await page.waitForTimeout(3000);

    // If not logged in, click test accounts button
    const testAccountsButton = page.locator(
      'button:has-text("Comptes de test")'
    );
    if (await testAccountsButton.isVisible()) {
      await testAccountsButton.click();
      // Select Pokawa account
      await page.click('text=Pokawa');
      await page.waitForTimeout(2000);
    }

    // Wait for dashboard or authenticated state
    await page.waitForURL(/\/(dashboard|catalogue|login)/, { timeout: 15000 });
  });

  test('1. Dashboard loads with affiliate info', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('text=Bienvenue')).toBeVisible({
      timeout: 10000,
    });
    // Verify commissions widget exists
    await expect(page.locator('text=Commissions')).toBeVisible();
  });

  test('2. Catalogue displays products', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogue`);
    await expect(page.locator('h1:has-text("Catalogue")')).toBeVisible({
      timeout: 10000,
    });
    // Verify products are loaded
    await expect(page.locator('text=produits trouvés')).toBeVisible();
    // Verify "Ajouter" buttons exist
    await expect(
      page.locator('button:has-text("Ajouter")').first()
    ).toBeVisible();
  });

  test('3. Commissions page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/commissions`);
    await expect(page.locator('h1:has-text("Commissions")')).toBeVisible({
      timeout: 10000,
    });
    // Verify stats cards exist
    await expect(page.locator('text=Total TTC')).toBeVisible();
    await expect(page.locator('text=Payées')).toBeVisible();
  });

  test('4. Commandes page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/commandes`);
    await expect(page.locator('h1:has-text("Commandes")')).toBeVisible({
      timeout: 10000,
    });
    // Verify "Nouvelle vente" button exists
    await expect(
      page.locator('button:has-text("Nouvelle vente")')
    ).toBeVisible();
  });

  test('5. Ma sélection page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/ma-selection`);
    await page.waitForLoadState('networkidle');
    // Page should load without errors
    await expect(page).not.toHaveTitle(/error/i);
  });
});

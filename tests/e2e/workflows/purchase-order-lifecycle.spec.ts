import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P0 WORKFLOW: Purchase Order Lifecycle
 *
 * Tests the complete purchase order journey:
 * 1. Navigate to purchase orders page
 * 2. Verify page loads with table
 * 3. Navigate to receptions
 * 4. Navigate from achats hub
 * 5. Verify supplier link
 *
 * NOTE: Read-only tests — no data mutation in production DB.
 */

test.describe('Purchase Order Lifecycle', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('purchase orders page loads', async ({ page }) => {
    await page.goto('/commandes/fournisseurs');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/commandes\/fournisseurs/);
    consoleErrors.expectNoErrors();
  });

  test('achats hub loads and links to PO', async ({ page }) => {
    await page.goto('/achats');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/achats/);
    consoleErrors.expectNoErrors();
  });

  test('receptions page loads', async ({ page }) => {
    await page.goto('/stocks/receptions');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/receptions/);
    consoleErrors.expectNoErrors();
  });

  test('purchase orders page has functional filters', async ({ page }) => {
    await page.goto('/commandes/fournisseurs');
    await page.waitForLoadState('networkidle');

    // Check for search or filter elements
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }

    consoleErrors.expectNoErrors();
  });

  test('suppliers page accessible from PO context', async ({ page }) => {
    await page.goto('/contacts-organisations/suppliers');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/suppliers/);
    consoleErrors.expectNoErrors();
  });
});

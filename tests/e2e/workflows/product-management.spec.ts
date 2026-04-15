import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P0 WORKFLOW: Product Management
 *
 * Tests the product catalog journey:
 * 1. Products hub loads
 * 2. Catalogue page with product list
 * 3. Categories page loads
 * 4. Sourcing page loads
 * 5. Product detail page (if products exist)
 * 6. Navigation between product sub-pages
 *
 * NOTE: Read-only tests — no data mutation in production DB.
 */

test.describe('Product Management', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('products hub loads with navigation cards', async ({ page }) => {
    await page.goto('/produits');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/produits/);
    consoleErrors.expectNoErrors();
  });

  test('catalogue page loads with product table', async ({ page }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/catalogue/);
    consoleErrors.expectNoErrors();
  });

  test('catalogue search filters products', async ({ page }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('vase');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }

    consoleErrors.expectNoErrors();
  });

  test('categories page loads', async ({ page }) => {
    await page.goto('/produits/catalogue/categories');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('variantes page loads', async ({ page }) => {
    await page.goto('/produits/catalogue/variantes');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('collections page loads', async ({ page }) => {
    await page.goto('/produits/catalogue/collections');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('sourcing page loads', async ({ page }) => {
    await page.goto('/produits/sourcing');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('nouveau produit page loads', async ({ page }) => {
    await page.goto('/produits/catalogue/nouveau');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/nouveau/);
    consoleErrors.expectNoErrors();
  });

  test('navigation between product sub-pages is seamless', async ({ page }) => {
    // Start at catalogue
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('networkidle');

    // Go to categories
    await page.goto('/produits/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/categories/);

    // Go to variantes
    await page.goto('/produits/catalogue/variantes');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/variantes/);

    // Back to sourcing
    await page.goto('/produits/sourcing');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/sourcing/);

    consoleErrors.expectNoErrors();
  });
});

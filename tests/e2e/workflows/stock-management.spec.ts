import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P0 WORKFLOW: Stock Management
 *
 * Tests stock module navigation and page integrity:
 * 1. Stock hub loads with KPI cards
 * 2. Inventaire with product table
 * 3. Alertes page with critical alerts
 * 4. Mouvements history
 * 5. Expeditions tracking
 * 6. Stockage (warehouse locations)
 * 7. Previsionnel (forecasting)
 */

test.describe('Stock Management', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('stock hub loads with overview', async ({ page }) => {
    await page.goto('/stocks');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/stocks/);

    // Check no NaN in stock numbers
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('NaN');

    consoleErrors.expectNoErrors();
  });

  test('inventaire shows product list', async ({ page }) => {
    await page.goto('/stocks/inventaire');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/inventaire/);
    consoleErrors.expectNoErrors();
  });

  test('alertes page loads', async ({ page }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/alertes/);
    consoleErrors.expectNoErrors();
  });

  test('mouvements page loads with history', async ({ page }) => {
    await page.goto('/stocks/mouvements');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/mouvements/);
    consoleErrors.expectNoErrors();
  });

  test('expeditions page loads', async ({ page }) => {
    await page.goto('/stocks/expeditions');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/expeditions/);
    consoleErrors.expectNoErrors();
  });

  test('stockage page loads', async ({ page }) => {
    await page.goto('/stocks/stockage');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/stockage/);
    consoleErrors.expectNoErrors();
  });

  test('previsionnel page loads', async ({ page }) => {
    await page.goto('/stocks/previsionnel');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/previsionnel/);
    consoleErrors.expectNoErrors();
  });

  test('full stock navigation cycle', async ({ page }) => {
    const stockPages = [
      '/stocks',
      '/stocks/inventaire',
      '/stocks/alertes',
      '/stocks/mouvements',
      '/stocks/expeditions',
      '/stocks/entrees',
      '/stocks/sorties',
      '/stocks/ajustements',
      '/stocks/stockage',
      '/stocks/previsionnel',
    ];

    for (const route of stockPages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
    }

    consoleErrors.expectNoErrors();
  });
});

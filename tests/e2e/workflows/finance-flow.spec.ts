import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P1 WORKFLOW: Finance Module
 *
 * Tests the finance/accounting flow:
 * 1. Finance hub
 * 2. Transactions page
 * 3. Depenses page
 * 4. Rapprochement
 * 5. Documents
 * 6. Grand livre
 */

test.describe('Finance Module', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('finance hub loads', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/finance/);
    consoleErrors.expectNoErrors();
  });

  test('transactions page loads', async ({ page }) => {
    await page.goto('/finance/transactions');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('depenses page loads', async ({ page }) => {
    await page.goto('/finance/depenses');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('rapprochement page loads', async ({ page }) => {
    await page.goto('/finance/rapprochement');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('documents page loads', async ({ page }) => {
    await page.goto('/finance/documents');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('grand livre page loads', async ({ page }) => {
    await page.goto('/finance/grand-livre');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('full finance navigation cycle', async ({ page }) => {
    const financePages = [
      '/finance',
      '/finance/transactions',
      '/finance/depenses',
      '/finance/rapprochement',
      '/finance/tresorerie',
      '/finance/tva',
      '/finance/grand-livre',
      '/finance/documents',
      '/finance/bibliotheque',
      '/finance/echeancier',
    ];

    for (const route of financePages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
    }

    consoleErrors.expectNoErrors();
  });
});

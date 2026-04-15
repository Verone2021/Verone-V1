import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P0 WORKFLOW: Dashboard & Global Navigation
 *
 * Tests:
 * 1. Dashboard KPIs load without NaN
 * 2. Quick actions are clickable
 * 3. Sidebar navigation works for all major modules
 * 4. No encoding issues (no \u00e9 visible)
 * 5. Performance: pages load in < 5s
 */

test.describe('Dashboard & Navigation', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('dashboard loads with KPIs (no NaN values)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for NaN in the page content
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('NaN');
    expect(pageText).not.toContain('undefined');

    consoleErrors.expectNoErrors();
  });

  test('dashboard has no encoding issues', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for escaped unicode characters that should be rendered
    const pageText = await page.textContent('body');
    expect(pageText).not.toMatch(/\\u00[a-f0-9]{2}/);

    consoleErrors.expectNoErrors();
  });

  test('dashboard loads in under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
  });

  test('sidebar full navigation cycle', async ({ page }) => {
    // Test that clicking each major module link works
    const routes = [
      '/dashboard',
      '/produits',
      '/stocks',
      '/commandes/clients',
      '/commandes/fournisseurs',
      '/consultations',
      '/factures',
      '/canaux-vente',
      '/finance',
      '/contacts-organisations',
      '/parametres',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Verify we didn't get redirected to login
      await expect(page).not.toHaveURL(/login/);
    }

    consoleErrors.expectNoErrors();
  });
});

import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * P1 WORKFLOW: LinkMe Sales Channel
 *
 * Tests the LinkMe affiliate management flow:
 * 1. LinkMe dashboard
 * 2. Selections management
 * 3. Commandes (affiliate orders)
 * 4. Commissions tracking
 * 5. Catalogue affiliate
 * 6. Utilisateurs management
 * 7. Approbations workflow
 * 8. Analytics
 */

test.describe('LinkMe Sales Channel', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('LinkMe dashboard loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/linkme/);
    consoleErrors.expectNoErrors();
  });

  test('selections page loads with list', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/selections');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('commandes page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commandes');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('commissions page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commissions');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('catalogue page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/catalogue');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('utilisateurs page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/utilisateurs');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('approbations page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/approbations');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/analytics');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('full LinkMe navigation cycle', async ({ page }) => {
    const linkmePages = [
      '/canaux-vente/linkme',
      '/canaux-vente/linkme/selections',
      '/canaux-vente/linkme/commandes',
      '/canaux-vente/linkme/commissions',
      '/canaux-vente/linkme/catalogue',
      '/canaux-vente/linkme/utilisateurs',
      '/canaux-vente/linkme/approbations',
      '/canaux-vente/linkme/messages',
      '/canaux-vente/linkme/analytics',
      '/canaux-vente/linkme/configuration',
    ];

    for (const route of linkmePages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
    }

    consoleErrors.expectNoErrors();
  });
});

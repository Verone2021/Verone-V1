import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE TESTS - All Back Office Modules
 *
 * Objective: Verify every major page loads without console errors.
 * Coverage: All 14 sidebar modules, 1 test per page.
 * Run time target: < 3 minutes total.
 */

test.describe('Smoke Tests - All Modules', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  // =========================================================================
  // 1. DASHBOARD
  // =========================================================================

  test('Dashboard loads with KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 2. MESSAGES
  // =========================================================================

  test('Messages page loads', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/messages/);
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 3. CONTACTS & ORGANISATIONS
  // =========================================================================

  test('Contacts & Organisations hub loads', async ({ page }) => {
    await page.goto('/contacts-organisations');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/contacts-organisations/);
    consoleErrors.expectNoErrors();
  });

  test('Customers page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/customers');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Suppliers page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/suppliers');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Enseignes page loads', async ({ page }) => {
    await page.goto('/contacts-organisations/enseignes');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 4. PRODUITS
  // =========================================================================

  test('Products hub loads', async ({ page }) => {
    await page.goto('/produits');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/produits/);
    consoleErrors.expectNoErrors();
  });

  test('Catalogue page loads', async ({ page }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Sourcing page loads', async ({ page }) => {
    await page.goto('/produits/sourcing');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 5. STOCKS
  // =========================================================================

  test('Stocks hub loads', async ({ page }) => {
    await page.goto('/stocks');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/stocks/);
    consoleErrors.expectNoErrors();
  });

  test('Inventaire page loads', async ({ page }) => {
    await page.goto('/stocks/inventaire');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Alertes page loads', async ({ page }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Expeditions page loads', async ({ page }) => {
    await page.goto('/stocks/expeditions');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Mouvements page loads', async ({ page }) => {
    await page.goto('/stocks/mouvements');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 6. VENTES (Sales Orders)
  // =========================================================================

  test('Sales Orders page loads', async ({ page }) => {
    await page.goto('/commandes/clients');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 7. ACHATS (Purchase Orders)
  // =========================================================================

  test('Purchase Orders page loads', async ({ page }) => {
    await page.goto('/commandes/fournisseurs');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 8. CONSULTATIONS
  // =========================================================================

  test('Consultations page loads', async ({ page }) => {
    await page.goto('/consultations');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 9. FACTURES
  // =========================================================================

  test('Factures page loads', async ({ page }) => {
    await page.goto('/factures');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 10. CANAUX DE VENTE - LINKME
  // =========================================================================

  test('Canaux de Vente hub loads', async ({ page }) => {
    await page.goto('/canaux-vente');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('LinkMe dashboard loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('LinkMe selections page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/selections');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('LinkMe commandes page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commandes');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('LinkMe commissions page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commissions');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('LinkMe catalogue page loads', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/catalogue');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 11. CANAUX DE VENTE - SITE INTERNET
  // =========================================================================

  test('Site Internet page loads', async ({ page }) => {
    await page.goto('/canaux-vente/site-internet');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 12. FINANCE
  // =========================================================================

  test('Finance hub loads', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Finance transactions page loads', async ({ page }) => {
    await page.goto('/finance/transactions');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  test('Finance depenses page loads', async ({ page }) => {
    await page.goto('/finance/depenses');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 13. PARAMETRES
  // =========================================================================

  test('Parametres page loads', async ({ page }) => {
    await page.goto('/parametres');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 14. ADMIN
  // =========================================================================

  test('Admin users page loads', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });

  // =========================================================================
  // 15. NOTIFICATIONS
  // =========================================================================

  test('Notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    consoleErrors.expectNoErrors();
  });
});

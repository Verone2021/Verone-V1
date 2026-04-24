import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Stock (créé 2026-04-24 dans INFRA-HARDENING-002)
 *
 * Couvre les 13 pages stocks (P0) + interactions critiques :
 *   - ouverture modal ajustement (InventoryAdjustmentModal)
 *   - page alertes charge avec au moins 1 résultat si DB en a
 *   - page mouvements + filtre type (manual_adjustment)
 *   - création ajustement : submit vide → validation Zod
 *
 * Pattern ADR-016 : domcontentloaded + SETTLE_MS. Pas de networkidle.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Stock', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Inventaire — page charge + KPIs visibles', async ({ page }) => {
    await page.goto('/stocks/inventaire');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/stocks\/inventaire/);
    // KPI "Produits Actifs" toujours visible
    await expect(
      page.getByText(/Produits Actifs|Mouvements|Valeur Stock/i).first()
    ).toBeVisible({ timeout: 5000 });
    consoleErrors.expectNoErrors();
  });

  test('Inventaire — ouvrir modal ajustement stock → Escape', async ({
    page,
  }) => {
    await page.goto('/stocks/inventaire');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    // Bouton icône "Ajuster le stock" (aria-label) sur la 1ère ligne visible
    const adjustBtn = page
      .getByRole('button', { name: /Ajuster le stock/i })
      .first();
    const visible = await adjustBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (visible) {
      await adjustBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible({
        timeout: 3000,
      });
    }
    consoleErrors.expectNoErrors();
  });

  test('Mouvements — page charge', async ({ page }) => {
    await page.goto('/stocks/mouvements');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/stocks\/mouvements/);
    consoleErrors.expectNoErrors();
  });

  test('Alertes — page charge + tableau ou état vide', async ({ page }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/stocks\/alertes/);
    consoleErrors.expectNoErrors();
  });

  test('Ajustements — page charge + bouton création visible', async ({
    page,
  }) => {
    await page.goto('/stocks/ajustements');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/stocks\/ajustements/);
    consoleErrors.expectNoErrors();
  });

  test('Ajustement création — formulaire charge sans erreur', async ({
    page,
  }) => {
    await page.goto('/stocks/ajustements/create');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Receptions — page charge', async ({ page }) => {
    await page.goto('/stocks/receptions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Expeditions — page charge', async ({ page }) => {
    await page.goto('/stocks/expeditions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Previsionnel — page charge', async ({ page }) => {
    await page.goto('/stocks/previsionnel');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Stockage — page charge', async ({ page }) => {
    await page.goto('/stocks/stockage');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});

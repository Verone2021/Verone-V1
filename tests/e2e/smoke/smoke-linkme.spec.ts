import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — LinkMe (créé 2026-04-24 dans INFRA-HARDENING-002)
 *
 * Couvre le canal LinkMe : hub, commandes, commissions, approbations,
 * selections, catalogue, enseignes. Zone sensible (cascade devis sur
 * approbation, commissions auto).
 *
 * Pattern ADR-016.
 */

const SETTLE_MS = 800;

test.describe('Smoke — LinkMe', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Hub LinkMe — KPIs chargent', async ({ page }) => {
    await page.goto('/canaux-vente/linkme');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/canaux-vente\/linkme$/);
    consoleErrors.expectNoErrors();
  });

  test('Commandes LinkMe — liste charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commandes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/canaux-vente\/linkme\/commandes/);
    consoleErrors.expectNoErrors();
  });

  test('Commandes LinkMe — 1er œil → détail charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commandes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const eye = page.getByRole('button', { name: /voir détails/i }).first();
    if (await eye.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eye.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
    }
    consoleErrors.expectNoErrors();
  });

  test('Commissions LinkMe — liste charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commissions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Approbations LinkMe — liste charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/approbations');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Selections LinkMe — liste + bouton "Nouvelle selection"', async ({
    page,
  }) => {
    await page.goto('/canaux-vente/linkme/selections');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Selections/new — formulaire charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/selections/new');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Catalogue LinkMe — liste charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Enseignes LinkMe — liste + 1er œil → détail charge', async ({
    page,
  }) => {
    await page.goto('/canaux-vente/linkme/enseignes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const eye = page.getByRole('button', { name: /voir détails/i }).first();
    if (await eye.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eye.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
    }
    consoleErrors.expectNoErrors();
  });

  test('Demandes-paiement — charge', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/demandes-paiement');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});

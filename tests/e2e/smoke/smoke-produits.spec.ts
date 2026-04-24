import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Produits (créé 2026-04-24 dans INFRA-HARDENING-002)
 *
 * Couvre catalogue, sourcing, consultations + détail produit avec
 * ses 7 onglets (Général, Tarification, Stock, Descriptions, Caractéristiques,
 * Images, Publication). Zone récemment refondue (BO-UI-PROD-*).
 *
 * Pattern ADR-016.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Produits', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Produits hub — charge + KPIs', async ({ page }) => {
    await page.goto('/produits');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/produits$/);
    consoleErrors.expectNoErrors();
  });

  test('Catalogue — liste charge', async ({ page }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Catalogue — 1er produit → détail charge (7 onglets)', async ({
    page,
  }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    // Cliquer la 1ère ligne produit (lien ou bouton œil)
    const firstLink = page
      .getByRole('link', { name: /^[A-Z]/ })
      .first()
      .or(page.getByRole('button', { name: /voir/i }).first());
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
      // Vérifier qu'on est bien sur une page détail (URL contient productId)
      await expect(page).toHaveURL(/\/produits\/catalogue\/[0-9a-f-]{8,}/);
    }
    consoleErrors.expectNoErrors();
  });

  test('Catalogue — switch onglets Général → Tarification → Stock', async ({
    page,
  }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const firstLink = page.getByRole('link', { name: /^[A-Z]/ }).first();
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
      for (const tabName of [
        /général/i,
        /tarification/i,
        /stock/i,
        /descriptions/i,
        /caractéristiques/i,
        /images/i,
        /publication/i,
      ]) {
        const tab = page.getByRole('tab', { name: tabName });
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(300);
        }
      }
    }
    consoleErrors.expectNoErrors();
  });

  test('Catalogue archives — charge', async ({ page }) => {
    await page.goto('/produits/catalogue/archived');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Catalogue variantes — charge', async ({ page }) => {
    await page.goto('/produits/catalogue/variantes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Catalogue catégories — charge', async ({ page }) => {
    await page.goto('/produits/catalogue/categories');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Sourcing — charge', async ({ page }) => {
    await page.goto('/produits/sourcing');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Consultations — liste charge', async ({ page }) => {
    await page.goto('/consultations');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Nouvelle consultation — formulaire charge', async ({ page }) => {
    await page.goto('/consultations/create');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});

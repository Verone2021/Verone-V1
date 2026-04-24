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

  test('Catalogue — 1er produit → détail RENDU (pas de 404 SSR)', async ({
    page,
  }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const detailLink = page
      .locator('a[href*="/produits/catalogue/"]')
      .filter({ hasNot: page.locator('a[href$="/produits/catalogue"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/nouveau"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/archived"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/categories"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/collections"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/variantes"]') })
      .first();
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
      // Assertions CONTENU (pas juste URL) — détecte un 404 SSR silencieux
      // où Next.js sert /_not-found mais l'URL reste sur /produits/catalogue/UUID.
      // (Régression prod 2026-04-24 rollback.)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Page introuvable');
      expect(bodyText).not.toMatch(/^404/m);
      // Au moins 1 onglet doit être visible (Général, Tarification, Stock, etc.)
      const anyTab = page.getByRole('tab').first();
      await expect(anyTab).toBeVisible({ timeout: 5000 });
    }
    consoleErrors.expectNoErrors();
  });

  test('Catalogue — switch onglets Général → Tarification → Stock', async ({
    page,
  }) => {
    await page.goto('/produits/catalogue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const detailLink = page
      .locator('a[href*="/produits/catalogue/"]')
      .filter({ hasNot: page.locator('a[href$="/produits/catalogue"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/nouveau"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/archived"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/categories"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/collections"]') })
      .filter({ hasNot: page.locator('a[href*="/catalogue/variantes"]') })
      .first();
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click();
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

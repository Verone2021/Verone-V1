import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Commandes (créé 2026-04-24 dans INFRA-HARDENING-002)
 *
 * Couvre commandes clients/fournisseurs + dashboard KPIs + modals
 * création. Cible les régressions BO-FIN-040/041 et BO-FIN-UX-001/002.
 *
 * Pattern ADR-016.
 */

const SETTLE_MS = 800;

test.describe('Smoke — Commandes', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('Commandes clients — page charge + tabs visibles', async ({ page }) => {
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/commandes\/clients/);
    consoleErrors.expectNoErrors();
  });

  test('Commandes clients — switch tab Brouillons → Validées → Annulée', async ({
    page,
  }) => {
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    for (const label of [/brouillon/i, /validée/i, /annulée/i]) {
      const tab = page.getByRole('tab', { name: label });
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(400);
      }
    }
    consoleErrors.expectNoErrors();
  });

  test('Commandes clients — ouvrir modal "Nouvelle commande" → Escape', async ({
    page,
  }) => {
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const btn = page
      .getByRole('button', { name: /nouvelle commande/i })
      .first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    }
    consoleErrors.expectNoErrors();
  });

  test('Commandes clients — 1er détail RENDU (pas de 404 SSR)', async ({
    page,
  }) => {
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const eye = page.getByRole('button', { name: /voir détails/i }).first();
    if (await eye.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eye.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
      await expect(page).toHaveURL(/\/commandes\/clients\/[0-9a-f-]{10,}/);
      // Assertions contenu (détecte 404 SSR silencieux, cf. régression
      // produit détail prod 2026-04-24).
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Page introuvable');
      expect(bodyText).not.toMatch(/^404/m);
    }
    consoleErrors.expectNoErrors();
  });

  test('Commandes fournisseurs — page charge + tabs', async ({ page }) => {
    await page.goto('/commandes/fournisseurs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/commandes\/fournisseurs/);
    consoleErrors.expectNoErrors();
  });

  test('Commandes fournisseurs — ouvrir modal création PO → Escape', async ({
    page,
  }) => {
    await page.goto('/commandes/fournisseurs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    const btn = page
      .getByRole('button', { name: /nouvelle commande|nouveau|créer/i })
      .first();
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click();
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
      }
    }
    consoleErrors.expectNoErrors();
  });

  test('Dashboard — KPIs chargent sans Maximum update depth', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/dashboard/);
    consoleErrors.expectNoErrors();
  });

  test('Achats hub — charge', async ({ page }) => {
    await page.goto('/achats');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Ventes dashboard — charge', async ({ page }) => {
    await page.goto('/ventes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});

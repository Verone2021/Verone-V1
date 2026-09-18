import type { Page } from '@playwright/test';

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

/**
 * Ouvre la premiere fiche produit du catalogue et renvoie son URL.
 *
 * Volontairement STRICT : si aucune fiche ne peut etre ouverte, le test echoue.
 * L'ancienne version enveloppait tout dans `if (await lien.isVisible())` et
 * passait au vert quand le lien etait introuvable. Or la liste rend des BOUTONS
 * « Voir detail », pas des `<a href>` : le bloc etait donc saute a chaque
 * execution, et la panne du 15 septembre 2026 (fiche produit en 404 sur les
 * 218 produits, depuis tous les ecrans) est passee sans lever un seul signal.
 */
async function openFirstProductSheet(page: Page): Promise<string> {
  await page.goto('/produits/catalogue');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(SETTLE_MS);

  const entry = page
    .getByRole('button', { name: /voir détail/i })
    .or(
      page
        .locator('a[href*="/produits/catalogue/"]')
        .filter({ hasNot: page.locator('a[href$="/produits/catalogue"]') })
        .filter({ hasNot: page.locator('a[href*="/catalogue/nouveau"]') })
        .filter({ hasNot: page.locator('a[href*="/catalogue/archived"]') })
        .filter({ hasNot: page.locator('a[href*="/catalogue/categories"]') })
        .filter({ hasNot: page.locator('a[href*="/catalogue/collections"]') })
        .filter({ hasNot: page.locator('a[href*="/catalogue/variantes"]') })
    )
    .first();

  await expect(
    entry,
    'Aucun acces a une fiche produit depuis le catalogue'
  ).toBeVisible({ timeout: 10_000 });

  await entry.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(SETTLE_MS);

  // Un 404 rendu cote serveur laisse l'URL inchangee : c'est le CONTENU qui
  // tranche. (Regressions prod 2026-04-24, 2026-05-09 et 2026-09-15.)
  const bodyText = await page.locator('body').innerText();
  expect(bodyText, 'Fiche produit servie en 404').not.toContain(
    'Page introuvable'
  );
  expect(bodyText).not.toMatch(/^404/m);

  return page.url();
}

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

  test('Catalogue — 1er produit → fiche RENDUE (pas de 404 cote serveur)', async ({
    page,
  }) => {
    const sheetUrl = await openFirstProductSheet(page);

    // Au moins un onglet doit etre la (General, Tarification, Stock, ...)
    await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 5000 });

    // Et la route REELLEMENT servie doit etre la fiche produit. Sans ce
    // controle, Next peut servir /_not-found en gardant l'URL du produit :
    // c'est exactement ce qui a masque la panne pendant trois jours.
    const response = await page.request.get(sheetUrl);
    expect(response.status(), `${sheetUrl} ne repond pas 200`).toBe(200);
    expect(
      response.headers()['x-matched-path'] ?? '',
      `${sheetUrl} est servie par une autre route`
    ).not.toContain('_not-found');

    consoleErrors.expectNoErrors();
  });

  test('Catalogue — switch onglets Général → Tarification → Stock', async ({
    page,
  }) => {
    await openFirstProductSheet(page);

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

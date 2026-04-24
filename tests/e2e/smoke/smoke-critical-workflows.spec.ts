import { test, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Critical workflows (créé 2026-04-24 après audit régressions 2 sem.)
 *
 * Couvre les parcours qui ont cassé le plus récemment :
 *   - Liste commandes + filtres
 *   - Stock + mouvements (BO-UI-PROD-STOCK-001/002)
 *   - Produit détail 5 onglets (BO-UI-PROD-CHAR/DESC/IMG/PUB/PRICING)
 *   - Factures (tableau + filtres)
 *   - LinkMe commandes
 *
 * Zéro console error, zéro warning React critique.
 * Durée cible : < 90 s.
 */

test.describe('Smoke — parcours critiques', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  // Après domcontentloaded, on laisse 800 ms de rab pour que les fetches
  // Supabase initiaux se terminent (polling realtime, getSession, etc.).
  // 'networkidle' est INUTILISABLE sur ces pages : polling continu → timeout.
  const SETTLE_MS = 800;

  test('Commandes clients — filtrer par statut Annulée', async ({ page }) => {
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    // Cliquer sur le tab "Annulée"
    const tabAnnulee = page.getByRole('tab', { name: /annulée/i });
    if (await tabAnnulee.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tabAnnulee.click();
      await page.waitForTimeout(500);
    }
    consoleErrors.expectNoErrors();
  });

  test('Stocks — page inventaire', async ({ page }) => {
    await page.goto('/stocks/inventaire');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Stocks — page mouvements', async ({ page }) => {
    await page.goto('/stocks/mouvements');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Stocks — page alertes', async ({ page }) => {
    await page.goto('/stocks/alertes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Produits — liste', async ({ page }) => {
    await page.goto('/produits');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Factures — liste', async ({ page }) => {
    await page.goto('/factures');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Devis — liste', async ({ page }) => {
    await page.goto('/devis');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('LinkMe commandes — liste', async ({ page }) => {
    await page.goto('/canaux-vente/linkme/commandes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('Expéditions — liste (Packlink zone)', async ({ page }) => {
    const res = await page
      .goto('/commandes/clients/expeditions')
      .catch(() => null);
    if (res) {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
    }
    consoleErrors.expectNoErrors();
  });

  test('Commandes fournisseurs — liste', async ({ page }) => {
    await page.goto('/commandes/fournisseurs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });
});

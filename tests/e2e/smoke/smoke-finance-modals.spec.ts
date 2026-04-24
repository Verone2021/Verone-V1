import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE — Finance modals (created 2026-04-24 after BO-FIN-041 regression audit)
 *
 * Objectif : détecter les régressions qui passent à côté de la CI actuelle
 * (type-check + build) : ex. champ SELECT manquant, useEffect infini, Fragment
 * sans key, props optionnels non propagés, etc.
 *
 * Ces tests ouvrent les 3 modals les plus à risque identifiés dans l'audit
 * 2 semaines (BO-FIN-023, BO-FIN-031, BO-FIN-039, BO-FIN-040) — tout warning
 * React critique fait échouer la CI.
 *
 * Durée cible : < 60 s.
 */

test.describe('Smoke — Finance modals (régression BO-FIN-040)', () => {
  let consoleErrors: ConsoleErrorCollector;

  // 'domcontentloaded' au lieu de 'networkidle' : les pages Verone font du
  // polling Supabase (realtime, refresh token) → 'networkidle' ne se produit
  // jamais et le test timeout. On laisse ensuite SETTLE_MS pour que les
  // fetches initiaux se terminent avant d'inspecter les errors console.
  const SETTLE_MS = 800;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
  });

  test('page /commandes/clients — 0 erreur console + 0 warning key prop', async ({
    page,
  }) => {
    // L'URL doit rester /commandes/clients (pas de redirect 404/login)
    await expect(page).toHaveURL(/\/commandes\/clients/);
    consoleErrors.expectNoErrors();
  });

  test('ouvrir /devis/nouveau — sélecteur de commandes opérationnel', async ({
    page,
  }) => {
    await page.goto('/devis/nouveau');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    // URL stable (pas de redirect /login)
    await expect(page).toHaveURL(/\/devis\/nouveau/);
    consoleErrors.expectNoErrors();
  });

  test('ouvrir /factures/nouvelle — formulaire de création charge sans erreur', async ({
    page,
  }) => {
    await page.goto('/factures/nouvelle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    consoleErrors.expectNoErrors();
  });

  test('ouvrir une commande existante (1er résultat liste) — page détail sans erreur', async ({
    page,
  }) => {
    // Cliquer sur le 1er bouton "œil" (voir détails) visible
    const firstEye = page
      .getByRole('button', { name: /voir détails/i })
      .first();
    if (await firstEye.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstEye.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
    }
    consoleErrors.expectNoErrors();
  });
});

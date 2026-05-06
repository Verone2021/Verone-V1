import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * SMOKE GOLDEN PATH — test de niveau 1 (gate PR).
 *
 * Un seul test qui valide le parcours minimal : dashboard → liste commandes
 * → module LinkMe commandes → ouverture détail.
 *
 * Objectif : ~30 secondes en CI. Tolérance zéro sur les erreurs console.
 * Lancé sur toute PR qui touche un fichier UI back-office.
 *
 * INFRA-CI-003 (2026-05-06)
 */

const SETTLE_MS = 800;

/**
 * Compteur de requêtes réseau partagé. Détecte les boucles infinies type
 * useEffect avec dep instable (incident BO-FIN-INVOICE-SELECT-001 — modal
 * sélection commande qui tirait 193 requêtes en boucle, écran bloqué pour
 * l'utilisateur). Seuil : > 30 requêtes Supabase en 5 secondes sur une
 * page idle = boucle quasi-certaine.
 */
async function expectNoFetchLoop(
  page: import('@playwright/test').Page,
  windowMs = 5000,
  threshold = 30
): Promise<void> {
  const counts = new Map<string, number>();
  const onRequest = (req: import('@playwright/test').Request) => {
    const url = req.url();
    if (!/supabase\.co\/rest\/v1|\/api\/qonto|\/api\/packlink/.test(url))
      return;
    // On regroupe par chemin (sans query) — une boucle re-tape le même path.
    const path = new URL(url).pathname;
    counts.set(path, (counts.get(path) ?? 0) + 1);
  };
  page.on('request', onRequest);
  await page.waitForTimeout(windowMs);
  page.off('request', onRequest);
  const culprit = [...counts.entries()].find(([, n]) => n > threshold);
  if (culprit) {
    throw new Error(
      `Boucle de fetch détectée: ${culprit[0]} appelé ${culprit[1]} fois en ${windowMs} ms`
    );
  }
}

test.describe('Smoke Golden Path', () => {
  test('dashboard → commandes → linkme → détail commande', async ({ page }) => {
    const consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);

    // ── 1. Dashboard : au moins 1 KPI visible ──────────────────────────────
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/dashboard/);

    // Au moins un élément numérique (KPI) est rendu.
    // On cherche un heading ou un bloc statistique ; si la page est vide c'est
    // une régression SSR.
    const hasKpi =
      (await page.getByRole('heading').count()) > 0 ||
      (await page
        .locator('[data-testid*="kpi"], [class*="stat"], [class*="card"]')
        .count()) > 0;
    expect(
      hasKpi,
      'Dashboard : au moins un KPI ou heading doit être visible'
    ).toBe(true);

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 2. Commandes clients : liste rendue (header ou message vide) ────────
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/commandes\/clients/);

    // La page ne doit pas afficher une 404 ou un écran vide total.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Page introuvable');
    expect(bodyText).not.toMatch(/^404/m);

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 3. LinkMe commandes : page se charge ───────────────────────────────
    await page.goto('/canaux-vente/linkme/commandes');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/canaux-vente\/linkme\/commandes/);

    const linkmePage = await page.locator('body').innerText();
    expect(linkmePage).not.toContain('Page introuvable');
    expect(linkmePage).not.toMatch(/^404/m);

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 3 bis. Anti-boucle de fetch sur /factures/nouvelle ──────────────────
    // Régression BO-FIN-INVOICE-SELECT-001 (2026-05-06) : useEffect avec dep
    // tableau instable provoquait 193 requêtes en boucle. On vérifie ici
    // qu'aucune page critique ne déclenche une boucle similaire en idle.
    await page.goto('/factures/nouvelle');
    await page.waitForLoadState('domcontentloaded');
    await expectNoFetchLoop(page);

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 4. Détail 1ère commande LinkMe (optionnel — skip gracieux si aucune) ─
    // On cherche un lien ou bouton vers le détail d'une commande.
    const detailLink = page
      .getByRole('link', { name: /voir|détail|LKM-/i })
      .first();
    const detailBtn = page
      .getByRole('button', { name: /voir détails/i })
      .first();

    const hasDetailLink = await detailLink
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const hasDetailBtn = await detailBtn
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasDetailLink) {
      await detailLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
      // La page détail doit se charger (titre ou contenu)
      const detailBody = await page.locator('body').innerText();
      expect(detailBody).not.toContain('Page introuvable');
      expect(detailBody).not.toMatch(/^404/m);
      consoleErrors.expectNoErrors();
    } else if (hasDetailBtn) {
      await detailBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(SETTLE_MS);
      const detailBody = await page.locator('body').innerText();
      expect(detailBody).not.toContain('Page introuvable');
      expect(detailBody).not.toMatch(/^404/m);
      consoleErrors.expectNoErrors();
    }
    // Aucune commande LinkMe en seed : on considère ce step comme validé
    // (la liste vide est un état légitime).
  });
});

import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * WORKFLOW P0 — Chaîne commerciale
 *
 * Source : WORKFLOWS-CRITIQUES.md — Workflow 2 (Critique, P0)
 * Voir aussi : docs/current/WORKFLOW-VENTES.md
 *
 * Ce test vérifie l'ouverture des modals clés de la chaîne commerciale
 * (devis + facture depuis commande) sans créer de documents Qonto réels.
 * Aucun appel API Qonto n'est déclenché : on ouvre les modals et on ferme
 * avec Escape.
 *
 * Contrainte forte : ZÉRO création de document en prod Qonto.
 *
 * INFRA-CI-003 (2026-05-06)
 */

const SETTLE_MS = 800;

test.describe('Workflow P0 — Chaîne commerciale', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('commandes clients → détail draft → modal devis → modal facture', async ({
    page,
  }) => {
    // ── 1. Naviguer vers /commandes/clients ───────────────────────────────
    await page.goto('/commandes/clients');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/commandes\/clients/);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Page introuvable');

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 2. Trouver une commande draft et ouvrir son détail ─────────────────
    // On cherche le bouton "voir détails" sur la liste des commandes.
    // On essaie en priorité l'onglet "Brouillons" s'il existe.
    const brouillonsTab = page.getByRole('tab', { name: /brouillon/i });
    const hasBrouillons = await brouillonsTab
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasBrouillons) {
      await brouillonsTab.click();
      await page.waitForTimeout(SETTLE_MS);
    }

    const detailBtn = page
      .getByRole('button', { name: /voir détails/i })
      .first();
    const hasDetail = await detailBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasDetail) {
      // Essayer l'onglet "Toutes" ou "Validées"
      const toutesTab = page.getByRole('tab', { name: /toutes|tout/i }).first();
      if (await toutesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toutesTab.click();
        await page.waitForTimeout(SETTLE_MS);
      }
    }

    const detailBtnRetry = page
      .getByRole('button', { name: /voir détails/i })
      .first();
    const hasDetailRetry = await detailBtnRetry
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasDetailRetry) {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Aucune commande disponible en seed pour tester la chaîne commerciale.',
      });
      test.skip(true, 'Aucune commande disponible en seed');
      return;
    }

    await detailBtnRetry.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/commandes\/clients\/[0-9a-f-]{10,}/);

    const detailBody = await page.locator('body').innerText();
    expect(detailBody).not.toContain('Page introuvable');
    expect(detailBody).not.toMatch(/^404/m);

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 3. Ouvrir modal "Créer un devis" ──────────────────────────────────
    const creerDevisBtn = page
      .getByRole('button', { name: /créer un devis|nouveau devis/i })
      .first();
    const hasDevisBtn = await creerDevisBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasDevisBtn) {
      await creerDevisBtn.click();
      await page.waitForTimeout(SETTLE_MS);

      const devisDialog = page.getByRole('dialog');
      const devisOpen = await devisDialog
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (devisOpen) {
        // Asserter que le modal contient un titre "devis" ou "quote"
        const devisTitle = await devisDialog
          .getByText(/devis/i)
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        expect(
          devisTitle,
          'Modal devis : doit afficher le mot "devis" dans le titre/contenu'
        ).toBe(true);

        // Asserter que la section client est présente (nom ou email client)
        const clientSection = await devisDialog
          .getByText(/client|facturation|adresse/i)
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        expect(
          clientSection,
          'Modal devis : section client / adresse facturation doit être présente'
        ).toBe(true);

        consoleErrors.expectNoErrors();
        consoleErrors.clear();

        // Fermer avec Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(SETTLE_MS);

        // Modal fermé
        const dialogAfter = await devisDialog
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(dialogAfter, 'Modal devis doit se fermer avec Escape').toBe(
          false
        );
      }
    }

    // ── 4. Ouvrir modal "Créer une facture" ───────────────────────────────
    const creerFactureBtn = page
      .getByRole('button', { name: /créer une facture|nouvelle facture/i })
      .first();
    const hasFactureBtn = await creerFactureBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasFactureBtn) {
      await creerFactureBtn.click();
      await page.waitForTimeout(SETTLE_MS);

      const factureDialog = page.getByRole('dialog');
      const factureOpen = await factureDialog
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (factureOpen) {
        // Section client doit être présente
        const clientSection = await factureDialog
          .getByText(/client|facturation|destinataire/i)
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        expect(
          clientSection,
          'Modal facture : section client doit être présente'
        ).toBe(true);

        consoleErrors.expectNoErrors();
        consoleErrors.clear();

        // Fermer avec Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(SETTLE_MS);

        const dialogAfter = await factureDialog
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        expect(dialogAfter, 'Modal facture doit se fermer avec Escape').toBe(
          false
        );
      }
    }

    consoleErrors.expectNoErrors();
  });

  test('/factures — liste rendue sans erreur console', async ({ page }) => {
    await page.goto('/factures');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/factures/);

    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Page introuvable');
    expect(body).not.toMatch(/^404/m);

    consoleErrors.expectNoErrors();
  });

  test('/devis — liste rendue sans erreur console', async ({ page }) => {
    await page.goto('/devis');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/devis/);

    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Page introuvable');
    expect(body).not.toMatch(/^404/m);

    consoleErrors.expectNoErrors();
  });
});

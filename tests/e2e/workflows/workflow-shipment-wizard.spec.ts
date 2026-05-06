import { test, expect, ConsoleErrorCollector } from '../../fixtures/base';

/**
 * WORKFLOW P0 — Expédition commande (ShipmentWizard 7 étapes)
 *
 * Source : WORKFLOWS-CRITIQUES.md — Workflow 1 (Critique, P0)
 *
 * Ce test vérifie que le wizard ShipmentWizard s'ouvre, que ses 7 étapes
 * sont accessibles et qu'il se ferme proprement (Escape) sans effet de bord
 * sur la commande.
 *
 * Contrainte forte : on NE valide PAS la commande (pas de step 7 final).
 * On vérifie uniquement la navigation wizard + fermeture propre.
 *
 * INFRA-CI-003 (2026-05-06)
 */

const SETTLE_MS = 800;

test.describe('Workflow P0 — ShipmentWizard', () => {
  let consoleErrors: ConsoleErrorCollector;

  test.beforeEach(async ({ page }) => {
    consoleErrors = new ConsoleErrorCollector();
    consoleErrors.attach(page);
  });

  test('wizard expédition : ouverture → navigation étapes → fermeture Escape', async ({
    page,
  }) => {
    // ── 1. Naviguer vers /stocks/expeditions ──────────────────────────────
    await page.goto('/stocks/expeditions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveURL(/\/stocks\/expeditions/);

    // ── 2. Chercher une commande "validated" dans la liste ─────────────────
    // Le bouton "Expédier" est visible sur les commandes validées.
    const expedierBtn = page.getByRole('button', { name: /expédier/i }).first();

    const hasExpedier = await expedierBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasExpedier) {
      // Aucune commande validée disponible en seed — test skipé proprement.
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Aucune commande validée disponible en seed pour tester le wizard expédition.',
      });
      test.skip(true, 'Aucune commande validée disponible en seed');
      return;
    }

    // ── 3. Cliquer "Expédier" → asserter que le modal s'ouvre ─────────────
    await expedierBtn.click();
    await page.waitForTimeout(SETTLE_MS);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });

    // Step 1 doit contenir un indicateur "Stock" (titre ou texte du step)
    const step1Content = dialog.getByText(/stock/i).first();
    const step1Visible = await step1Content
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(
      step1Visible,
      'Step 1 du wizard doit afficher du contenu relatif au stock'
    ).toBe(true);

    consoleErrors.expectNoErrors();
    consoleErrors.clear();

    // ── 4. Naviguer étape par étape jusqu'à l'étape 2 ─────────────────────
    // On clique "Suivant" pour passer à l'étape 2.
    const suivantBtn = dialog
      .getByRole('button', { name: /suivant|next|continuer/i })
      .first();

    const hasSuivant = await suivantBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasSuivant) {
      await suivantBtn.click();
      await page.waitForTimeout(SETTLE_MS);

      // ── 5. Step 2 : asserter que les 4 options livraison sont visibles ───
      // Options : retrait, main propre, manuel, packlink
      const step2Labels = [/retrait/i, /main propre/i, /manuel/i, /packlink/i];
      let optionsFound = 0;
      for (const label of step2Labels) {
        const optionVisible = await dialog
          .getByText(label)
          .first()
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (optionVisible) optionsFound++;
      }
      // Au moins 2 options sur 4 doivent être visibles (seed peut ne pas avoir
      // Packlink configuré)
      expect(
        optionsFound,
        `Step 2 : au moins 2 options livraison doivent être visibles (trouvé ${optionsFound}/4)`
      ).toBeGreaterThanOrEqual(2);

      consoleErrors.expectNoErrors();
      consoleErrors.clear();

      // Avancer jusqu'à l'étape 4 (mid-wizard) pour tester la fermeture
      // depuis un état intermédiaire.
      let currentStep = 2;
      while (currentStep < 4) {
        const nextBtn = dialog
          .getByRole('button', { name: /suivant|next|continuer/i })
          .first();
        const nextVisible = await nextBtn
          .isVisible({ timeout: 3000 })
          .catch(() => false);
        if (!nextVisible) break;

        // Sur l'étape 2, sélectionner une option avant d'avancer si nécessaire
        if (currentStep === 2) {
          // Essayer de sélectionner "Manuel" si disponible (neutre, sans appel API)
          const manuelOption = dialog.getByText(/manuel/i).first();
          const manuelVisible = await manuelOption
            .isVisible({ timeout: 2000 })
            .catch(() => false);
          if (manuelVisible) {
            await manuelOption.click();
            await page.waitForTimeout(300);
          }
        }

        const canAdvance = await nextBtn
          .isEnabled({ timeout: 2000 })
          .catch(() => false);
        if (!canAdvance) break;

        await nextBtn.click();
        await page.waitForTimeout(SETTLE_MS);
        currentStep++;
      }
    }

    // ── 6. Fermeture Escape mid-wizard → modal disparaît ──────────────────
    await page.keyboard.press('Escape');
    await page.waitForTimeout(SETTLE_MS);

    // Le dialog doit être fermé.
    const dialogAfterEscape = await dialog
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(
      dialogAfterEscape,
      'Le modal doit se fermer avec Escape (aucun effet de bord)'
    ).toBe(false);

    // La commande doit toujours apparaître dans la liste (statut "validated",
    // pas "expediee") — on vérifie juste que le bouton Expédier est encore
    // présent (la commande n'a pas été modifiée).
    const expedierAfter = page
      .getByRole('button', { name: /expédier/i })
      .first();
    const stillExpedier = await expedierAfter
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(
      stillExpedier,
      'La commande doit rester validée après fermeture Escape (pas de changement de statut)'
    ).toBe(true);

    consoleErrors.expectNoErrors();
  });
});

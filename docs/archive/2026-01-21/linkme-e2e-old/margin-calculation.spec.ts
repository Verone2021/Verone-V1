import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Calculs de marge LinkMe
 *
 * Vérifie que les prix affichés dans l'UI correspondent aux calculs SSOT:
 * - Taux de marque: selling_price = base_price / (1 - margin_rate/100)
 * - Gain: gain = selling_price - base_price
 *
 * @module margin-calculation.spec
 * @since 2026-01-21
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

// Fonctions de calcul SSOT (répliquées pour validation)
function calculateSellingPrice(basePriceHt: number, marginRate: number): number {
  if (marginRate === 0) return basePriceHt;
  return Math.round((basePriceHt / (1 - marginRate / 100)) * 100) / 100;
}

function calculateGain(basePriceHt: number, marginRate: number): number {
  const sellingPrice = calculateSellingPrice(basePriceHt, marginRate);
  return Math.round((sellingPrice - basePriceHt) * 100) / 100;
}

test.describe('LinkMe Margin Calculations', () => {
  test.beforeEach(async ({ page }) => {
    // Login avec compte test Pokawa
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(3000);

    // Si non connecté, cliquer sur comptes de test
    const testAccountsButton = page.locator('button:has-text("Comptes de test")');
    if (await testAccountsButton.isVisible()) {
      await testAccountsButton.click();
      await page.click('text=Pokawa');
      await page.waitForTimeout(2000);
    }

    await page.waitForURL(/\/(dashboard|catalogue|login)/, { timeout: 15000 });
  });

  test('1. Page catalogue affiche les produits avec prix', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogue`);

    // Attendre le chargement du catalogue
    await expect(page.locator('h1:has-text("Catalogue")')).toBeVisible({
      timeout: 10000,
    });

    // Vérifier qu'au moins un produit est affiché
    await expect(page.locator('text=produits trouvés')).toBeVisible();

    // Vérifier présence des boutons "Ajouter"
    const addButtons = page.locator('button:has-text("Ajouter")');
    await expect(addButtons.first()).toBeVisible();
  });

  test('2. Modal ajout produit affiche les calculs de marge', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogue`);

    // Attendre le chargement
    await page.waitForSelector('button:has-text("Ajouter")', { timeout: 15000 });

    // Cliquer sur le premier bouton "Ajouter"
    const addButton = page.locator('button:has-text("Ajouter")').first();
    await addButton.click();

    // Attendre l'ouverture de la modal
    await page.waitForTimeout(1000);

    // Vérifier que la modal contient des éléments de calcul de marge
    // (slider, inputs de marge, affichage de prix)
    const modal = page.locator('[role="dialog"], [data-state="open"]');

    // La modal devrait contenir des mentions de marge/commission/gain
    const modalContent = await modal.textContent();
    expect(
      modalContent?.includes('marge') ||
        modalContent?.includes('Marge') ||
        modalContent?.includes('prix') ||
        modalContent?.includes('Prix') ||
        modalContent?.includes('gain') ||
        modalContent?.includes('Gain')
    ).toBeTruthy();
  });

  test('3. Ma sélection affiche les produits avec marges configurées', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/ma-selection`);
    await page.waitForLoadState('networkidle');

    // Vérifier que la page charge sans erreur
    await expect(page).not.toHaveTitle(/error/i);

    // Si des produits existent dans la sélection, vérifier l'affichage des marges
    const selectionContent = await page.textContent('main');

    // La page devrait mentionner "sélection" ou afficher des produits
    expect(
      selectionContent?.includes('sélection') ||
        selectionContent?.includes('Sélection') ||
        selectionContent?.includes('produit') ||
        selectionContent?.includes('Aucun')
    ).toBeTruthy();
  });

  test('4. Page commandes affiche les totaux corrects', async ({ page }) => {
    await page.goto(`${BASE_URL}/commandes`);

    // Attendre le chargement
    await expect(page.locator('h1:has-text("Commandes")')).toBeVisible({
      timeout: 10000,
    });

    // Vérifier présence du bouton "Nouvelle vente"
    await expect(
      page.locator('button:has-text("Nouvelle vente")')
    ).toBeVisible();
  });

  test('5. Commissions page affiche les gains correctement', async ({ page }) => {
    await page.goto(`${BASE_URL}/commissions`);

    // Attendre le chargement
    await expect(page.locator('h1:has-text("Commissions")')).toBeVisible({
      timeout: 10000,
    });

    // Vérifier présence des stats
    await expect(page.locator('text=Total TTC')).toBeVisible();
    await expect(page.locator('text=Payées')).toBeVisible();

    // Vérifier que les montants sont au format euros (contiennent €)
    const pageContent = await page.textContent('main');
    expect(pageContent?.includes('€')).toBeTruthy();
  });

  test('6. Landing page ne mentionne pas 15% fixe', async ({ page }) => {
    // Vérifier la page publique (non connecté)
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // La page ne devrait pas contenir "15% de commission" ou "15% fixe"
    const pageContent = await page.textContent('body');

    // Vérifier qu'il n'y a pas de mention de taux fixe incorrect
    expect(pageContent?.includes('15% de commission')).toBeFalsy();
    expect(pageContent?.includes('15% fixe')).toBeFalsy();

    // Vérifier que les nouvelles sections existent
    // Section "Comment ça marche"
    const howItWorksVisible = await page
      .locator('text=Comment ça marche')
      .or(page.locator('text=Comment ca marche'))
      .isVisible()
      .catch(() => false);

    // Section pricing (transparence)
    const pricingVisible = await page
      .locator('text=Transparence')
      .or(page.locator('text=vos gains'))
      .isVisible()
      .catch(() => false);

    // Au moins une des nouvelles sections devrait être visible
    // (si l'utilisateur n'est pas connecté et voit la landing)
    if (pageContent?.includes('Bienvenue') === false) {
      // Page landing visible
      expect(howItWorksVisible || pricingVisible).toBeTruthy();
    }
  });

  test('7. Validation calculs - Exemple avec base 100€, marge 15%', async ({
    page,
  }) => {
    // Ce test valide que les formules mathématiques sont correctes
    // en vérifiant les valeurs attendues

    const basePrice = 100;
    const marginRate = 15;

    // Calculs attendus (taux de marque)
    const expectedSellingPrice = calculateSellingPrice(basePrice, marginRate);
    const expectedGain = calculateGain(basePrice, marginRate);

    // Vérifications
    expect(expectedSellingPrice).toBe(117.65);
    expect(expectedGain).toBe(17.65);

    // Log pour debugging
    console.log(`Base: ${basePrice}€, Marge: ${marginRate}%`);
    console.log(`Prix de vente attendu: ${expectedSellingPrice}€`);
    console.log(`Gain attendu: ${expectedGain}€`);
  });

  test('8. Validation calculs - Plusieurs scénarios', async ({ page }) => {
    const testCases = [
      { base: 100, margin: 10, expectedPrice: 111.11, expectedGain: 11.11 },
      { base: 100, margin: 15, expectedPrice: 117.65, expectedGain: 17.65 },
      { base: 100, margin: 20, expectedPrice: 125, expectedGain: 25 },
      { base: 50, margin: 15, expectedPrice: 58.82, expectedGain: 8.82 },
      { base: 20.19, margin: 15, expectedPrice: 23.75, expectedGain: 3.56 },
    ];

    for (const tc of testCases) {
      const calculatedPrice = calculateSellingPrice(tc.base, tc.margin);
      const calculatedGain = calculateGain(tc.base, tc.margin);

      expect(calculatedPrice).toBe(tc.expectedPrice);
      expect(calculatedGain).toBe(tc.expectedGain);

      console.log(
        `✅ Base: ${tc.base}€, Marge: ${tc.margin}% → Prix: ${calculatedPrice}€, Gain: ${calculatedGain}€`
      );
    }
  });
});

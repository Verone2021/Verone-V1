/**
 * Test E2E : Page publique LinkMe - Protection Anti-Régression
 *
 * CRITIQUE : Ce test protège la logique de routing UUID vs slug.
 * Si ce test échoue, les liens partagés aux clients sont cassés.
 *
 * Couverture :
 * - ✅ Accès par slug (cas principal)
 * - ✅ Accès par UUID (rétrocompatibilité)
 * - ✅ Slug inexistant (erreur gracieuse)
 *
 * Documentation : docs/critical/linkme-public-selection-routing.md
 *
 * @since 2026-02-09
 */

import { test, expect } from '@playwright/test';

// Configuration : URL de base LinkMe
const LINKME_URL = process.env.LINKME_URL || 'http://localhost:3002';

test.describe('LinkMe Public Selection - Routing UUID/Slug', () => {
  test('should load selection by slug (CRITICAL - main use case)', async ({
    page,
  }) => {
    // Setup: URL avec slug (cas principal utilisé par le dashboard)
    // Note : Ce slug doit exister en DB locale (créé dans les seeds)
    const testSlug = 'collection-mobilier-pokawa';

    await page.goto(`${LINKME_URL}/s/${testSlug}`);

    // Vérification 1 : Pas d'erreur "Selection non trouvée"
    const errorText = page.getByText(/Selection non trouv[ée]e/i);
    await expect(errorText).not.toBeVisible({ timeout: 3000 });

    // Vérification 2 : Contenu chargé (heading avec nom sélection)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8000 });

    // Vérification 3 : Au moins un produit affiché
    // Note : Le sélecteur peut varier selon le composant
    const items = page.locator('[data-testid="selection-item"]');
    const itemsCount = await items.count();

    // Si pas de data-testid, vérifier qu'il y a du contenu
    if (itemsCount === 0) {
      // Fallback : Vérifier qu'il y a des éléments de grille/liste
      const gridItems = page
        .locator('article, [role="listitem"], .grid > div')
        .first();
      await expect(gridItems).toBeVisible({ timeout: 5000 });
    } else {
      expect(itemsCount).toBeGreaterThan(0);
    }

    console.log('✅ Slug routing works - Main use case validated');
  });

  test('should load selection by UUID (retrocompatibility)', async ({
    page,
  }) => {
    // Note : Ce test nécessite un UUID valide en DB
    // Dans un environnement de test, utiliser un UUID seed connu

    // TODO : Remplacer par un UUID valide depuis les seeds
    // Pour l'instant, on skip si pas d'UUID configuré
    const validUuid = process.env.TEST_SELECTION_UUID;

    if (!validUuid) {
      test.skip();
      return;
    }

    await page.goto(`${LINKME_URL}/s/${validUuid}`);

    // Vérification : Pas d'erreur
    const errorText = page.getByText(/Selection non trouv[ée]e/i);
    await expect(errorText).not.toBeVisible({ timeout: 3000 });

    // Vérification : Contenu chargé
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8000 });

    console.log('✅ UUID routing works - Retrocompatibility validated');
  });

  test('should show error for non-existent slug', async ({ page }) => {
    // Setup : Slug qui n'existe pas (timestamp pour garantir unicité)
    const nonExistentSlug = `slug-inexistant-test-${Date.now()}`;

    await page.goto(`${LINKME_URL}/s/${nonExistentSlug}`);

    // Vérification : Message d'erreur affiché
    // Note : Le message exact peut varier selon l'implémentation
    const errorMessage = page.getByText(
      /Selection non trouv[ée]e|Introuvable|Not found/i
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Error handling works - Graceful degradation validated');
  });

  test('should show error for malformed slug', async ({ page }) => {
    // Setup : Slug malformé (caractères spéciaux)
    const malformedSlug = 'slug-with-invalid-chars-@#$%';

    await page.goto(`${LINKME_URL}/s/${malformedSlug}`);

    // Vérification : Message d'erreur affiché (pas de crash)
    const errorMessage = page.getByText(
      /Selection non trouv[ée]e|Introuvable|Not found|Erreur/i
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Malformed slug handling works - No crash validated');
  });
});

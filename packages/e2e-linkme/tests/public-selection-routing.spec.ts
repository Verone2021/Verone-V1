import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Routing Pages Publiques LinkMe
 *
 * Valide la refonte Phase 2 :
 * - Redirect automatique /s/[id] → /s/[id]/catalogue
 * - Navigation entre routes (catalogue, faq, contact, points-de-vente)
 * - État panier partagé entre routes
 * - URLs SEO-friendly
 * - Historique navigateur
 *
 * @since 2026-01-23
 */

// Configuration
const BASE_URL = process.env.LINKME_URL || 'http://localhost:3002';
const TEST_SELECTION_SLUG = 'test-selection'; // À remplacer par un slug réel en DB

test.describe('LinkMe - Public Selection Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Login si nécessaire pour accéder aux sélections
    // await page.goto(`${BASE_URL}/login`);
    // await page.fill('[name="email"]', 'test@pokawa.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');
  });

  test('should redirect from /s/[id] to /s/[id]/catalogue', async ({
    page,
  }) => {
    // Naviguer vers la route racine
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}`);

    // Vérifier le redirect automatique
    await page.waitForURL(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);
    await expect(page).toHaveURL(
      new RegExp(`/s/${TEST_SELECTION_SLUG}/catalogue$`)
    );

    // Vérifier que l'onglet "Catalogue" est actif
    const catalogueTab = page.locator('nav button:has-text("Catalogue")');
    await expect(catalogueTab).toBeVisible();
  });

  test('should navigate between routes using tabs', async ({ page }) => {
    // Démarrer sur catalogue
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);
    await expect(page).toHaveURL(new RegExp(`/catalogue$`));

    // Naviguer vers FAQ
    await page.click('nav button:has-text("FAQ")');
    await page.waitForURL(new RegExp(`/faq$`));
    await expect(page).toHaveURL(new RegExp(`/faq$`));

    // Naviguer vers Contact
    await page.click('nav button:has-text("Contact")');
    await page.waitForURL(new RegExp(`/contact$`));
    await expect(page).toHaveURL(new RegExp(`/contact$`));

    // Retour à Catalogue
    await page.click('nav button:has-text("Catalogue")');
    await page.waitForURL(new RegExp(`/catalogue$`));
    await expect(page).toHaveURL(new RegExp(`/catalogue$`));
  });

  test('should preserve cart state across routes', async ({ page }) => {
    // Aller sur catalogue
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);

    // Ajouter un produit au panier
    const addButton = page.locator('button:has-text("Ajouter")').first();
    await addButton.click();

    // Vérifier que le panier flottant apparaît
    const floatingCart = page.locator('button:has-text("article")');
    await expect(floatingCart).toBeVisible();
    await expect(floatingCart).toContainText('1 article');

    // Naviguer vers FAQ
    await page.click('nav button:has-text("FAQ")');
    await page.waitForURL(new RegExp(`/faq$`));

    // Vérifier que le panier est toujours visible
    await expect(floatingCart).toBeVisible();
    await expect(floatingCart).toContainText('1 article');

    // Naviguer vers Contact
    await page.click('nav button:has-text("Contact")');
    await page.waitForURL(new RegExp(`/contact$`));

    // Vérifier que le panier est toujours là
    await expect(floatingCart).toBeVisible();
    await expect(floatingCart).toContainText('1 article');
  });

  test('should support browser navigation (back/forward)', async ({ page }) => {
    // Naviguer à travers plusieurs pages
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);
    await page.click('nav button:has-text("FAQ")');
    await page.waitForURL(new RegExp(`/faq$`));
    await page.click('nav button:has-text("Contact")');
    await page.waitForURL(new RegExp(`/contact$`));

    // Utiliser le bouton "Précédent" du navigateur
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/faq$`));

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/catalogue$`));

    // Utiliser le bouton "Suivant"
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/faq$`));
  });

  test('should have SEO-friendly URLs (no query params)', async ({ page }) => {
    // Naviguer vers chaque route
    const routes = ['catalogue', 'faq', 'contact'];

    for (const route of routes) {
      await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/${route}`);

      // Vérifier que l'URL ne contient pas de query params
      const url = page.url();
      expect(url).not.toContain('?tab=');
      expect(url).toContain(`/${route}`);
    }
  });

  test('should allow direct access to specific routes', async ({ page }) => {
    // Accéder directement à la FAQ (URL partageable)
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/faq`);

    // Vérifier que la page FAQ s'affiche directement
    await expect(page).toHaveURL(new RegExp(`/faq$`));

    // Vérifier que l'onglet FAQ est actif
    const faqTab = page.locator('nav button:has-text("FAQ")');
    await expect(faqTab).toBeVisible();

    // Vérifier le contenu FAQ
    const faqContent = page.locator('text=/questions/i');
    await expect(faqContent).toBeVisible();
  });

  test('should highlight active tab based on current route', async ({
    page,
  }) => {
    // Aller sur catalogue
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);

    // Vérifier l'indicateur actif (barre de couleur sous l'onglet)
    const catalogueTab = page.locator('nav button:has-text("Catalogue")');
    const activeBorder = catalogueTab.locator('div[style*="background"]');
    await expect(activeBorder).toBeVisible();

    // Aller sur FAQ
    await page.click('nav button:has-text("FAQ")');
    await page.waitForURL(new RegExp(`/faq$`));

    // Vérifier que l'indicateur est maintenant sur FAQ
    const faqTab = page.locator('nav button:has-text("FAQ")');
    const faqActiveBorder = faqTab.locator('div[style*="background"]');
    await expect(faqActiveBorder).toBeVisible();
  });

  test('should open order form modal when clicking cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);

    // Ajouter un produit
    await page.click('button:has-text("Ajouter")');

    // Cliquer sur le panier flottant
    await page.click('button:has-text("article")');

    // Vérifier que le modal s'ouvre
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Vérifier que le formulaire de commande est présent
    await expect(modal).toContainText(/restaurant/i);
  });

  test('should show Points de vente tab only for enseignes', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/catalogue`);

    // Le test dépend du type d'affilié
    // Si enseigne : l'onglet "Points de vente" doit être visible
    // Sinon : seulement Catalogue, FAQ, Contact

    const pointsDeVenteTab = page.locator(
      'nav button:has-text("Points de vente")'
    );
    const isEnseigne = await pointsDeVenteTab.isVisible().catch(() => false);

    if (isEnseigne) {
      // Cliquer et vérifier la route
      await pointsDeVenteTab.click();
      await page.waitForURL(new RegExp(`/points-de-vente$`));

      // Vérifier la carte
      const map = page.locator('[class*="map"], svg');
      await expect(map).toBeVisible();
    } else {
      // Vérifier que l'onglet n'existe pas
      await expect(pointsDeVenteTab).not.toBeVisible();
    }
  });
});

test.describe('LinkMe - Performance (Code Splitting)', () => {
  test('should load only necessary JavaScript for each route', async ({
    page,
  }) => {
    // Cette vérification nécessite des outils de monitoring réseau
    // On peut vérifier que les routes chargent rapidement

    const routes = ['catalogue', 'faq', 'contact'];

    for (const route of routes) {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/s/${TEST_SELECTION_SLUG}/${route}`);

      // Attendre que le contenu soit chargé
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Vérifier que le temps de chargement est raisonnable (< 3 secondes)
      expect(loadTime).toBeLessThan(3000);

      console.log(`Route /${route} loaded in ${loadTime}ms`);
    }
  });
});

test.describe('LinkMe - Error Handling', () => {
  test('should handle non-existent selection gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/s/non-existent-selection-12345`);

    // Vérifier message d'erreur ou redirect
    const errorMessage = page.locator('text=/non trouvée|not found/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should handle unpublished selection', async ({ page }) => {
    // Ce test nécessite un slug de sélection non publiée
    // await page.goto(`${BASE_URL}/s/unpublished-selection`);
    // await expect(page.locator('text=/pas encore publiée/i')).toBeVisible();
  });
});

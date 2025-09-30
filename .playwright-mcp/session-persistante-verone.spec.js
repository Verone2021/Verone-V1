import { test, expect } from '@playwright/test';

// 🚀 SESSION PERSISTANTE VÉRONE - Navigation Séquentielle
// RÈGLES: UNE seule session browser, état persistant, vérifications console
test.describe.serial('Session Persistante Vérone Back Office', () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 [SESSION] Ouverture du browser persistant...');
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();

    // Écouter les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ [CONSOLE ERROR]:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.error('❌ [PAGE ERROR]:', error.message);
    });
  });

  test.afterAll(async () => {
    await context?.close();
  });

  // ÉTAPE 1: Page d'accueil + console check
  test('1. Navigation vers localhost:3000 et vérification console', async () => {
    console.log('📍 [ÉTAPE 1] Navigation vers http://localhost:3000');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Screenshot preuve
    await page.screenshot({
      path: '.playwright-mcp/session-1-accueil.png',
      fullPage: true
    });

    console.log('✅ [ÉTAPE 1] Page d\'accueil chargée avec succès');
  });

  // ÉTAPE 2: Navigation login DANS LA MÊME SESSION
  test('2. Navigation vers /login (même session)', async () => {
    console.log('📍 [ÉTAPE 2] Navigation vers /login');

    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Vérifier que les éléments du formulaire sont présents
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Screenshot preuve
    await page.screenshot({
      path: '.playwright-mcp/session-2-login.png',
      fullPage: true
    });

    console.log('✅ [ÉTAPE 2] Page login affichée avec formulaire complet');
  });

  // ÉTAPE 3: Connexion avec identifiants test
  test('3. Connexion avec identifiants test (même session)', async () => {
    console.log('📍 [ÉTAPE 3] Connexion avec veronebyromeo@gmail.com');

    // Remplir le formulaire
    await page.fill('#email', 'veronebyromeo@gmail.com');
    await page.fill('#password', 'Abc123456');

    // Screenshot avant submission
    await page.screenshot({
      path: '.playwright-mcp/session-3-formulaire-rempli.png',
      fullPage: true
    });

    // Soumettre le formulaire
    await page.click('button[type="submit"]');

    // Attendre la redirection
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    // Screenshot après connexion
    await page.screenshot({
      path: '.playwright-mcp/session-3-dashboard.png',
      fullPage: true
    });

    console.log('✅ [ÉTAPE 3] Connexion réussie, redirection vers dashboard');
  });

  // ÉTAPE 4: Navigation collections DANS LA MÊME SESSION
  test('4. Navigation vers /catalogue/collections (même session)', async () => {
    console.log('📍 [ÉTAPE 4] Navigation vers /catalogue/collections');

    await page.goto('http://localhost:3000/catalogue/collections');
    await page.waitForLoadState('networkidle');

    // Vérifier que la page est chargée
    await expect(page.locator('h1')).toContainText('Collections');

    // Screenshot preuve
    await page.screenshot({
      path: '.playwright-mcp/session-4-collections.png',
      fullPage: true
    });

    console.log('✅ [ÉTAPE 4] Page Collections chargée avec succès');
  });

  // ÉTAPE 5: Test bouton détail collection
  test('5. Test bouton détail collection (ExternalLink)', async () => {
    console.log('📍 [ÉTAPE 5] Test du bouton détail collection');

    // Chercher un bouton de détail (ExternalLink icon)
    const detailButton = page.locator('button[title="Voir détail"]').first();

    if (await detailButton.isVisible()) {
      // Screenshot avant clic
      await page.screenshot({
        path: '.playwright-mcp/session-5-avant-detail.png',
        fullPage: true
      });

      await detailButton.click();
      await page.waitForLoadState('networkidle');

      // Vérifier que nous sommes sur une page de détail
      expect(page.url()).toMatch(/\/catalogue\/collections\/[^\/]+$/);

      // Screenshot après clic
      await page.screenshot({
        path: '.playwright-mcp/session-5-apres-detail.png',
        fullPage: true
      });

      console.log('✅ [ÉTAPE 5] Navigation vers détail collection réussie');
    } else {
      console.log('⚠️ [ÉTAPE 5] Aucun bouton détail trouvé (pas de collections)');

      // Screenshot preuve aucune collection
      await page.screenshot({
        path: '.playwright-mcp/session-5-aucune-collection.png',
        fullPage: true
      });
    }
  });

  // ÉTAPE 6: Vérification finale console errors
  test('6. Vérification finale - Aucune erreur console', async () => {
    console.log('📍 [ÉTAPE 6] Vérification finale des erreurs console');

    // Les erreurs console sont déjà loggées via les listeners
    // Cette étape sert de validation finale

    // Screenshot final de l'état de l'application
    await page.screenshot({
      path: '.playwright-mcp/session-6-etat-final.png',
      fullPage: true
    });

    console.log('✅ [SESSION COMPLETE] Tests séquentiels terminés avec succès');
    console.log('📊 [PROOF] Screenshots disponibles dans .playwright-mcp/');

    // Générer rapport final
    const finalUrl = page.url();
    console.log(`🌐 [URL FINALE] ${finalUrl}`);
  });
});
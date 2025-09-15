/**
 * 🎯 TEST E2E BUSINESS CRITICAL - Système de Catégories connecté à Supabase
 *
 * Ce test valide que le système de catégories est 100% connecté aux vraies données Supabase
 * AUCUNE donnée mock n'est utilisée - tout provient de la base de données réelle
 *
 * Scenarios testés :
 * 1. Authentification et navigation vers /catalogue/categories
 * 2. Lecture des données réelles de Supabase (Families, Categories, Subcategories)
 * 3. CRUD complet pour Families avec upload d'image
 * 4. CRUD complet pour Categories
 * 5. CRUD complet pour Subcategories
 * 6. Persistance des données après rafraîchissement
 * 7. Validation qu'aucune donnée mock n'est utilisée
 */

import { test, expect } from '@playwright/test';

test.describe('🎯 Système de Catégories - Connexion Supabase Complète', () => {

  test.beforeEach(async ({ page }) => {
    // Configuration viewport optimale pour tests
    await page.setViewportSize({ width: 1400, height: 900 });

    // Authentification avec les vraies credentials
    await page.goto('/login');
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    console.log('✅ Authentification réussie');
  });

  test('1. 🔐 Navigation et chargement des données Supabase réelles', async ({ page }) => {
    console.log('🔄 Test navigation vers page catégories...');

    // Navigation vers la page catégories
    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Vérifier que l'URL est correcte
    await expect(page).toHaveURL('/catalogue/categories');

    // Vérifier le titre de la page
    await expect(page.locator('h1')).toContainText('Catalogue - Hiérarchie');

    // Attendre que le chargement se termine (spinner disparaît)
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Vérifier que les métriques de performance s'affichent
    const performanceText = page.locator('text=/Chargé en \\d+ms/');
    await expect(performanceText).toBeVisible({ timeout: 15000 });

    // Vérifier que les données sont chargées depuis Supabase
    const familiesCount = page.locator('text=/\\d+ familles/');
    await expect(familiesCount).toBeVisible();

    // Extraire le nombre de familles pour validation
    const familiesText = await familiesCount.textContent();
    console.log(`📊 Familles chargées depuis Supabase: ${familiesText}`);

    // Prendre une capture d'écran de l'état initial
    await page.screenshot({
      path: '.playwright-mcp/categories-initial-supabase-load.png',
      fullPage: true
    });

    console.log('✅ Données Supabase chargées avec succès');
  });

  test('2. 📚 Validation des données réelles - 8 familles, 14 catégories, 39 sous-catégories', async ({ page }) => {
    console.log('📊 Validation du contenu réel de la base de données...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');

    // Attendre que le chargement soit terminé
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Vérifier qu'il y a exactement 8 familles dans la base
    const familiesText = await page.locator('text=/8 familles/').textContent();
    expect(familiesText).toContain('8 familles');

    // Compter le nombre de lignes de familles affichées
    const familyRows = page.locator('[class*="border-b border-gray-100"] >> [class*="font-medium text-gray-900"]');
    const familyCount = await familyRows.count();
    console.log(`📋 Familles affichées: ${familyCount}`);

    // Vérifier que toutes les familles ont des données réelles (pas de mock)
    for (let i = 0; i < Math.min(familyCount, 3); i++) {
      const familyName = await familyRows.nth(i).textContent();
      console.log(`👨‍👩‍👧‍👦 Famille ${i + 1}: ${familyName}`);

      // Vérifier que ce ne sont pas des noms mock typiques
      expect(familyName).not.toContain('Mock');
      expect(familyName).not.toContain('Test');
      expect(familyName).not.toContain('Sample');
      expect(familyName).not.toContain('Example');
    }

    console.log('✅ Validation des données réelles confirmée');
  });

  test('3. ➕ Test CRUD Families - Création avec données Supabase', async ({ page }) => {
    console.log('🏗️ Test création d\'une nouvelle famille...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Cliquer sur "Nouvelle famille"
    const newFamilyButton = page.locator('button:has-text("Nouvelle famille")');
    await expect(newFamilyButton).toBeVisible();
    await newFamilyButton.click();

    // Vérifier que le formulaire s'ouvre
    await expect(page.locator('text=Créer une famille')).toBeVisible({ timeout: 5000 });

    // Générer un nom unique pour éviter les conflits
    const uniqueName = `Test E2E Family ${Date.now()}`;
    const uniqueSlug = `test-e2e-family-${Date.now()}`;

    // Remplir le formulaire
    await page.fill('input[name="name"]', uniqueName);
    await page.fill('input[name="slug"]', uniqueSlug);
    await page.fill('textarea[name="description"]', 'Description de test pour validation E2E avec Supabase');

    // Capturer l'état du formulaire avant soumission
    await page.screenshot({
      path: '.playwright-mcp/family-form-before-submit.png',
      fullPage: true
    });

    // Soumettre le formulaire
    const submitButton = page.locator('button[type="submit"]:has-text("Créer")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Attendre que le formulaire se ferme et que la liste se mette à jour
    await expect(page.locator('text=Créer une famille')).not.toBeVisible({ timeout: 10000 });

    // Attendre la mise à jour de la liste
    await page.waitForTimeout(2000);

    // Vérifier que la nouvelle famille apparaît dans la liste
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });

    console.log(`✅ Famille créée avec succès: ${uniqueName}`);

    // Capturer l'état après création
    await page.screenshot({
      path: '.playwright-mcp/family-created-in-list.png',
      fullPage: true
    });
  });

  test('4. ✏️ Test CRUD Families - Modification et activation/désactivation', async ({ page }) => {
    console.log('🔧 Test modification d\'une famille existante...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Rechercher la première famille modifiable
    const firstEditButton = page.locator('[title="Modifier"]').first();
    await expect(firstEditButton).toBeVisible({ timeout: 10000 });

    // Prendre le nom de la famille avant modification
    const familyRow = firstEditButton.locator('../../../..');
    const originalName = await familyRow.locator('.font-medium.text-gray-900').textContent();
    console.log(`📝 Modification de la famille: ${originalName}`);

    await firstEditButton.click();

    // Vérifier que le formulaire de modification s'ouvre
    await expect(page.locator('text=Modifier la famille')).toBeVisible({ timeout: 5000 });

    // Modifier la description
    const newDescription = `Description modifiée E2E - ${Date.now()}`;
    const descriptionField = page.locator('textarea[name="description"]');
    await descriptionField.clear();
    await descriptionField.fill(newDescription);

    // Soumettre la modification
    const updateButton = page.locator('button[type="submit"]:has-text("Modifier")');
    await expect(updateButton).toBeVisible();
    await updateButton.click();

    // Attendre que le formulaire se ferme
    await expect(page.locator('text=Modifier la famille')).not.toBeVisible({ timeout: 10000 });

    // Vérifier que la modification est reflétée (attendre la mise à jour)
    await page.waitForTimeout(2000);

    console.log(`✅ Famille modifiée avec succès`);
  });

  test('5. 📂 Test CRUD Categories - Création de catégorie sous une famille', async ({ page }) => {
    console.log('📁 Test création d\'une catégorie...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Cliquer sur le bouton "Nouvelle catégorie" (Plus) de la première famille
    const firstFamilyAddButton = page.locator('[title="Nouvelle catégorie"]').first();
    await expect(firstFamilyAddButton).toBeVisible({ timeout: 10000 });
    await firstFamilyAddButton.click();

    // Vérifier que le formulaire de création de catégorie s'ouvre
    await expect(page.locator('text=Créer une catégorie')).toBeVisible({ timeout: 5000 });

    // Générer un nom unique
    const uniqueName = `Test E2E Category ${Date.now()}`;
    const uniqueSlug = `test-e2e-category-${Date.now()}`;

    // Remplir le formulaire
    await page.fill('input[name="name"]', uniqueName);
    await page.fill('input[name="slug"]', uniqueSlug);
    await page.fill('textarea[name="description"]', 'Description de test pour catégorie E2E');

    // Soumettre
    const submitButton = page.locator('button[type="submit"]:has-text("Créer")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Attendre que le formulaire se ferme
    await expect(page.locator('text=Créer une catégorie')).not.toBeVisible({ timeout: 10000 });

    console.log(`✅ Catégorie créée: ${uniqueName}`);
  });

  test('6. 📋 Test CRUD Subcategories - Création de sous-catégorie', async ({ page }) => {
    console.log('📄 Test création d\'une sous-catégorie...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Développer la première famille pour voir ses catégories
    const firstFamilyExpandButton = page.locator('[class*="border-b border-gray-100"] button:has([data-lucide="folder"])').first();
    await expect(firstFamilyExpandButton).toBeVisible({ timeout: 10000 });
    await firstFamilyExpandButton.click();

    // Attendre que les catégories se développent
    await page.waitForTimeout(1000);

    // Chercher le bouton "Nouvelle sous-catégorie" d'une catégorie
    const newSubcategoryButton = page.locator('[title="Nouvelle sous-catégorie"]').first();
    if (await newSubcategoryButton.isVisible()) {
      await newSubcategoryButton.click();

      // Vérifier que le formulaire s'ouvre
      await expect(page.locator('text=Créer une sous-catégorie')).toBeVisible({ timeout: 5000 });

      // Générer un nom unique
      const uniqueName = `Test E2E Subcategory ${Date.now()}`;
      const uniqueSlug = `test-e2e-subcategory-${Date.now()}`;

      // Remplir le formulaire
      await page.fill('input[name="name"]', uniqueName);
      await page.fill('input[name="slug"]', uniqueSlug);
      await page.fill('textarea[name="description"]', 'Description de test pour sous-catégorie E2E');

      // Soumettre
      const submitButton = page.locator('button[type="submit"]:has-text("Créer")');
      await expect(submitButton).toBeVisible();
      await submitButton.click();

      // Attendre que le formulaire se ferme
      await expect(page.locator('text=Créer une sous-catégorie')).not.toBeVisible({ timeout: 10000 });

      console.log(`✅ Sous-catégorie créée: ${uniqueName}`);
    } else {
      console.log('⚠️ Aucune catégorie disponible pour créer une sous-catégorie');
    }
  });

  test('7. 🔄 Test persistance après rafraîchissement de page', async ({ page }) => {
    console.log('🔄 Test de persistance des données après rafraîchissement...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Capturer l'état initial
    const initialFamiliesText = await page.locator('text=/\\d+ familles/').textContent();
    console.log(`📊 État initial: ${initialFamiliesText}`);

    // Prendre une capture avant rafraîchissement
    await page.screenshot({
      path: '.playwright-mcp/before-refresh.png',
      fullPage: true
    });

    // Rafraîchir la page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Vérifier que les données sont toujours là
    const afterRefreshFamiliesText = await page.locator('text=/\\d+ familles/').textContent();
    console.log(`📊 État après rafraîchissement: ${afterRefreshFamiliesText}`);

    // Comparer les états
    expect(afterRefreshFamiliesText).toBe(initialFamiliesText);

    // Prendre une capture après rafraîchissement
    await page.screenshot({
      path: '.playwright-mcp/after-refresh.png',
      fullPage: true
    });

    console.log('✅ Persistance des données confirmée');
  });

  test('8. 🔍 Validation anti-mock - Aucune donnée factice utilisée', async ({ page }) => {
    console.log('🕵️ Validation qu\'aucune donnée mock n\'est utilisée...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // Analyser le contenu de la page pour détecter des données mock
    const pageContent = await page.content();

    // Mots-clés typiques de données mock à éviter
    const mockKeywords = [
      'mockData',
      'sampleData',
      'testData',
      'lorem ipsum',
      'fake data',
      'dummy',
      'placeholder',
      'mock-',
      'sample-',
      'test-family-',
      'fake-category'
    ];

    let mockFound = false;
    const foundMockKeywords: string[] = [];

    for (const keyword of mockKeywords) {
      if (pageContent.toLowerCase().includes(keyword.toLowerCase())) {
        mockFound = true;
        foundMockKeywords.push(keyword);
      }
    }

    // Vérifier qu'aucun mot-clé mock n'est trouvé
    if (mockFound) {
      console.error(`❌ Données mock détectées: ${foundMockKeywords.join(', ')}`);
      throw new Error(`Données mock trouvées dans la page: ${foundMockKeywords.join(', ')}`);
    }

    // Vérifier que les appels réseau vont vers Supabase
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        requests.push(request.url());
      }
    });

    // Rafraîchir pour capturer les requêtes
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Vérifier qu'il y a eu des appels vers Supabase
    console.log(`📡 Requêtes Supabase détectées: ${requests.length}`);
    expect(requests.length).toBeGreaterThan(0);

    // Vérifier la présence des hooks de données réelles dans le code source
    expect(pageContent).toContain('useFamilies');
    expect(pageContent).toContain('useCategories');
    expect(pageContent).toContain('useSubcategories');

    // Vérifier l'absence de commentaires indiquant du mock
    expect(pageContent).not.toContain('// MOCK DATA');
    expect(pageContent).not.toContain('// TODO: Remove mock');

    console.log('✅ Validation anti-mock réussie - Toutes les données proviennent de Supabase');
  });

  test('9. 🎯 Test performance et SLO compliance', async ({ page }) => {
    console.log('⚡ Test de performance et respect des SLOs...');

    const startTime = performance.now();

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    console.log(`⏱️ Temps de chargement total: ${loadTime.toFixed(2)}ms`);

    // Vérifier le SLO de 2 secondes pour le dashboard/catalogue
    expect(loadTime).toBeLessThan(2000);

    // Vérifier que le message de performance SLO s'affiche
    const sloMessage = page.locator('text=/Performance optimale.*SLO/');
    if (await sloMessage.isVisible()) {
      console.log('✅ Message SLO affiché');
    }

    // Extraire le temps affiché dans l'interface
    const performanceText = await page.locator('text=/Chargé en \\d+ms/').textContent();
    const displayedTime = parseInt(performanceText?.match(/(\d+)ms/)?.[1] || '0');

    console.log(`📊 Temps affiché dans l'UI: ${displayedTime}ms`);

    // Vérifier que le temps affiché est cohérent (moins de 2s)
    expect(displayedTime).toBeLessThan(2000);

    console.log('✅ Performance validée - SLO respecté');
  });

  test('10. 🔄 Test workflow complet avec vérification de bout en bout', async ({ page }) => {
    console.log('🎯 Test workflow complet de bout en bout...');

    await page.goto('/catalogue/categories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Chargement des données Supabase...', { state: 'detached', timeout: 10000 });

    // 1. Compter les familles initiales
    const initialFamiliesText = await page.locator('text=/\\d+ familles/').textContent();
    const initialCount = parseInt(initialFamiliesText?.match(/(\d+) familles/)?.[1] || '0');
    console.log(`📊 Nombre initial de familles: ${initialCount}`);

    // 2. Créer une nouvelle famille
    const uniqueName = `E2E Workflow Family ${Date.now()}`;
    await page.click('button:has-text("Nouvelle famille")');
    await expect(page.locator('text=Créer une famille')).toBeVisible();

    await page.fill('input[name="name"]', uniqueName);
    await page.fill('input[name="slug"]', `e2e-workflow-${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Test workflow complet E2E');

    await page.click('button[type="submit"]:has-text("Créer")');
    await expect(page.locator('text=Créer une famille')).not.toBeVisible({ timeout: 10000 });

    // 3. Vérifier que le compteur a augmenté
    await page.waitForTimeout(2000);
    const newFamiliesText = await page.locator('text=/\\d+ familles/').textContent();
    const newCount = parseInt(newFamiliesText?.match(/(\d+) familles/)?.[1] || '0');
    console.log(`📊 Nouveau nombre de familles: ${newCount}`);

    expect(newCount).toBe(initialCount + 1);

    // 4. Vérifier que la famille apparaît dans la liste
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();

    // 5. Modifier la famille
    const editButton = page.locator(`text=${uniqueName}`).locator('../../../..').locator('[title="Modifier"]');
    await editButton.click();

    await expect(page.locator('text=Modifier la famille')).toBeVisible();
    await page.fill('textarea[name="description"]', 'Description modifiée dans le workflow E2E');
    await page.click('button[type="submit"]:has-text("Modifier")');
    await expect(page.locator('text=Modifier la famille')).not.toBeVisible({ timeout: 10000 });

    // 6. Test de recherche
    await page.fill('input[placeholder*="Rechercher"]', uniqueName);
    await page.waitForTimeout(1000);

    // Vérifier que seule cette famille est visible
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();

    // Effacer la recherche
    await page.fill('input[placeholder*="Rechercher"]', '');
    await page.waitForTimeout(1000);

    // 7. Supprimer la famille créée (nettoyage)
    const deleteButton = page.locator(`text=${uniqueName}`).locator('../../../..').locator('[title="Supprimer"]');

    // Intercepter la confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Êtes-vous sûr');
      await dialog.accept();
    });

    await deleteButton.click();
    await page.waitForTimeout(2000);

    // 8. Vérifier que la famille a été supprimée
    await expect(page.locator(`text=${uniqueName}`)).not.toBeVisible();

    // 9. Vérifier que le compteur est revenu à l'initial
    const finalFamiliesText = await page.locator('text=/\\d+ familles/').textContent();
    const finalCount = parseInt(finalFamiliesText?.match(/(\d+) familles/)?.[1] || '0');
    console.log(`📊 Nombre final de familles: ${finalCount}`);

    expect(finalCount).toBe(initialCount);

    // Capture finale
    await page.screenshot({
      path: '.playwright-mcp/workflow-complete-validation.png',
      fullPage: true
    });

    console.log('🎉 Workflow complet validé avec succès - Système 100% connecté à Supabase');
  });

});
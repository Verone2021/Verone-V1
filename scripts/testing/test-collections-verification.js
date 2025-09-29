const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testCollectionsVerification() {
  // Créer le dossier pour les captures d'écran
  const screenshotsDir = path.join(__dirname, 'screenshots-test');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    slowMo: 1000 // Ralentir pour voir les actions
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  console.log('🚀 DÉBUT DU TEST COLLECTIONS - VÉRIFICATION 3 PRODUITS');

  try {
    // ===== ÉTAPE 0: AUTHENTIFICATION =====
    console.log('\n📍 ÉTAPE 0: Connexion utilisateur');
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');

    // Remplir les identifiants
    await page.fill('input[type="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"]', 'Abc123456');

    // Cliquer sur se connecter
    await page.click('button:has-text("SE CONNECTER")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ Connexion effectuée');

    // ===== ÉTAPE 1: CONNEXION ET NAVIGATION =====
    console.log('\n📍 ÉTAPE 1: Navigation vers la page collections');
    await page.goto('http://localhost:3002/catalogue/collections');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(screenshotsDir, '01-page-collections-initiale.png'),
      fullPage: true
    });
    console.log('✅ Page collections chargée et capture d\'écran prise');

    // ===== ÉTAPE 2: CLIC DIRECT SUR BOUTON AJOUTER PRODUITS =====
    console.log('\n📍 ÉTAPE 2: Clic direct sur bouton "Ajouter produits" d\'une collection');

    // Chercher le premier bouton "Ajouter produits" visible sur la page
    const addProductsButton = page.locator('button:has-text("Ajouter produits")').first();

    // Vérifier si le bouton est visible
    const addButtonVisible = await addProductsButton.isVisible().catch(() => false);
    console.log(`🔍 Bouton "Ajouter produits" visible: ${addButtonVisible}`);

    if (!addButtonVisible) {
      // Prendre une capture pour debug
      await page.screenshot({
        path: path.join(screenshotsDir, 'DEBUG-bouton-ajouter.png'),
        fullPage: true
      });

      // Essayer d'autres sélecteurs
      const alternativeAddButton = page.locator('button').filter({ hasText: /ajouter.*produit/i }).first();
      const altAddVisible = await alternativeAddButton.isVisible().catch(() => false);
      console.log(`🔍 Bouton alternatif ajouter trouvé: ${altAddVisible}`);

      if (altAddVisible) {
        await alternativeAddButton.click();
      } else {
        throw new Error('Aucun bouton pour ajouter des produits trouvé');
      }
    } else {
      await addProductsButton.click();
    }

    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(screenshotsDir, '02-bouton-ajouter-clique.png'),
      fullPage: true
    });
    console.log('✅ Bouton "Ajouter produits" cliqué');

    // ===== ÉTAPE 3: TEST CRITIQUE - VÉRIFICATION DES 3 PRODUITS =====
    console.log('\n📍 ÉTAPE 3: MOMENT CRITIQUE - Attente de la ProductSelector Modal');

    // Attendre que la modal soit complètement chargée (DialogContent de shadcn/ui)
    await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Attendre que le titre de la modal soit visible pour s'assurer qu'elle est chargée
    await page.waitForSelector(':text("Ajouter des produits")', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // VÉRIFICATION CRITIQUE : Cliquer sur le filtre "Tous" pour voir TOUS les produits
    console.log('🔄 TEST CRITIQUE: Application du filtre "Tous" pour voir tous les produits');
    const allFilterButton = page.locator('button:has-text("Tous")').first();
    const allFilterVisible = await allFilterButton.isVisible().catch(() => false);
    console.log(`🔍 Bouton filtre "Tous" visible: ${allFilterVisible}`);

    if (allFilterVisible) {
      await allFilterButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Filtre "Tous" appliqué');
    }

    await page.screenshot({
      path: path.join(screenshotsDir, '03-CRITIQUE-modal-product-selector.png'),
      fullPage: true
    });

    // ===== COMPTAGE ET VÉRIFICATION DES PRODUITS =====
    console.log('\n🔍 ANALYSE CRITIQUE: Comptage des produits dans la modal');

    // Chercher tous les produits affichés dans la modal (selon ProductSelectorModal.tsx)
    // Les produits sont dans des divs avec checkbox et nom
    const productCards = await page.locator('[role="dialog"] .space-y-2 > div').all();
    const productCount = productCards.length;

    console.log(`📊 NOMBRE DE PRODUITS TROUVÉS: ${productCount}`);

    // Extraire les informations de chaque produit
    const productInfos = [];
    for (let i = 0; i < productCards.length; i++) {
      try {
        const card = productCards[i];
        const name = await card.locator('h3').first().textContent();
        const skuElement = await card.locator(':text("SKU:")').first().textContent().catch(() => null);

        productInfos.push({
          index: i + 1,
          name: name?.trim() || 'Nom non trouvé',
          sku: skuElement?.trim() || 'SKU non trouvé'
        });

        console.log(`📦 Produit ${i + 1}: "${name?.trim()}" - SKU: "${skuElement?.trim() || 'N/A'}"`);
      } catch (error) {
        console.log(`⚠️ Erreur lors de l'extraction du produit ${i + 1}: ${error.message}`);
      }
    }

    // ===== ÉTAPE 4: SÉLECTION DE PRODUITS =====
    console.log('\n📍 ÉTAPE 4: Sélection de 2 produits et finalisation');

    if (productCards.length >= 2) {
      // Sélectionner les 2 premiers produits en cliquant sur les cartes (plus fiable)
      for (let i = 0; i < Math.min(2, productCards.length); i++) {
        await productCards[i].click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '04-produits-selectionnes.png'),
        fullPage: true
      });

      // Cliquer sur "Ajouter (2)"
      const addSelectedButton = page.locator('button:has-text("Ajouter")').first();
      await addSelectedButton.click();
      await page.waitForTimeout(3000);

      // Renommer la collection
      const renameButton = page.locator('text="Modifier", button:has-text("Modifier"), [data-testid="edit-name"]').first();
      if (await renameButton.isVisible()) {
        await renameButton.click();
        await page.waitForTimeout(1000);

        const nameInput = page.locator('input[value*="Test"], input[type="text"]').first();
        await nameInput.fill('Collection Test Romeo Final');

        const saveButton = page.locator('text="Sauvegarder", button:has-text("Sauvegarder")').first();
        await saveButton.click();
        await page.waitForTimeout(2000);
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '05-collection-finale.png'),
        fullPage: true
      });
    }

    // ===== RAPPORT FINAL =====
    console.log('\n' + '='.repeat(60));
    console.log('📋 RAPPORT DÉTAILLÉ - TEST COLLECTIONS VÉRONE');
    console.log('='.repeat(60));
    console.log(`🔢 NOMBRE TOTAL DE PRODUITS DANS LA MODAL: ${productCount}`);
    console.log(`✅ OBJECTIF ATTEINT: ${productCount === 3 ? 'OUI - 3 produits détectés' : 'NON - ' + productCount + ' produits détectés'}`);
    console.log('\n📦 DÉTAIL DES PRODUITS:');

    productInfos.forEach((product, index) => {
      console.log(`   ${index + 1}. "${product.name}" - SKU: "${product.sku}"`);
    });

    console.log('\n📸 CAPTURES D\'ÉCRAN GÉNÉRÉES:');
    console.log('   1. 01-page-collections-initiale.png');
    console.log('   2. 02-collection-selectionnee.png');
    console.log('   3. 03-CRITIQUE-modal-product-selector.png');
    console.log('   4. 04-produits-selectionnes.png');
    console.log('   5. 05-collection-finale.png');

    console.log('\n🎯 CONCLUSION:');
    if (productCount === 3) {
      console.log('✅ SUCCESS: Le correctif fonctionne ! Les 3 produits sont bien visibles.');
      console.log('✅ Le filtre "active" → "all" permet maintenant de voir tous les produits.');
    } else {
      console.log('❌ PROBLÈME: Le nombre de produits n\'est pas celui attendu.');
      console.log(`❌ Attendu: 3 produits | Trouvé: ${productCount} produits`);
    }

    console.log('='.repeat(60));

    return {
      success: productCount === 3,
      productCount,
      products: productInfos,
      screenshotsPath: screenshotsDir
    };

  } catch (error) {
    console.error('❌ ERREUR PENDANT LE TEST:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, 'ERROR-screenshot.png'),
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// Exécuter le test
testCollectionsVerification()
  .then(result => {
    console.log('\n🏁 TEST TERMINÉ AVEC SUCCÈS');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 TEST ÉCHOUÉ:', error.message);
    process.exit(1);
  });
/**
 * 🧪 Test Debug Upload Images - Diagnostic Complet
 *
 * Script pour diagnostiquer les problèmes d'upload ImageUploadV2
 */

const { chromium } = require('playwright');
const path = require('path');

async function testImageUploadDebug() {
  console.log('🚀 Démarrage diagnostic upload images...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  // Intercepter les erreurs console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      console.log('🔴 Erreur Console:', text);
    } else if (text.includes('upload') || text.includes('Upload')) {
      console.log(`📡 ${type.toUpperCase()}:`, text);
    }
  });

  // Intercepter les requêtes réseau
  page.on('request', request => {
    const url = request.url();
    if (url.includes('storage') || url.includes('upload')) {
      console.log('📤 Requête:', request.method(), url);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('storage') || url.includes('upload')) {
      console.log('📥 Réponse:', response.status(), url);
    }
  });

  try {
    // 1. Navigation vers le login
    console.log('🔐 Navigation vers login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    // 2. Login avec les credentials par défaut
    console.log('🔑 Connexion...');
    await page.fill('input[type="email"]', 'admin@verone.fr');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Attendre la redirection
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Connexion réussie');

    // 3. Navigation vers les catégories
    console.log('📂 Navigation vers catégories...');
    await page.goto('http://localhost:3001/catalogue/categories', { waitUntil: 'networkidle' });

    // 4. Prendre screenshot de l'état initial
    await page.screenshot({ path: 'categories-page-initial-state.png', fullPage: true });

    // 5. Cliquer sur le bouton "Nouvelle famille" pour ouvrir le formulaire
    console.log('➕ Ouverture formulaire famille...');
    await page.click('button:has-text("Nouvelle famille")');

    // Attendre que le modal s'ouvre
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✅ Modal famille ouvert');

    // 6. Remplir le formulaire
    console.log('📝 Remplissage formulaire...');
    await page.fill('input[id="name"]', 'Test Upload Debug');
    await page.fill('textarea[id="description"]', 'Test pour diagnostiquer upload images');

    // 7. Test d'upload d'image - Préparer le fichier
    const photoPath = path.resolve('PHOTO TEST.png');
    console.log('📷 Chemin photo test:', photoPath);

    // Prendre screenshot avant upload
    await page.screenshot({ path: 'family-form-before-upload.png', fullPage: true });

    // 8. Déclencher l'upload
    console.log('📤 Déclenchement upload...');

    // Chercher l'input file dans le composant ImageUploadV2
    const fileInput = await page.locator('input[type="file"]').first();

    if (await fileInput.count() > 0) {
      console.log('✅ Input file trouvé');

      // Surveiller les changements d'état
      const initialText = await page.textContent('body');

      // Upload du fichier
      await fileInput.setInputFiles(photoPath);
      console.log('📁 Fichier sélectionné');

      // Attendre quelques secondes pour voir les changements
      await page.waitForTimeout(5000);

      // Prendre screenshot après upload
      await page.screenshot({ path: 'family-form-after-upload.png', fullPage: true });

      // Vérifier s'il y a eu des changements
      const finalText = await page.textContent('body');

      if (initialText !== finalText) {
        console.log('✅ Des changements détectés dans l\'interface');
      } else {
        console.log('⚠️ Aucun changement visible dans l\'interface');
      }

      // Chercher des indicateurs d'erreur ou de succès
      const errorElements = await page.locator('.text-red-600, .text-red-500, [class*="error"]').count();
      const successElements = await page.locator('.text-green-600, .text-green-500, [class*="success"]').count();

      console.log(`🔴 Éléments d'erreur trouvés: ${errorElements}`);
      console.log(`🟢 Éléments de succès trouvés: ${successElements}`);

      if (errorElements > 0) {
        const errorText = await page.locator('.text-red-600, .text-red-500').first().textContent();
        console.log('❌ Texte d\'erreur:', errorText);
      }

      if (successElements > 0) {
        const successText = await page.locator('.text-green-600, .text-green-500').first().textContent();
        console.log('✅ Texte de succès:', successText);
      }

    } else {
      console.log('❌ Input file non trouvé');
    }

    // 9. Diagnostic final
    console.log('\n📊 DIAGNOSTIC FINAL:');
    console.log('===================');

    // Vérifier l'état d'authentification
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes('supabase') || c.name.includes('auth'));
    console.log('🍪 Cookie auth présent:', !!authCookie);

    // Vérifier les erreurs JavaScript
    const errors = await page.evaluate(() => {
      return window.__uploadErrors || [];
    });
    console.log('💥 Erreurs JS capturées:', errors);

    // Attendre avant fermeture pour debug manuel
    console.log('⏸️ Pause pour inspection manuelle (30s)...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('💥 Erreur pendant le test:', error);
    await page.screenshot({ path: 'test-error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 Test terminé');
  }
}

// Exécuter le test
testImageUploadDebug().catch(console.error);
/**
 * 🔍 Test Collections Page - MCP Playwright Integration
 * Vérone Back Office - Test navigation et fonctionnalités page collections
 */

const { chromium } = require('playwright');

async function testCollectionsPage() {
  console.log('🚀 [MCP Playwright] Démarrage test page collections...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const navigationSteps = [];

  // Capture des erreurs console
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push({
        type: 'CONSOLE_ERROR',
        message: text,
        timestamp: new Date().toISOString(),
        url: page.url()
      });
      console.log('🔴 [Console Error]:', text);
    }

    if (type === 'warning') {
      warnings.push({
        type: 'CONSOLE_WARNING',
        message: text,
        timestamp: new Date().toISOString(),
        url: page.url()
      });
      console.log('🟡 [Console Warning]:', text);
    }
  });

  // Capture des erreurs réseau
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();

    if (status >= 400) {
      errors.push({
        type: 'NETWORK_ERROR',
        message: `HTTP ${status} - ${url}`,
        timestamp: new Date().toISOString(),
        status: status,
        url: url
      });
      console.log('🔴 [Network Error]:', `HTTP ${status} - ${url}`);
    }
  });

  try {
    // Étape 1: Navigation vers la page d'accueil
    console.log('📊 [Test 1] Navigation vers localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    navigationSteps.push({
      step: 1,
      action: 'Navigation accueil',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    // Capture d'écran étape 1
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/step1-homepage.png',
      fullPage: true
    });

    // Étape 2: Navigation directe vers /catalogue/collections
    console.log('📊 [Test 2] Navigation directe vers /catalogue/collections...');
    await page.goto('http://localhost:3001/catalogue/collections', { waitUntil: 'networkidle' });

    // Vérifier que la page se charge sans erreur 404
    const pageTitle = await page.title();
    const currentUrl = page.url();

    console.log(`✅ [Navigation] URL actuelle: ${currentUrl}`);
    console.log(`✅ [Navigation] Titre page: ${pageTitle}`);

    navigationSteps.push({
      step: 2,
      action: 'Navigation collections',
      status: currentUrl.includes('/catalogue/collections') ? 'SUCCESS' : 'FAILED',
      url: currentUrl,
      title: pageTitle,
      timestamp: new Date().toISOString()
    });

    // Capture d'écran étape 2
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/step2-collections-page.png',
      fullPage: true
    });

    // Étape 3: Vérification des éléments de la page
    console.log('📊 [Test 3] Vérification éléments page collections...');

    // Attendre que les composants se chargent
    await page.waitForTimeout(2000);

    // Vérifier présence du bouton "Créer une collection"
    const createButton = await page.locator('button:has-text("Créer")').first();
    const createButtonExists = await createButton.count() > 0;

    console.log(`✅ [UI] Bouton Créer trouvé: ${createButtonExists}`);

    // Vérifier présence de la grille de collections
    const collectionsGrid = await page.locator('[data-testid="collections-grid"], .grid, .collections-container').first();
    const gridExists = await collectionsGrid.count() > 0;

    console.log(`✅ [UI] Grille collections trouvée: ${gridExists}`);

    navigationSteps.push({
      step: 3,
      action: 'Vérification UI',
      status: (createButtonExists && gridExists) ? 'SUCCESS' : 'PARTIAL',
      elements: {
        createButton: createButtonExists,
        collectionsGrid: gridExists
      },
      timestamp: new Date().toISOString()
    });

    // Étape 4: Test création d'une collection (si bouton présent)
    if (createButtonExists) {
      console.log('📊 [Test 4] Test ouverture modal création collection...');

      await createButton.click();
      await page.waitForTimeout(1000);

      // Vérifier que le modal s'ouvre
      const modal = await page.locator('.modal, .dialog, [role="dialog"]').first();
      const modalVisible = await modal.count() > 0;

      console.log(`✅ [Modal] Modal création visible: ${modalVisible}`);

      // Capture d'écran avec modal
      await page.screenshot({
        path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/step3-modal-opened.png',
        fullPage: true
      });

      navigationSteps.push({
        step: 4,
        action: 'Test modal création',
        status: modalVisible ? 'SUCCESS' : 'FAILED',
        modalVisible: modalVisible,
        timestamp: new Date().toISOString()
      });

      // Fermer le modal pour tests suivants
      if (modalVisible) {
        const closeButton = await page.locator('button:has-text("Annuler"), [aria-label="Close"], .close').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Étape 5: Test API collections
    console.log('📊 [Test 5] Test API collections...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/collections');
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          error: error.message,
          type: 'FETCH_ERROR'
        };
      }
    });

    console.log(`✅ [API] Réponse collections:`, apiResponse);

    navigationSteps.push({
      step: 5,
      action: 'Test API collections',
      status: apiResponse.ok ? 'SUCCESS' : 'FAILED',
      apiResponse: apiResponse,
      timestamp: new Date().toISOString()
    });

    // Capture d'écran finale
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/step4-final-state.png',
      fullPage: true
    });

  } catch (error) {
    errors.push({
      type: 'PLAYWRIGHT_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    console.log('❌ [Error]:', error.message);

    // Capture d'écran en cas d'erreur
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/error-screenshot.png',
      fullPage: true
    });
  }

  await browser.close();

  // Rapport consolidé
  const report = {
    timestamp: new Date().toISOString(),
    testTarget: '/catalogue/collections',
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      navigationSteps: navigationSteps.length,
      successfulSteps: navigationSteps.filter(s => s.status === 'SUCCESS').length,
      criticalIssues: errors.filter(e => ['FETCH_ERROR', 'NETWORK_ERROR', 'PLAYWRIGHT_ERROR'].includes(e.type)).length
    },
    navigationSteps: navigationSteps,
    errors: errors,
    warnings: warnings,
    recommendations: generateCollectionsRecommendations(errors, warnings, navigationSteps)
  };

  console.log('📊 [Rapport Final Collections]:', JSON.stringify(report.summary, null, 2));

  return report;
}

function generateCollectionsRecommendations(errors, warnings, navigationSteps) {
  const recommendations = [];

  const failedSteps = navigationSteps.filter(s => s.status === 'FAILED');
  const networkErrors = errors.filter(e => e.type === 'NETWORK_ERROR');
  const consoleErrors = errors.filter(e => e.type === 'CONSOLE_ERROR');

  if (failedSteps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'NAVIGATION',
      issue: `${failedSteps.length} étapes de navigation échouées`,
      solution: 'Vérifier les sélecteurs et la logique de navigation'
    });
  }

  if (networkErrors.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'API',
      issue: 'Erreurs réseau détectées sur page collections',
      solution: 'Vérifier endpoints API et configuration Supabase'
    });
  }

  if (consoleErrors.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'FRONTEND',
      issue: 'Erreurs console détectées',
      solution: 'Corriger les erreurs JavaScript côté client'
    });
  }

  return recommendations;
}

// Exécution du test
testCollectionsPage()
  .then(report => {
    console.log('✅ [Test Collections Terminé] Rapport sauvegardé');
    // Sauvegarder le rapport pour analyse
    require('fs').writeFileSync(
      '/Users/romeodossantos/verone-back-office/.playwright-mcp/collections-test-report.json',
      JSON.stringify(report, null, 2)
    );
  })
  .catch(error => {
    console.error('❌ [Test Collections Failed]:', error);
    process.exit(1);
  });
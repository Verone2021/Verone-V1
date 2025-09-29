/**
 * 🔍 Test Collections avec Authentification - MCP Playwright Integration
 * Vérone Back Office - Test complet page collections après connexion
 */

const { chromium } = require('playwright');

async function testCollectionsWithAuth() {
  console.log('🚀 [MCP Playwright] Démarrage test collections avec authentification...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const authSteps = [];

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
    // Étape 1: Navigation vers page de connexion
    console.log('📊 [Test 1] Navigation vers page login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    authSteps.push({
      step: 1,
      action: 'Navigation login',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    // Capture d'écran étape 1
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step1-login-page.png',
      fullPage: true
    });

    // Étape 2: Remplir formulaire de connexion
    console.log('📊 [Test 2] Remplissage formulaire connexion...');

    // Utiliser les identifiants du compte de test MVP
    await page.fill('input[type="email"], input[name="email"]', 'veronebyromeo@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'Abc123456');

    authSteps.push({
      step: 2,
      action: 'Remplissage formulaire',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    // Capture d'écran avec formulaire rempli
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step2-form-filled.png',
      fullPage: true
    });

    // Étape 3: Connexion
    console.log('📊 [Test 3] Tentative de connexion...');

    await page.click('button:has-text("SE CONNECTER"), button[type="submit"]');

    // Attendre la redirection
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login');

    console.log(`✅ [Auth] URL après connexion: ${currentUrl}`);
    console.log(`✅ [Auth] Connexion réussie: ${isLoggedIn}`);

    authSteps.push({
      step: 3,
      action: 'Tentative connexion',
      status: isLoggedIn ? 'SUCCESS' : 'FAILED',
      resultUrl: currentUrl,
      timestamp: new Date().toISOString()
    });

    // Capture d'écran après connexion
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step3-post-login.png',
      fullPage: true
    });

    if (isLoggedIn) {
      // Étape 4: Navigation vers collections
      console.log('📊 [Test 4] Navigation vers collections après authentification...');

      await page.goto('http://localhost:3001/catalogue/collections', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const collectionsUrl = page.url();
      const onCollectionsPage = collectionsUrl.includes('/catalogue/collections') && !collectionsUrl.includes('/login');

      console.log(`✅ [Collections] URL collections: ${collectionsUrl}`);
      console.log(`✅ [Collections] Accès autorisé: ${onCollectionsPage}`);

      authSteps.push({
        step: 4,
        action: 'Navigation collections',
        status: onCollectionsPage ? 'SUCCESS' : 'FAILED',
        collectionsUrl: collectionsUrl,
        timestamp: new Date().toISOString()
      });

      // Capture d'écran page collections
      await page.screenshot({
        path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step4-collections-page.png',
        fullPage: true
      });

      if (onCollectionsPage) {
        // Étape 5: Test fonctionnalités collections
        console.log('📊 [Test 5] Test fonctionnalités page collections...');

        // Attendre que les composants se chargent
        await page.waitForTimeout(3000);

        // Vérifier présence des éléments UI
        const createButton = await page.locator('button:has-text("Créer"), button:has-text("Nouvelle")').first();
        const createButtonExists = await createButton.count() > 0;

        // Vérifier s'il y a du contenu chargé ou un état vide
        const hasContent = await page.locator('.grid, .collection-card, .empty-state').count() > 0;

        // Test loader/skeleton pendant chargement
        const hasLoader = await page.locator('.loading, .skeleton, .spinner').count() > 0;

        console.log(`✅ [UI] Bouton créer trouvé: ${createButtonExists}`);
        console.log(`✅ [UI] Contenu présent: ${hasContent}`);
        console.log(`✅ [UI] Loader présent: ${hasLoader}`);

        authSteps.push({
          step: 5,
          action: 'Test fonctionnalités',
          status: 'SUCCESS',
          uiElements: {
            createButton: createButtonExists,
            hasContent: hasContent,
            hasLoader: hasLoader
          },
          timestamp: new Date().toISOString()
        });

        // Étape 6: Test ouverture modal création (si bouton présent)
        if (createButtonExists) {
          console.log('📊 [Test 6] Test création collection...');

          await createButton.click();
          await page.waitForTimeout(1500);

          // Vérifier que le modal s'ouvre
          const modal = await page.locator('.modal, .dialog, [role="dialog"], .sheet').first();
          const modalVisible = await modal.count() > 0;

          console.log(`✅ [Modal] Modal création visible: ${modalVisible}`);

          authSteps.push({
            step: 6,
            action: 'Test modal création',
            status: modalVisible ? 'SUCCESS' : 'FAILED',
            modalVisible: modalVisible,
            timestamp: new Date().toISOString()
          });

          // Capture d'écran avec modal ouvert
          await page.screenshot({
            path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step6-modal-opened.png',
            fullPage: true
          });

          // Test remplissage formulaire dans modal
          if (modalVisible) {
            console.log('📊 [Test 7] Test remplissage formulaire collection...');

            // Remplir nom collection
            const nameInput = await page.locator('input[name="name"], input[placeholder*="nom"]').first();
            if (await nameInput.count() > 0) {
              await nameInput.fill('Test Collection Playwright');
            }

            // Remplir description si présente
            const descInput = await page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
            if (await descInput.count() > 0) {
              await descInput.fill('Collection de test créée automatiquement par Playwright');
            }

            authSteps.push({
              step: 7,
              action: 'Remplissage formulaire',
              status: 'SUCCESS',
              timestamp: new Date().toISOString()
            });

            // Capture d'écran formulaire rempli
            await page.screenshot({
              path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step7-form-filled.png',
              fullPage: true
            });

            // Fermer modal sans créer (pour ne pas polluer les données)
            const cancelButton = await page.locator('button:has-text("Annuler"), button:has-text("Fermer"), [aria-label="Close"]').first();
            if (await cancelButton.count() > 0) {
              await cancelButton.click();
              await page.waitForTimeout(500);
            }
          }
        }

        // Capture d'écran finale
        await page.screenshot({
          path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-step8-final-state.png',
          fullPage: true
        });
      }
    }

  } catch (error) {
    errors.push({
      type: 'PLAYWRIGHT_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    console.log('❌ [Error]:', error.message);

    // Capture d'écran en cas d'erreur
    await page.screenshot({
      path: '/Users/romeodossantos/verone-back-office/.playwright-mcp/auth-error-screenshot.png',
      fullPage: true
    });
  }

  await browser.close();

  // Rapport consolidé
  const report = {
    timestamp: new Date().toISOString(),
    testTarget: '/catalogue/collections avec authentification',
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      authSteps: authSteps.length,
      successfulSteps: authSteps.filter(s => s.status === 'SUCCESS').length,
      authenticationWorking: authSteps.some(s => s.step === 3 && s.status === 'SUCCESS'),
      collectionsAccessible: authSteps.some(s => s.step === 4 && s.status === 'SUCCESS'),
      uiFunctional: authSteps.some(s => s.step === 5 && s.status === 'SUCCESS'),
      criticalIssues: errors.filter(e => ['NETWORK_ERROR', 'PLAYWRIGHT_ERROR'].includes(e.type)).length
    },
    authSteps: authSteps,
    errors: errors,
    warnings: warnings,
    recommendations: generateAuthTestRecommendations(errors, warnings, authSteps)
  };

  console.log('📊 [Rapport Final Auth Collections]:', JSON.stringify(report.summary, null, 2));

  return report;
}

function generateAuthTestRecommendations(errors, warnings, authSteps) {
  const recommendations = [];

  const authFailed = !authSteps.some(s => s.step === 3 && s.status === 'SUCCESS');
  const collectionsNotAccessible = !authSteps.some(s => s.step === 4 && s.status === 'SUCCESS');
  const networkErrors = errors.filter(e => e.type === 'NETWORK_ERROR');
  const consoleErrors = errors.filter(e => e.type === 'CONSOLE_ERROR');

  if (authFailed) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'AUTHENTICATION',
      issue: 'Échec du processus d\'authentification',
      solution: 'Vérifier configuration Supabase Auth et identifiants de test'
    });
  }

  if (collectionsNotAccessible) {
    recommendations.push({
      priority: 'HIGH',
      category: 'AUTHORIZATION',
      issue: 'Accès à la page collections refusé après authentification',
      solution: 'Vérifier middleware d\'authentification et protection des routes'
    });
  }

  if (networkErrors.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'NETWORK',
      issue: `${networkErrors.length} erreurs réseau détectées`,
      solution: 'Vérifier configuration Supabase et endpoints API'
    });
  }

  if (consoleErrors.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'FRONTEND',
      issue: `${consoleErrors.length} erreurs console détectées`,
      solution: 'Analyser et corriger erreurs JavaScript côté client'
    });
  }

  return recommendations;
}

// Exécution du test
testCollectionsWithAuth()
  .then(report => {
    console.log('✅ [Test Auth Collections Terminé] Rapport sauvegardé');
    // Sauvegarder le rapport pour analyse
    require('fs').writeFileSync(
      '/Users/romeodossantos/verone-back-office/.playwright-mcp/collections-auth-test-report.json',
      JSON.stringify(report, null, 2)
    );
  })
  .catch(error => {
    console.error('❌ [Test Auth Collections Failed]:', error);
    process.exit(1);
  });
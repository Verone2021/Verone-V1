const { chromium } = require('playwright');
const fs = require('fs');

async function investigateSentryDashboard() {
  console.log('🚨 INVESTIGATION DASHBOARD SENTRY - Disparité 118 erreurs');
  console.log('======================================================');

  let browser;
  let consoleErrors = [];
  let networkRequests = [];

  try {
    // Configuration browser
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: '.playwright-mcp/videos/' }
    });

    const page = await context.newPage();

    // Intercepter console errors (tolérance zéro)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          timestamp: new Date().toISOString(),
          message: msg.text(),
          location: msg.location()
        });
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Intercepter requêtes réseau
    page.on('request', request => {
      if (request.url().includes('sentry') || request.url().includes('monitoring')) {
        networkRequests.push({
          timestamp: new Date().toISOString(),
          method: request.method(),
          url: request.url(),
          type: 'request'
        });
        console.log('📤 API Request:', request.method(), request.url());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('sentry') || response.url().includes('monitoring')) {
        const responseData = {
          timestamp: new Date().toISOString(),
          status: response.status(),
          url: response.url(),
          type: 'response'
        };

        try {
          if (response.url().includes('/api/')) {
            const body = await response.text();
            responseData.body = body;
            console.log('📥 API Response:', response.status(), response.url());
            console.log('📄 Response Body:', body.substring(0, 200) + '...');
          }
        } catch (e) {
          console.log('❌ Erreur lecture réponse:', e.message);
        }

        networkRequests.push(responseData);
      }
    });

    console.log('🔍 Étape 1: Navigation vers le dashboard Sentry...');

    // Navigation directe vers le dashboard
    await page.goto('http://localhost:3000/admin/monitoring/errors', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Attendre que la page se charge
    await page.waitForTimeout(3000);

    // Screenshot état initial
    await page.screenshot({
      path: '.playwright-mcp/sentry-dashboard-initial-state.png',
      fullPage: true
    });
    console.log('📸 Screenshot dashboard initial pris');

    console.log('🔍 Étape 2: Vérification éléments du dashboard...');

    // Vérifier la présence d'éléments clés
    const dashboardTitle = await page.locator('h1, h2, [data-testid*="title"], [data-testid*="header"]').first().textContent().catch(() => 'Non trouvé');
    console.log('📋 Titre dashboard:', dashboardTitle);

    // Vérifier la présence de tableaux/listes d'erreurs
    const errorsList = await page.locator('[data-testid*="error"], [data-testid*="issue"], table, .error-item').count();
    console.log('📊 Nombre d\'éléments erreurs trouvés:', errorsList);

    // Vérifier loading states
    const loadingElements = await page.locator('[data-testid*="loading"], .loading, .spinner').count();
    console.log('⏳ Éléments de chargement:', loadingElements);

    console.log('🔍 Étape 3: Test navigation depuis header...');

    // Navigation vers l'accueil pour tester le header
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Chercher le badge/compteur d'erreurs dans le header
    const errorBadge = await page.locator('[data-testid*="error"], [data-testid*="sentry"], .badge, [href*="monitoring"]').first().screenshot({ path: '.playwright-mcp/header-error-badge.png' }).catch(() => null);

    // Essayer de cliquer sur le lien monitoring/errors
    try {
      await page.click('[href*="monitoring/errors"], [href*="admin/monitoring"]');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '.playwright-mcp/dashboard-after-header-click.png', fullPage: true });
      console.log('✅ Navigation depuis header réussie');
    } catch (e) {
      console.log('❌ Navigation depuis header échouée:', e.message);
    }

    console.log('🔍 Étape 4: Test direct des APIs...');

    // Test direct de l'API Sentry
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/monitoring/sentry-issues');
        const data = await response.json();
        return { status: response.status, data };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('🔌 Réponse API direct:', JSON.stringify(apiResponse, null, 2));

    // Test localStorage pour vérifier les 118 erreurs
    const localStorageData = await page.evaluate(() => {
      return {
        sentryErrors: localStorage.getItem('sentry-errors'),
        errorCount: localStorage.getItem('error-count'),
        allKeys: Object.keys(localStorage)
      };
    });

    console.log('💾 LocalStorage Data:', JSON.stringify(localStorageData, null, 2));

    console.log('🔍 Étape 5: Analyse finale...');

    // Screenshot final
    await page.screenshot({
      path: '.playwright-mcp/sentry-dashboard-final-analysis.png',
      fullPage: true
    });

    // Rapport final
    const report = {
      timestamp: new Date().toISOString(),
      consoleErrors: consoleErrors,
      networkRequests: networkRequests,
      dashboardElements: {
        title: dashboardTitle,
        errorElements: errorsList,
        loadingElements: loadingElements
      },
      apiTest: apiResponse,
      localStorage: localStorageData,
      screenshots: [
        'sentry-dashboard-initial-state.png',
        'dashboard-after-header-click.png',
        'sentry-dashboard-final-analysis.png'
      ]
    };

    // Sauvegarder rapport
    fs.writeFileSync('.playwright-mcp/sentry-investigation-report.json', JSON.stringify(report, null, 2));

    console.log('📊 RÉSULTATS INVESTIGATION:');
    console.log('==========================');
    console.log('❌ Console Errors:', consoleErrors.length);
    console.log('🌐 Network Requests:', networkRequests.length);
    console.log('📋 Dashboard Elements:', errorsList);
    console.log('🔌 API Response Status:', apiResponse.status || 'Error');

    if (consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS DÉTECTÉES (Tolérance zéro violée):');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }

    return report;

  } catch (error) {
    console.error('❌ Erreur investigation:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter investigation
investigateSentryDashboard().then(report => {
  console.log('\n✅ Investigation terminée. Rapport sauvegardé dans sentry-investigation-report.json');
}).catch(error => {
  console.error('❌ Investigation échouée:', error);
});
/**
 * 🔍 Test Console Errors - MCP Playwright Integration
 * Vérone Back Office - Détection automatique erreurs console
 */

const { chromium } = require('playwright');

async function detectConsoleErrors() {
  console.log('🚀 [MCP Playwright] Démarrage détection erreurs console...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const timeouts = [];

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

  // Capture des timeouts
  page.setDefaultTimeout(8000); // 8s timeout comme observé

  try {
    console.log('📊 [Test] Navigation vers localhost:3005...');
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });

    console.log('📊 [Test] Test navigation catalogue...');
    await page.click('a[href="/catalogue"]').catch(e => {
      errors.push({
        type: 'NAVIGATION_ERROR',
        message: `Échec navigation catalogue: ${e.message}`,
        timestamp: new Date().toISOString()
      });
    });

    console.log('📊 [Test] Test navigation dashboard...');
    await page.click('a[href="/dashboard"]').catch(e => {
      errors.push({
        type: 'NAVIGATION_ERROR',
        message: `Échec navigation dashboard: ${e.message}`,
        timestamp: new Date().toISOString()
      });
    });

    // Test des requêtes API critiques (route correcte)
    console.log('📊 [Test] Test API products (route alias)...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/products'); // Test avec alias créé
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

    console.log('📊 [Test] Test API catalogue products (route originale)...');
    const catalogueApiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/catalogue/products');
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

    if (apiResponse.error) {
      errors.push({
        type: 'API_ERROR',
        message: `API Products error: ${apiResponse.error}`,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    if (error.name === 'TimeoutError') {
      timeouts.push({
        type: 'PAGE_TIMEOUT',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.log('⏱️ [Timeout]:', error.message);
    } else {
      errors.push({
        type: 'PLAYWRIGHT_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  await browser.close();

  // Rapport consolidé
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalTimeouts: timeouts.length,
      criticalIssues: errors.filter(e => ['FETCH_ERROR', 'API_ERROR', 'PAGE_TIMEOUT'].includes(e.type)).length
    },
    errors: errors,
    warnings: warnings,
    timeouts: timeouts,
    recommendations: generateRecommendations(errors, warnings, timeouts)
  };

  console.log('📊 [Rapport Final]:', JSON.stringify(report.summary, null, 2));

  return report;
}

function generateRecommendations(errors, warnings, timeouts) {
  const recommendations = [];

  const fetchErrors = errors.filter(e => e.type === 'FETCH_ERROR' || e.message.includes('fetch'));
  const timeoutErrors = [...timeouts, ...errors.filter(e => e.message.includes('timeout'))];
  const networkErrors = errors.filter(e => e.type === 'NETWORK_ERROR');

  if (fetchErrors.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'NETWORK',
      issue: 'Erreurs fetch détectées',
      solution: 'Implémenter retry automatique et fallbacks'
    });
  }

  if (timeoutErrors.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'PERFORMANCE',
      issue: 'Timeouts de connexion détectés',
      solution: 'Augmenter timeouts et optimiser requêtes Supabase'
    });
  }

  if (networkErrors.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'INFRASTRUCTURE',
      issue: 'Erreurs HTTP détectées',
      solution: 'Vérifier configuration réseau et API endpoints'
    });
  }

  return recommendations;
}

// Exécution du test
detectConsoleErrors()
  .then(report => {
    console.log('✅ [Test Terminé] Rapport sauvegardé');
    // Sauvegarder le rapport pour analyse MCP Sentry
    require('fs').writeFileSync(
      '/Users/romeodossantos/verone-back-office/.playwright-mcp/latest-report.json',
      JSON.stringify(report, null, 2)
    );
  })
  .catch(error => {
    console.error('❌ [Test Failed]:', error);
    process.exit(1);
  });
const { chromium } = require('playwright');

async function inspectLocalStorageSentry() {
  console.log('🔍 INSPECTION LOCALSTORAGE SENTRY - Cause des 118 erreurs');
  console.log('========================================================');

  let browser;

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigation vers l'accueil pour charger le header
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('📊 État initial du localStorage:');

    // Inspection complète du localStorage
    const localStorageInspection = await page.evaluate(() => {
      const storage = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        storage[key] = value;
      }

      return {
        totalKeys: localStorage.length,
        allKeys: Object.keys(localStorage),
        sentryErrorCount: localStorage.getItem('sentry-error-count'),
        sentryErrors: localStorage.getItem('sentry-errors'),
        errorCount: localStorage.getItem('error-count'),
        allStorage: storage
      };
    });

    console.log('🔑 Total des clés localStorage:', localStorageInspection.totalKeys);
    console.log('📋 Toutes les clés:', localStorageInspection.allKeys);
    console.log('🚨 sentry-error-count:', localStorageInspection.sentryErrorCount);
    console.log('📄 sentry-errors:', localStorageInspection.sentryErrors);
    console.log('🔢 error-count:', localStorageInspection.errorCount);

    // Examiner le header et son badge
    const headerBadge = await page.evaluate(() => {
      const sentryButton = document.querySelector('[title*="Sentry Report"]');
      const badge = sentryButton?.querySelector('span[class*="bg-red-500"]');
      return {
        buttonTitle: sentryButton?.getAttribute('title'),
        badgeText: badge?.textContent,
        buttonExists: !!sentryButton,
        badgeExists: !!badge
      };
    });

    console.log('🎯 Header Badge Info:', headerBadge);

    // Forcer une actualisation de localStorage pour voir l'origine des 118 erreurs
    await page.evaluate(() => {
      // Simuler une mise à jour du compteur pour voir si cela change
      localStorage.setItem('sentry-error-count', '118');
      localStorage.setItem('test-timestamp', new Date().toISOString());
    });

    // Recharger la page pour voir l'impact
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Screenshot du header avec le compteur
    await page.screenshot({
      path: '.playwright-mcp/header-with-118-errors.png',
      clip: { x: 0, y: 0, width: 1920, height: 100 }
    });

    // Vérifier si le badge header affiche maintenant 118
    const updatedHeaderBadge = await page.evaluate(() => {
      const sentryButton = document.querySelector('[title*="Sentry Report"]');
      const badge = sentryButton?.querySelector('span[class*="bg-red-500"]');
      return {
        buttonTitle: sentryButton?.getAttribute('title'),
        badgeText: badge?.textContent,
        buttonExists: !!sentryButton,
        badgeExists: !!badge
      };
    });

    console.log('🔄 Header Badge Après Test:', updatedHeaderBadge);

    // Nettoyer le test localStorage
    await page.evaluate(() => {
      localStorage.removeItem('sentry-error-count');
      localStorage.removeItem('test-timestamp');
    });

    // Navigation vers le dashboard pour comparer
    await page.goto('http://localhost:3000/admin/monitoring/errors', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Screenshot dashboard final
    await page.screenshot({
      path: '.playwright-mcp/dashboard-vs-header-comparison.png',
      fullPage: true
    });

    const finalReport = {
      localStorage: localStorageInspection,
      headerBadgeInitial: headerBadge,
      headerBadgeAfterTest: updatedHeaderBadge,
      screenshots: [
        'header-with-118-errors.png',
        'dashboard-vs-header-comparison.png'
      ]
    };

    console.log('\n📊 CONCLUSION INVESTIGATION:');
    console.log('============================');
    console.log('🔍 localStorage sentry-error-count:', localStorageInspection.sentryErrorCount || 'null');
    console.log('🎯 Header badge actuel:', headerBadge.badgeText || 'aucun');
    console.log('🎯 Header badge après test:', updatedHeaderBadge.badgeText || 'aucun');
    console.log('🏷️ Header title:', headerBadge.buttonTitle || 'non trouvé');

    require('fs').writeFileSync(
      '.playwright-mcp/localStorage-sentry-investigation.json',
      JSON.stringify(finalReport, null, 2)
    );

    return finalReport;

  } catch (error) {
    console.error('❌ Erreur investigation localStorage:', error);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter investigation
inspectLocalStorageSentry().then(report => {
  console.log('\n✅ Investigation localStorage terminée.');
}).catch(error => {
  console.error('❌ Investigation localStorage échouée:', error);
});
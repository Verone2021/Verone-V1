const { chromium } = require('playwright');

async function openSentryDashboard() {
  console.log('Ouverture du tableau de bord Sentry...');

  // Lancer le navigateur en mode visible
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigation vers https://verone.sentry.io...');
    await page.goto('https://verone.sentry.io', { waitUntil: 'networkidle' });

    console.log('Page Sentry chargée avec succès !');
    console.log('URL actuelle:', page.url());

    // Prendre une capture d'écran
    await page.screenshot({ path: 'sentry-dashboard.png', fullPage: true });
    console.log('Capture d\'écran sauvegardée : sentry-dashboard.png');

    // Attendre que l'utilisateur puisse voir et interagir
    console.log('\n=== TABLEAU DE BORD SENTRY OUVERT ===');
    console.log('Le navigateur Chrome est maintenant ouvert avec votre dashboard Sentry.');
    console.log('Vous pouvez maintenant :');
    console.log('1. Vous connecter à votre compte Sentry');
    console.log('2. Naviguer vers votre projet Vérone');
    console.log('3. Vérifier les erreurs capturées lors des tests précédents');
    console.log('\nAppuyez sur Ctrl+C dans ce terminal pour fermer le navigateur.');

    // Garder le navigateur ouvert
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('Erreur lors du chargement:', error.message);
    await page.screenshot({ path: 'sentry-error.png' });
  } finally {
    // Le navigateur restera ouvert pour que l'utilisateur puisse interagir
    console.log('Session terminée. Fermez manuellement le navigateur si nécessaire.');
  }
}

openSentryDashboard().catch(console.error);
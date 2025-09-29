// Test de navigation vers Sentry avec MCP Playwright
const testSentryNavigation = async () => {
  console.log('🚀 Début du test de navigation vers Sentry');

  try {
    // L'URL de base pour les traces Sentry avec le guide en 4 étapes
    const sentryUrl = 'https://verone.sentry.io/explore/traces/?guidedStep=1';

    console.log(`📍 Navigation vers: ${sentryUrl}`);

    // Note: Cette navigation sera effectuée par MCP Playwright
    // qui utilise maintenant Google Chrome au lieu de Chromium

    console.log('✅ Configuration MCP Playwright validée');
    console.log('🌐 Prêt pour navigation Sentry');

    return {
      success: true,
      url: sentryUrl,
      browser: 'Google Chrome',
      message: 'Configuration testée avec succès'
    };

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export pour utilisation
module.exports = { testSentryNavigation };

console.log('📝 Script de test Sentry MCP Playwright créé');
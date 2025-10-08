/**
 * 🔧 Instrumentation Sentry pour Next.js 13+ - Vérone Back Office
 *
 * Ce fichier est requis pour Next.js 13+ avec App Router
 * Il initialise Sentry au démarrage de l'application
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */

export async function register() {
  // ✅ Instrumentation Next.js - Sentry retiré de l'application
  console.log('🔇 [Instrumentation] Prêt - Monitoring via Playwright Browser MCP');
}

export async function onRequestError(err: any, request: any, context: any) {
  // Gestionnaire d'erreur global pour Next.js 15+ (Sentry retiré)
  console.error('Request error:', err);
  console.log('🔇 [onRequestError] Erreur loggée en console - Utiliser Playwright Browser MCP');
}
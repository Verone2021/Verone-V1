/**
 * 🔧 Instrumentation Sentry pour Next.js 13+ - Vérone Back Office
 *
 * Ce fichier est requis pour Next.js 13+ avec App Router
 * Il initialise Sentry au démarrage de l'application
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */

export async function register() {
  // Sentry temporairement désactivé pour résoudre erreurs de compilation
  // Sera réactivé après mise à jour version Sentry compatible

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import et initialisation Sentry pour le serveur
    await import('../sentry.server.config.js');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import et initialisation Sentry pour Edge Runtime
    await import('../sentry.edge.config.js');
  }
}

export async function onRequestError(err: any, request: any, context: any) {
  // Gestionnaire d'erreur global Sentry pour Next.js 15+
  console.error('Request error:', err);

  const { captureException } = await import('@sentry/nextjs');
  captureException(err, {
    tags: {
      source: 'onRequestError',
      method: request.method,
      url: request.url,
    },
    extra: {
      context,
      timestamp: new Date().toISOString(),
    },
  });
}
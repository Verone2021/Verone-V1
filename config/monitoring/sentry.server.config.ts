/**
 * 🛡️ Configuration Sentry Server - Vérone Back Office
 *
 * Configuration Sentry pour Node.js (côté serveur)
 * Monitoring des erreurs serveur et API routes
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Échantillonnage des transactions de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Désactive le debug en production
  debug: process.env.NODE_ENV === 'development',

  // Configuration pour Next.js
  beforeSend(event) {
    // Filtrer les erreurs non critiques en production
    if (process.env.NODE_ENV === 'production') {
      // Ignorer certaines erreurs communes
      if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
        return null
      }
    }

    return event
  },

  // Tags par défaut
  initialScope: {
    tags: {
      component: 'server',
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    },
  },

  // Intégrations
  integrations: [
    Sentry.prismaIntegration(),
    // httpIntegration retiré - pas disponible dans cette version
  ],

  // Capture des erreurs non gérées
  captureUnhandledRejections: true,
  captureUncaughtExceptions: true,
})
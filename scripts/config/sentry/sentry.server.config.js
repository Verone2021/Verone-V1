/**
 * 🛡️ Configuration Sentry Server - Vérone Back Office
 *
 * Configuration Sentry pour Node.js (côté serveur)
 * Conforme à la documentation officielle Sentry.io
 * Fichier recommandé : sentry.server.config.js
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 🔧 Release version - OBLIGATOIRE pour sessions Sentry
  release: process.env.SENTRY_RELEASE || `verone-back-office@${process.env.npm_package_version || '1.0.0'}`,

  // 🌍 Environment - Améliore le tracking
  environment: process.env.NODE_ENV || 'development',

  // Échantillonnage des transactions de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug en développement pour tests
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

  // Intégrations serveur
  integrations: [
    Sentry.prismaIntegration(),
  ],

  // Capture des erreurs non gérées
  captureUnhandledRejections: true,
  captureUncaughtExceptions: true,
})
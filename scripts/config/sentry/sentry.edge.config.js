/**
 * ⚡ Configuration Sentry Edge Runtime - Vérone Back Office
 *
 * Configuration Sentry pour Edge Runtime (middlewares, edge functions)
 * Conforme à la documentation officielle Sentry.io
 * Fichier recommandé : sentry.edge.config.js
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 🔧 Release version - OBLIGATOIRE pour sessions Sentry
  release: process.env.SENTRY_RELEASE || `verone-back-office@${process.env.npm_package_version || '1.0.0'}`,

  // 🌍 Environment - Améliore le tracking
  environment: process.env.NODE_ENV || 'development',

  // Échantillonnage réduit pour Edge (performance)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

  // Désactive le debug en production
  debug: process.env.NODE_ENV === 'development',

  // Configuration allégée pour Edge Runtime
  beforeSend(event) {
    // Filtrage minimal pour Edge (contraintes mémoire)
    if (process.env.NODE_ENV === 'production') {
      // Ignorer les erreurs réseau communes
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null
      }
    }

    return event
  },

  // Tags spécifiques Edge Runtime
  initialScope: {
    tags: {
      component: 'edge',
      runtime: 'edge',
      environment: process.env.NODE_ENV,
    },
  },

  // Intégrations minimales pour Edge
  integrations: [
    // Edge Runtime - intégrations par défaut suffisantes
  ],

  // Configuration Edge Runtime
  autoSessionTracking: false, // Désactivé pour Edge
  sendDefaultPii: false, // Sécurité renforcée
})
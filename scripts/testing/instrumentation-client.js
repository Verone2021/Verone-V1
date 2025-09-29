/**
 * 🛡️ Configuration Sentry Client - Vérone Back Office
 *
 * Configuration Sentry pour le navigateur (côté client)
 * Conforme à la documentation officielle Sentry.io
 * Fichier recommandé : instrumentation-client.js
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Échantillonnage des transactions de performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug en développement
  debug: process.env.NODE_ENV === 'development',

  // Replay sessions pour debug (uniquement en développement)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Configuration pour Next.js
  beforeSend(event) {
    // En développement, on log tout pour les tests
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [Sentry Client] Envoi événement:', event.message || event.exception?.values?.[0]?.value)
      return event
    }

    // Filtrer les erreurs non critiques en production
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null
    }

    return event
  },

  // Tags par défaut
  initialScope: {
    tags: {
      component: 'client',
      environment: process.env.NODE_ENV,
    },
  },

  // Intégrations côté client - selon documentation officielle Sentry
  integrations: [
    // Browser Tracing Integration (recommandé par la doc officielle)
    Sentry.browserTracingIntegration(),

    // Session Replay
    Sentry.replayIntegration({
      // Masquer les données sensibles
      maskAllText: true,
      blockAllMedia: true,
    }),

    // Feedback utilisateur
    Sentry.feedbackIntegration({
      // Configuration du feedback utilisateur
      colorScheme: 'system',
    }),
  ],

  // Capture des erreurs
  beforeBreadcrumb(breadcrumb) {
    // Enrichir les breadcrumbs avec plus de contexte
    if (breadcrumb.category === 'fetch') {
      console.log('🌐 [Sentry Client] Requête réseau:', breadcrumb.data?.url)
    }
    return breadcrumb
  },
})
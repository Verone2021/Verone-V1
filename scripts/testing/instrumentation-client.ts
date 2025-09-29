/**
 * 🌐 Configuration Sentry Client - Vérone Back Office
 *
 * Configuration Sentry pour le navigateur (côté client)
 * Monitoring des erreurs React, hooks et interactions utilisateur
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Échantillonnage optimisé pour production (réduction 50% bande passante)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Désactive le debug en production
  debug: process.env.NODE_ENV === 'development',

  // Configuration spécifique client
  beforeSend(event) {
    // Filtrer les erreurs non critiques côté client
    if (process.env.NODE_ENV === 'production') {
      // Ignorer les erreurs communes de navigation
      const errorType = event.exception?.values?.[0]?.type
      if (errorType === 'ChunkLoadError' || errorType === 'ResizeObserver') {
        return null
      }

      // Ignorer les erreurs de connexion réseau temporaires
      if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
        return null
      }
    }

    return event
  },

  // Tags par défaut côté client
  initialScope: {
    tags: {
      component: 'client',
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
  },

  // Intégrations côté client
  integrations: [
    Sentry.browserTracingIntegration({
      // Traçage des interactions utilisateur
      enableInp: true,
      enableUserInteractionTracing: true,

      // Exclure les requêtes internes
      shouldCreateSpanForRequest: (url) => {
        return !url.startsWith('/_next') &&
               !url.includes('hot-update') &&
               !url.includes('sentry.io')
      },
    }),

    // Capture des replays en cas d'erreur (production)
    ...(process.env.NODE_ENV === 'production' ? [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        sessionSampleRate: 0.05,
        errorSampleRate: 1.0,
      })
    ] : []),
  ],

  // Configuration performance côté client
  enableTracing: true,

  // Capture des erreurs non gérées
  captureUnhandledRejections: true,

  // Capture des erreurs React
  attachStacktrace: true,

  // Configuration PII (données personnelles)
  sendDefaultPii: false,

  // Filtrage des URLs sensibles
  beforeSendTransaction(event) {
    // Filtrer les transactions non importantes
    if (event.transaction?.includes('/_next/')) {
      return null
    }

    return event
  },

  // Configuration pour les composants React
  beforeBreadcrumb(breadcrumb) {
    // Filtrer les breadcrumbs non utiles
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null
    }

    return breadcrumb
  },
})

// ✅ NOUVEAUTÉ : Initialisation auto-détection côté client
if (typeof window !== 'undefined') {
  // Import dynamique pour éviter les erreurs SSR
  import('./src/lib/error-detection/sentry-auto-detection').then(({ initializeAutoDetection, SentryErrorAnalyzer }) => {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAutoDetection)
    } else {
      initializeAutoDetection()
    }

    // Exposer l'analyzer sur window pour debug (développement uniquement)
    if (process.env.NODE_ENV === 'development') {
      ;(window as any).SentryAnalyzer = SentryErrorAnalyzer
      console.log('🔍 [Debug] SentryAnalyzer disponible sur window.SentryAnalyzer')
    }
  }).catch(err => {
    console.warn('⚠️ [Sentry] Impossible d\'initialiser l\'auto-détection:', err)
  })
}
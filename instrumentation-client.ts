/**
 * 🚀 Instrumentation Client Sentry - Vérone Back Office 2024
 *
 * Configuration client Sentry selon Next.js 15 recommendations
 * Format officiel: instrumentation-client.ts (remplace sentry.client.config.js)
 * Capture 100% erreurs: JavaScript, console, React, navigation, fetch
 */

import * as Sentry from '@sentry/nextjs'

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // This runs on the server
    return
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // This runs on the edge runtime
    return
  }

  // This runs on the client
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 🔧 Configuration release et environment - OBLIGATOIRES
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    environment: process.env.NODE_ENV || 'development',

    // 📊 Échantillonnage performance optimisé
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 🎯 Échantillonnage Session Replay (nouveau 2024)
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    // 🐛 Debug détaillé en développement
    debug: process.env.NODE_ENV === 'development',

    // 🔒 Sécurité et vie privée
    sendDefaultPii: process.env.NODE_ENV === 'development',

    // 🎨 Tags par défaut
    initialScope: {
      tags: {
        component: 'client',
        runtime: 'browser',
        framework: 'nextjs',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      },
    },

    // 🚀 Intégrations essentielles Next.js 2024
    integrations: [
      // ✅ Capture erreurs globales JavaScript
      Sentry.globalHandlersIntegration({
        onunhandledrejection: true,
        onerror: true,
      }),

      // ✅ Navigation tracking Next.js App Router
      Sentry.browserTracingIntegration({
        enableLongTask: true,
        enableInp: true, // Interaction to Next Paint
      }),

      // ✅ Session Replay pour debug visuel (NOUVEAU 2024)
      Sentry.replayIntegration({
        maskAllText: process.env.NODE_ENV === 'production',
        blockAllMedia: process.env.NODE_ENV === 'production',
      }),

      // ✅ Capture erreurs HTTP/fetch
      Sentry.httpClientIntegration({
        failedRequestStatusCodes: [400, 599],
        failedRequestTargets: [/.*/], // Capture toutes les requêtes échouées
      }),

      // ✅ Context et stack traces détaillés
      Sentry.contextLinesIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.rewriteFramesIntegration(),

      // ✅ Breadcrumbs détaillés
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        sentry: true,
        xhr: true,
      }),
    ],

    // 🎯 Fonction de filtrage intelligente
    beforeSend(event, hint) {
      // 🐛 En développement: log détaillé + aucun filtrage
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 [Sentry Client] Erreur capturée')
        console.log('Event:', event)
        console.log('Type:', event.exception?.values?.[0]?.type)
        console.log('Message:', event.message || event.exception?.values?.[0]?.value)
        console.log('Level:', event.level)
        console.log('Timestamp:', new Date().toISOString())
        console.groupEnd()

        // En dev: capturer TOUTES les erreurs sans exception
        return event
      }

      // 🏭 En production: filtrage intelligent
      const errorType = event.exception?.values?.[0]?.type
      const errorValue = event.exception?.values?.[0]?.value || ''
      const filename = event.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename || ''

      // Ignorer erreurs extensions navigateur
      if (filename.includes('extension://') || filename.includes('moz-extension://')) {
        return null
      }

      // Ignorer erreurs réseau communes en production
      if (errorType && ['ChunkLoadError', 'NetworkError', 'TypeError'].includes(errorType) &&
          errorValue.includes('Loading chunk')) {
        return null
      }

      // Capturer tout le reste
      return event
    },

    // 🎯 Configuration échantillonnage traces spécifique
    tracesSampler(samplingContext) {
      const { transactionContext } = samplingContext

      // Pages critiques: échantillonnage maximal
      if (transactionContext.name?.includes('/catalogue') ||
          transactionContext.name?.includes('/dashboard')) {
        return 1.0
      }

      // API routes: échantillonnage réduit
      if (transactionContext.name?.includes('/api/')) {
        return 0.1
      }

      // Défaut selon environment
      return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
  })

  // 🛠️ Extensions client pour capture console + helpers test
  if (typeof window !== 'undefined') {
    // 🎯 Override console.error pour capture automatique
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Capturer dans Sentry avec contexte détaillé
      Sentry.withScope((scope) => {
        scope.setTag('source', 'console.error')
        scope.setLevel('error')
        scope.addBreadcrumb({
          message: `Console Error: ${args.join(' ')}`,
          level: 'error',
          category: 'console',
        })

        Sentry.captureMessage(`Console Error: ${args.join(' ')}`, 'error')
      })

      // Mettre à jour compteur dashboard
      try {
        const currentCount = parseInt(localStorage.getItem('sentry-error-count') || '0')
        const newCount = currentCount + 1
        localStorage.setItem('sentry-error-count', newCount.toString())

        // Event pour hook useSentryUnified
        window.dispatchEvent(new CustomEvent('sentry-error-detected', {
          detail: {
            count: newCount,
            type: 'console.error',
            timestamp: new Date().toISOString()
          }
        }))
      } catch (e) {
        // Silent fail
      }

      // Appel console.error original
      originalConsoleError.apply(console, args)
    }

    // 🧪 Helpers de test Sentry (disponibles dans console navigateur)
    (window as any).testSentry = (message = 'Test Sentry depuis console') => {
      Sentry.captureMessage(message, 'error')
      console.log('✅ Message test envoyé à Sentry:', message)
    }

    (window as any).testSentryError = () => {
      throw new Error('Test: Erreur JavaScript non gérée')
    }

    (window as any).testSentryWithContext = () => {
      Sentry.withScope((scope) => {
        scope.setTag('test', 'true')
        scope.setLevel('warning')
        scope.setContext('test_context', {
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })

        Sentry.captureMessage('Test Sentry avec contexte détaillé', 'warning')
      })
    }

    // 🎯 Capture automatique erreurs unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason)
    })

    console.log('🚀 [Sentry Client] Instrumentation activée - Capture 100% erreurs client')
  }
}
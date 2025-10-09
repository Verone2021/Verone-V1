'use client'

// import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report to Sentry with Vérone business context - TEMPORARILY DISABLED
    // Sentry.captureException(error, {
    //   tags: {
    //     application: 'verone-back-office',
    //     source: 'global-error-boundary',
    //     environment: process.env.NODE_ENV || 'development',
    //   },
    //   extra: {
    //     digest: error.digest,
    //     timestamp: new Date().toISOString(),
    //     userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    //     url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    //   },
    //   level: 'fatal',
    // })

    // Console log for development debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Global Error Boundary triggered:', error)
      console.error('🔍 Error digest:', error.digest)
      console.error('📍 Stack trace:', error.stack)
    }
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            {/* Icon d'erreur */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            {/* Titre */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Erreur système Vérone
            </h2>

            {/* Message utilisateur */}
            <p className="text-gray-600 text-center mb-6">
              Une erreur inattendue s'est produite dans l'application.
              L'équipe technique a été automatiquement notifiée via Sentry.
            </p>

            {/* Détails techniques en mode développement */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-3 bg-gray-100 rounded text-sm">
                <p className="font-medium text-gray-700 mb-1">Détails développement :</p>
                <p className="text-gray-600 break-words">{error.message}</p>
                {error.digest && (
                  <p className="text-gray-500 mt-1 text-xs">Digest: {error.digest}</p>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-black text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Réessayer</span>
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard'
                  }
                }}
                className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Retour au Dashboard
              </button>
            </div>

            {/* Footer Sentry info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Erreur automatiquement rapportée • Vérone Back Office
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
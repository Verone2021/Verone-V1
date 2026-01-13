'use client';

import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Envoyer l'erreur a Sentry
    Sentry.captureException(error);

    // Console log for development and production debugging
    console.error('Global Error Boundary triggered:', error);
    console.error('Error digest:', error.digest);
    console.error('Stack trace:', error.stack);
  }, [error]);

  // WORKAROUND Next.js 15 Build Issue (2025-10-17)
  // Suppression temporaire html/body tags pour résoudre erreur prerendering /404
  // Next.js docs indiquent que global-error.tsx devrait avoir html/body,
  // mais cela cause "Html should not be imported outside pages/_document" en build
  return (
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
          Une erreur inattendue s'est produite dans l'application. Veuillez
          réessayer ou contacter l'équipe technique.
        </p>

        {/* Détails techniques en mode développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-gray-100 rounded text-sm">
            <p className="font-medium text-gray-700 mb-1">
              Détails développement :
            </p>
            <p className="text-gray-600 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-gray-500 mt-1 text-xs">
                Digest: {error.digest}
              </p>
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
                window.location.href = '/dashboard';
              }
            }}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Retour au Dashboard
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Vérone Back Office • Phase 1
          </p>
        </div>
      </div>
    </div>
  );
}

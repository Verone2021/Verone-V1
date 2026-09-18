'use client';

/**
 * Filet de securite de la racine de l'application.
 *
 * Il manquait. Dans l'App Router, un `error.tsx` n'attrape PAS les erreurs
 * jetees par le `layout.tsx` de son propre segment : il n'enveloppe que les
 * enfants de ce layout. Une erreur de `(protected)/layout.tsx` traversait donc
 * `(protected)/error.tsx` et tombait dans `global-error.tsx`, qui demonte
 * l'application entiere — l'utilisateur voyait « Erreur systeme Verone » et
 * « Reessayer » rejouait exactement le meme rendu serveur, donc le meme
 * plantage : plus aucun moyen d'entrer (rapporte le 17/09 par des
 * collaborateurs sous Chrome / Windows).
 *
 * Ce fichier est la frontiere manquante au-dessus de `(protected)`. Il offre
 * deux sorties reelles : rejouer le rendu, ou repartir de la connexion.
 */

import { useEffect } from 'react';

import { AlertCircle, LogIn, RotateCcw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[back-office] Root error boundary:', error);
    if (error.digest) console.error('[back-office] Digest:', error.digest);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          L&apos;application n&apos;a pas pu s&apos;afficher
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Le service a rencontre un probleme passager. Reessayez : dans la
          plupart des cas, cela repart tout de suite. Si l&apos;ecran revient,
          reconnectez-vous.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-gray-100 rounded text-sm">
            <p className="font-medium text-gray-700 mb-1">
              Details developpement :
            </p>
            <p className="text-gray-600 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-gray-500 mt-1 text-xs">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-black text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reessayer</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Se reconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

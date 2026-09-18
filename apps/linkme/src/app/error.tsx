'use client';

/**
 * Filet de securite de la racine — LinkMe.
 *
 * Il manquait : seul `global-error.tsx` existait, et celui-la demonte TOUTE
 * l'application, contexte d'authentification compris. « Reessayer » y rejoue le
 * meme rendu, donc le meme plantage : l'affilie se retrouve enferme, sans autre
 * issue que de fermer l'onglet.
 *
 * Ce fichier attrape l'erreur AVANT ce point de non-retour : la session tient,
 * la navigation reste en place, et il y a deux vraies sorties.
 *
 * Meme correction que celle posee sur le back-office le 18/09, apres l'incident
 * ou des collaborateurs sont restes bloques sur « Erreur systeme Verone ».
 * [BO-AUTH-SESSION-002]
 */

import { useEffect } from 'react';

import posthog from 'posthog-js';

import {
  reportErrorToPosthog,
  shouldInitPosthog,
} from '@/lib/observability/posthog';

export default function LinkMeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[linkme] Error boundary:', error);
    if (shouldInitPosthog()) {
      reportErrorToPosthog(posthog, error, { source: 'linkme-error' });
    }
    if (error.digest) console.error('[linkme] Digest:', error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-7 w-7 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
          Cette page n&apos;a pas pu s&apos;afficher
        </h2>

        <p className="mb-6 text-center text-gray-600">
          Le service a rencontré un problème passager. Réessayez : dans la
          plupart des cas, cela repart tout de suite.
        </p>

        {error.digest !== undefined && error.digest !== '' && (
          <div className="mb-6 rounded-md bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
            Code technique :{' '}
            <span className="font-mono text-gray-700">{error.digest}</span>
            <br />
            Communiquez ce code au support.
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded bg-gray-100 p-3 text-sm">
            <p className="mb-1 font-medium text-gray-700">
              Détails développement :
            </p>
            <p className="break-words text-gray-600">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-gray-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-white transition-colors hover:bg-gray-800"
          >
            Réessayer
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-200"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    </div>
  );
}

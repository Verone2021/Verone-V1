'use client';

/**
 * Filet de securite — boutique Verone.
 *
 * Le site n'en avait AUCUN : la moindre erreur envoyait un client sur la page
 * d'erreur brute de Next, sans un mot en francais ni le moindre moyen de
 * revenir a la boutique. Sur une page publique, cela se traduit directement en
 * panier abandonne.
 *
 * Deux sorties reelles, et un ton qui ne fait pas peur : un incident passager
 * n'est pas une faute du visiteur.
 * [BO-AUTH-SESSION-002]
 */

import { useEffect } from 'react';

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[site-internet] Error boundary:', error);
    if (error.digest) console.error('[site-internet] Digest:', error.digest);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-400">
          Vérone
        </p>

        <h1 className="mb-4 text-2xl font-light text-neutral-900 sm:text-3xl">
          Cette page n&apos;a pas pu s&apos;afficher
        </h1>

        <p className="mb-8 text-neutral-600">
          Un incident passager, de notre côté. Réessayez : le plus souvent, tout
          revient immédiatement.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 rounded bg-neutral-100 p-3 text-left text-sm">
            <p className="mb-1 font-medium text-neutral-700">
              Détails développement :
            </p>
            <p className="break-words text-neutral-600">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-neutral-500">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="w-full rounded-full bg-neutral-900 px-6 py-3 text-white transition-colors hover:bg-neutral-700 sm:w-auto"
          >
            Réessayer
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            className="w-full rounded-full border border-neutral-300 px-6 py-3 text-neutral-900 transition-colors hover:bg-neutral-100 sm:w-auto"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    </main>
  );
}

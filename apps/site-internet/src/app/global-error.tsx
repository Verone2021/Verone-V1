'use client';

/**
 * Dernier filet — boutique Verone.
 *
 * Ne se declenche que si l'erreur vient de la mise en page racine elle-meme :
 * `error.tsx` ne peut pas l'attraper (un `error.tsx` n'attrape pas les erreurs
 * du `layout.tsx` de son propre segment). Sans ce fichier, le visiteur voyait
 * la page d'erreur brute de Next, en anglais.
 * [BO-AUTH-SESSION-002]
 */

import { useEffect } from 'react';

export default function SiteGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[site-internet] Global error:', error);
    if (error.digest) console.error('[site-internet] Digest:', error.digest);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
          <div className="w-full max-w-md text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-neutral-400">
              Vérone
            </p>

            <h1 className="mb-4 text-2xl font-light text-neutral-900 sm:text-3xl">
              La boutique est momentanément indisponible
            </h1>

            <p className="mb-8 text-neutral-600">
              Nous rencontrons un incident passager. Merci de réessayer dans un
              instant.
            </p>

            <button
              onClick={reset}
              className="w-full rounded-full bg-neutral-900 px-6 py-3 text-white transition-colors hover:bg-neutral-700 sm:w-auto"
            >
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

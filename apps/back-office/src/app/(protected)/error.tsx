'use client';

/**
 * Filet de securite du back-office connecte.
 *
 * Chaque module a deja son `error.tsx` (consultations, produits, commandes…),
 * mais rien ne couvrait le layout `(protected)` lui-meme : une erreur a ce
 * niveau traversait jusqu'a `global-error.tsx`, qui demonte TOUTE l'application
 * — contexte d'authentification compris. L'utilisateur voyait "Erreur systeme
 * Verone" et devait se reconnecter (rapporte par Romeo le 17/09).
 *
 * Avec ce fichier, l'erreur reste contenue : la session est conservee, la
 * navigation reste en place, et "Reessayer" rejoue le rendu.
 */

import { ModuleErrorBoundary } from '@/components/errors/ModuleErrorBoundary';

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ModuleErrorBoundary error={error} reset={reset} moduleName="Back-office" />
  );
}

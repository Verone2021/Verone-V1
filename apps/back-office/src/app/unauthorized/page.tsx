/**
 * Page Unauthorized - Accès Non Autorisé
 *
 * Affichée quand un utilisateur authentifié Supabase n'a pas de rôle back-office
 * dans user_app_roles (ex: utilisateur LinkMe qui tente d'accéder au back-office).
 *
 * @since 2026-02-10 - Cross-app protection pattern
 */

'use client';

import { AlertCircle } from 'lucide-react';

import { Button } from '@verone/ui';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Accès non autorisé
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vous n&apos;avez pas de compte Back-Office Vérone.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Si vous avez un compte LinkMe, veuillez vous connecter sur{' '}
            <span className="font-medium">linkme.verone.fr</span>
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => {
              window.location.href = 'https://linkme.verone.fr';
            }}
            className="w-full"
          >
            Accéder à LinkMe
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/login';
            }}
            variant="outline"
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}

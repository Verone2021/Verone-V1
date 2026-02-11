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
            Accès refusé
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ce compte n&apos;a pas accès à cette application.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez
            votre administrateur.
          </p>
        </div>

        <div>
          <Button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="w-full"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}

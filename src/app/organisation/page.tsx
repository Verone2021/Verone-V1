'use client';

/**
 * 🔀 Redirection /organisation → /contacts-organisations
 *
 * Cette page redirige automatiquement vers /contacts-organisations
 * pour éviter duplication code et confusion utilisateur.
 *
 * Route canonique : /contacts-organisations
 * Route alias : /organisation (sidebar)
 *
 * Dernière mise à jour : 2025-10-23 (Stabilisation Phase 1)
 */

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

export default function OrganisationPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers route canonique
    router.replace('/contacts-organisations');
  }, [router]);

  // Loader pendant redirection
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirection...</p>
      </div>
    </div>
  );
}

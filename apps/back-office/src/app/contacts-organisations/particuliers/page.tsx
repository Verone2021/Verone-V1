'use client';

/**
 * Page Clients Particuliers (B2C)
 *
 * Redirige vers la page customers avec le filtre type=individual
 * pour afficher uniquement les clients particuliers.
 */

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';

export default function ParticuliersPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page customers avec le filtre type=individual
    router.replace('/contacts-organisations/customers?type=individual');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">
          Redirection vers les clients particuliers...
        </p>
      </div>
    </div>
  );
}

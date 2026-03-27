'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loader2 } from 'lucide-react';

/**
 * Page organisation LinkMe → Redirection vers la page organisation generale.
 *
 * Pas de page doublon : la page detail organisation existe deja dans
 * /contacts-organisations/[id] (redirect → /contacts-organisations/customers/[id]).
 * On redirige avec returnUrl pour permettre le retour dans le contexte LinkMe.
 */
export default function OrganisationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    const returnUrl = encodeURIComponent('/canaux-vente/linkme/organisations');
    router.replace(`/contacts-organisations/${id}?returnUrl=${returnUrl}`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

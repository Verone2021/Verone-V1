'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loader2 } from 'lucide-react';

/**
 * Page enseigne LinkMe → Redirection vers la page enseigne generale.
 *
 * Pas de page doublon : la page detail enseigne existe deja dans
 * /contacts-organisations/enseignes/[id].
 * On redirige avec returnUrl pour permettre le retour dans le contexte LinkMe.
 */
export default function EnseigneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    const returnUrl = encodeURIComponent('/canaux-vente/linkme/enseignes');
    router.replace(
      `/contacts-organisations/enseignes/${id}?returnUrl=${returnUrl}`
    );
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

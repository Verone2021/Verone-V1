'use client';

/**
 * Redirect: /ma-selection/[id]/produits -> /ma-selection/[id]
 * Les produits sont maintenant affiches directement sur la page principale.
 *
 * @module SelectionProductsRedirect
 * @since 2026-03
 */

import { useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';

export default function SelectionProductsRedirect(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const selectionId = params.id as string;

  useEffect(() => {
    router.replace(`/ma-selection/${selectionId}`);
  }, [selectionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin" />
    </div>
  );
}

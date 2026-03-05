'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Comptabilite deplacee vers /finance/documents (hub cartes).
 */
export default function ComptabiliteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/documents');
  }, [router]);
  return null;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Annexe deplacee vers /finance/documents/annexe
 */
export default function AnnexeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/documents/annexe');
  }, [router]);
  return null;
}

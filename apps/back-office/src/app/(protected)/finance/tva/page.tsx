'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * TVA deplacee vers /finance/documents/tva
 */
export default function TvaRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/documents/tva');
  }, [router]);
  return null;
}

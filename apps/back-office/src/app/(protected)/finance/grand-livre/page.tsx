'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Grand Livre deplace vers /finance/documents/grand-livre
 */
export default function GrandLivreRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/documents/grand-livre');
  }, [router]);
  return null;
}

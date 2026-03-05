'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Bilan deplace vers /finance/documents/bilan
 */
export default function BilanRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/documents/bilan');
  }, [router]);
  return null;
}

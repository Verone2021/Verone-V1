'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page obsolete - redirige vers la page Transactions unifiee
 * Les fonctionnalites justificatifs sont integrees dans /finance/transactions
 */
export default function JustificatifsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/transactions');
  }, [router]);
  return null;
}

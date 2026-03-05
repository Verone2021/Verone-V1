'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page obsolete - redirige vers la page Transactions unifiee
 * Les fonctionnalites rapprochement sont integrees dans /finance/transactions
 */
export default function RapprochementPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/transactions');
  }, [router]);
  return null;
}

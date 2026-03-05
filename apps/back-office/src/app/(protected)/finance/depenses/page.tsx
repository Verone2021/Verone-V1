'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Depenses fusionnees dans Transactions (/finance/transactions).
 * La page /finance/depenses/regles reste accessible.
 */
export default function DepensesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance/transactions');
  }, [router]);
  return null;
}

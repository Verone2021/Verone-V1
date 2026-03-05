'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Tresorerie fusionnee dans le Pilotage (/finance).
 */
export default function TresorerieRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finance');
  }, [router]);
  return null;
}

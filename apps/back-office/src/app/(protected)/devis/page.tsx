'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevisPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/factures?tab=devis');
  }, [router]);

  return null;
}

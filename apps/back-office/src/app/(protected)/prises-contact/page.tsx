'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrisesContactRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messages?onglet=formulaires');
  }, [router]);

  return null;
}

'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

export default function AideLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element | null {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !user) {
      router.push('/login');
    }
  }, [user, initializing, router]);

  if (initializing || !user) {
    return null;
  }

  return <>{children}</>;
}

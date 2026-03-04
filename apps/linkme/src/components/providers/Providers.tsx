'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from '../../contexts/AuthContext';
import { cleanupLegacyCookies } from '../../lib/cleanup-legacy-cookies';
import { CartDrawer } from '../cart/CartDrawer';
import { CartProvider } from '../cart/CartProvider';
import { LinkmeActivityTrackerProvider } from './LinkmeActivityTrackerProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Cleanup cookies obsolètes au mount (une seule fois)
  useEffect(() => {
    cleanupLegacyCookies();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <LinkmeActivityTrackerProvider>
            {children}
          </LinkmeActivityTrackerProvider>
          <CartDrawer />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

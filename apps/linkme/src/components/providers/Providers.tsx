'use client';

import { useState, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from '../../contexts/AuthContext';
import { SentryUserContext } from '../SentryUserContext';
import { CartDrawer } from '../cart/CartDrawer';
import { CartProvider } from '../cart/CartProvider';

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SentryUserContext>
          <CartProvider>
            {children}
            <CartDrawer />
            <Toaster position="top-right" richColors />
          </CartProvider>
        </SentryUserContext>
      </AuthProvider>
    </QueryClientProvider>
  );
}

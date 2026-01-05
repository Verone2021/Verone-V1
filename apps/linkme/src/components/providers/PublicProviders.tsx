'use client';

import { useState, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface PublicProvidersProps {
  children: ReactNode;
}

/**
 * Providers simplifies pour les pages publiques (white-label)
 * - QueryClientProvider uniquement (pour les hooks React Query)
 * - PAS de AuthProvider (pas d'authentification sur pages publiques)
 * - PAS de CartProvider (le panier est gere localement dans la page)
 */
export function PublicProviders({
  children,
}: PublicProvidersProps): React.ReactElement {
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

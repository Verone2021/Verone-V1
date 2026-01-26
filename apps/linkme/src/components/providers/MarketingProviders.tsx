'use client';

/**
 * Providers minimaux pour les pages marketing
 *
 * Inclut uniquement QueryClientProvider pour les composants
 * qui utilisent react-query (stats, marketplace, etc.)
 *
 * N'inclut PAS AuthProvider/CartProvider car les pages marketing
 * doivent rester publiques et statiques.
 *
 * @module MarketingProviders
 * @since 2026-01-23
 */

import { useState, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface MarketingProvidersProps {
  children: ReactNode;
}

export function MarketingProviders({
  children,
}: MarketingProvidersProps): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (pages marketing peuvent être cachées plus longtemps)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

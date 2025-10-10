/**
 * 🔄 React Query Provider - Vérone
 * Configuration globale TanStack Query (React Query) pour l'application
 * Pattern SSR-safe compatible Next.js 15
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

interface ReactQueryProviderProps {
  children: React.ReactNode
}

/**
 * Provider React Query avec configuration optimisée
 *
 * Configuration:
 * - staleTime: 60s (données considérées fraîches)
 * - cacheTime: 5min (données gardées en cache)
 * - retry: 1 (1 seule tentative en cas d'erreur)
 * - refetchOnWindowFocus: false (pas de refetch auto au focus)
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Créer une instance unique par composant (pattern recommandé Next.js)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Données fraîches pendant 60 secondes
            staleTime: 60 * 1000,
            // Cache pendant 5 minutes
            gcTime: 5 * 60 * 1000,
            // 1 seule retry en cas d'erreur
            retry: 1,
            // Pas de refetch automatique au focus
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

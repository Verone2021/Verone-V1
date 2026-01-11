/**
 * Hook: useCurrentUser
 *
 * Centralise l'accès à l'utilisateur authentifié avec cache React Query.
 * Évite les appels multiples à auth/v1/user par page (8× → 1×).
 *
 * Usage:
 * ```tsx
 * const { user, isLoading, error, refetch } = useCurrentUser();
 * if (user) {
 *   console.log('Authenticated as:', user.email);
 * }
 * ```
 */

'use client';

import { useMemo, useEffect } from 'react';

import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CurrentUserResult {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// QUERY KEY - Stable pour le cache global
// ============================================================================

export const CURRENT_USER_QUERY_KEY = ['auth', 'currentUser'] as const;

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook centralisé pour accéder à l'utilisateur authentifié.
 *
 * Avantages:
 * - Cache React Query (staleTime: 5 minutes)
 * - Déduplication automatique des appels
 * - Synchronisation avec onAuthStateChange
 * - Type-safe avec User de Supabase
 */
export function useCurrentUser(): CurrentUserResult {
  // ✅ FIX: useMemo garantit createClient() appelé une seule fois
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  // Query pour récupérer l'utilisateur (avec cache long)
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        // Session expirée ou non authentifié - pas une erreur critique
        if (error.message?.includes('session') || error.status === 401) {
          return null;
        }
        throw error;
      }

      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - l'user change rarement
    gcTime: 10 * 60 * 1000, // 10 minutes de cache
    refetchOnWindowFocus: false, // Pas de refetch agressif
    refetchOnReconnect: false,
    retry: false, // Pas de retry pour auth (évite spam en cas d'erreur)
  });

  // ✅ Synchroniser le cache avec les changements d'auth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Mettre à jour le cache React Query
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const refetch = async () => {
    await refetchQuery();
  };

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error: error,
    refetch,
  };
}

// ============================================================================
// HELPER: Récupérer l'user ID synchrone depuis le cache
// ============================================================================

/**
 * Récupère l'ID de l'utilisateur depuis le cache React Query.
 * Utile pour les mutations qui ont besoin de l'ID sans refetch.
 *
 * @returns L'ID de l'utilisateur ou null si non authentifié
 */
export function useCurrentUserId(): string | null {
  const { user } = useCurrentUser();
  return user?.id ?? null;
}

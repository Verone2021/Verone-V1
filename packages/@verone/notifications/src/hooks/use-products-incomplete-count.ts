/**
 * Hook Products Incomplete Count - Vérone Back Office
 * Compte les produits catalogue avec fiches incomplètes (description manquante).
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet) + Realtime sur products (filtre product_status=active) avec anti-rebond 2 s.
 * Pas de polling fallback — CHANNEL_ERROR → warn silencieux.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';

import { useDebouncedInvalidate } from './use-debounce-invalidate';

export interface ProductsIncompleteCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const PRODUCTS_INCOMPLETE_QUERY_KEY = ['products', 'incomplete_count'] as const;

/**
 * Hook pour compter les produits catalogue incomplets (description vide ou null).
 *
 * @param options.enableRealtime  @deprecated ignoré — comportement géré via Realtime products
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useProductsIncompleteCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): ProductsIncompleteCountHook {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    data = 0,
    isPending,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: PRODUCTS_INCOMPLETE_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('product_status', 'active')
        .or('description.is.null,description.eq.');

      if (countError) {
        console.error('[useProductsIncompleteCount] Count error:', countError);
        throw new Error(countError.message);
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const triggerInvalidate = useDebouncedInvalidate(
    PRODUCTS_INCOMPLETE_QUERY_KEY
  );

  useEffect(() => {
    channelRef.current = supabase
      .channel('products-incomplete-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'product_status=eq.active',
        },
        triggerInvalidate
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useProductsIncompleteCount] Realtime unavailable');
        }
      });

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [supabase, triggerInvalidate]);

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: PRODUCTS_INCOMPLETE_QUERY_KEY,
    });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: error ?? null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}

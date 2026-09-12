/**
 * Hook Orders Pending Count - Vérone Back Office
 * Compte les commandes clients en brouillon.
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet) + Realtime sur sales_orders avec anti-rebond 2 s.
 * Pas de polling fallback — CHANNEL_ERROR → warn silencieux.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';

import { useDebouncedInvalidate } from './use-debounce-invalidate';

export interface OrdersPendingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const ORDERS_PENDING_QUERY_KEY = ['sales_orders', 'pending_count'] as const;

/**
 * Hook pour compter les commandes en attente de traitement (status draft).
 *
 * @param options.enableRealtime  @deprecated ignoré — comportement géré via Realtime sales_orders
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useOrdersPendingCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): OrdersPendingCountHook {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    data = 0,
    isPending,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ORDERS_PENDING_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count: totalCount, error: countError } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft');

      if (countError) {
        console.error('[useOrdersPendingCount] Count error:', countError);
        throw new Error(countError.message);
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const triggerInvalidate = useDebouncedInvalidate(ORDERS_PENDING_QUERY_KEY);

  useEffect(() => {
    channelRef.current = supabase
      .channel('orders-pending-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_orders' },
        triggerInvalidate
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useOrdersPendingCount] Realtime unavailable');
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
    await queryClient.invalidateQueries({ queryKey: ORDERS_PENDING_QUERY_KEY });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: error ?? null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}

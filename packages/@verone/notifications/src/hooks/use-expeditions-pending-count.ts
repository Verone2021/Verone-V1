/**
 * Hook Expeditions Pending Count - Vérone Back Office
 * Compte les expéditions en attente (validated + partially_shipped).
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

export interface ExpeditionsPendingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const EXPEDITIONS_PENDING_QUERY_KEY = [
  'sales_orders',
  'expeditions_pending_count',
] as const;

/**
 * Hook pour compter les expéditions en attente (validated ou partially_shipped).
 *
 * @param options.enableRealtime  @deprecated ignoré — comportement géré via Realtime sales_orders
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useExpeditionsPendingCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): ExpeditionsPendingCountHook {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    data = 0,
    isPending,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: EXPEDITIONS_PENDING_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count: totalCount, error: countError } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['validated', 'partially_shipped']);

      if (countError) {
        console.error('[useExpeditionsPendingCount] Count error:', countError);
        throw new Error(countError.message);
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const triggerInvalidate = useDebouncedInvalidate(
    EXPEDITIONS_PENDING_QUERY_KEY
  );

  useEffect(() => {
    channelRef.current = supabase
      .channel('expeditions-pending-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_orders' },
        triggerInvalidate
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useExpeditionsPendingCount] Realtime unavailable');
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
      queryKey: EXPEDITIONS_PENDING_QUERY_KEY,
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

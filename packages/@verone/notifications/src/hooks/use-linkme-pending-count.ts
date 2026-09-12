/**
 * Hook LinkMe Pending Count - Vérone Back Office
 * Compte les commandes LinkMe nécessitant une action (draft + validated).
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet) + Realtime sur sales_orders (filtre channel_id) avec anti-rebond 2 s.
 * Pas de polling fallback — CHANNEL_ERROR → warn silencieux.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@verone/utils/supabase/client';

import { useDebouncedInvalidate } from './use-debounce-invalidate';

export interface LinkmePendingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

// Channel ID LinkMe constant
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

const LINKME_PENDING_QUERY_KEY = [
  'sales_orders',
  'linkme_pending_count',
] as const;

/**
 * Compte les commandes LinkMe actionnables (draft : à valider, validated : à préparer).
 * Utilise linkme_orders_enriched pour performance optimale.
 *
 * @param options.enableRealtime  @deprecated ignoré — comportement géré via Realtime sales_orders
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useLinkmePendingCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): LinkmePendingCountHook {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    data = 0,
    isPending,
    dataUpdatedAt,
  } = useQuery({
    queryKey: LINKME_PENDING_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      // Note: linkme_orders_enriched est une vue, cast nécessaire
      const { count: totalCount, error: countError } = await supabase
        .from('linkme_orders_enriched' as 'sales_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'validated']);

      if (countError) {
        console.error('[useLinkmePendingCount] Count error:', countError);
        return 0;
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const triggerInvalidate = useDebouncedInvalidate(LINKME_PENDING_QUERY_KEY);

  // Realtime sur sales_orders (table source, pas la vue linkme_orders_enriched)
  useEffect(() => {
    channelRef.current = supabase
      .channel('linkme-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_orders',
          filter: `channel_id=eq.${LINKME_CHANNEL_ID}`,
        },
        triggerInvalidate
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useLinkmePendingCount] Realtime unavailable');
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
      queryKey: LINKME_PENDING_QUERY_KEY,
    });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}

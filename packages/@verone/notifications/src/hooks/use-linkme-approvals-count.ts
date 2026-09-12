/**
 * Hook LinkMe Approvals Count - Vérone Back Office
 * Compte les commandes LinkMe en brouillon (nécessitant approbation).
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

export interface LinkmeApprovalsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

const LINKME_APPROVALS_QUERY_KEY = [
  'sales_orders',
  'linkme_approvals_count',
] as const;

/**
 * Hook pour compter les commandes LinkMe en attente d'approbation (status draft).
 *
 * @param options.enableRealtime  @deprecated ignoré — comportement géré via Realtime sales_orders
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useLinkmeApprovalsCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): LinkmeApprovalsCountHook {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    data = 0,
    isPending,
    dataUpdatedAt,
  } = useQuery({
    queryKey: LINKME_APPROVALS_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count: totalCount, error: countError } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', LINKME_CHANNEL_ID)
        .eq('status', 'draft');

      if (countError) {
        console.error('[useLinkmeApprovalsCount] Count error:', countError);
        return 0;
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const triggerInvalidate = useDebouncedInvalidate(LINKME_APPROVALS_QUERY_KEY);

  useEffect(() => {
    channelRef.current = supabase
      .channel('linkme-approvals-changes')
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
          console.warn('[useLinkmeApprovalsCount] Realtime unavailable');
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
      queryKey: LINKME_APPROVALS_QUERY_KEY,
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

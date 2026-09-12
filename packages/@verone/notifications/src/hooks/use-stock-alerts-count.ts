/**
 * Hook Stock Alerts Count - Vérone Back Office
 * Compte les alertes stock actives via le RPC get_stock_alerts_count().
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet). stock_alerts_unified_view n'est pas publiée dans Supabase Realtime
 * → pas d'abonnement, pas de polling.
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export interface StockAlertsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const STOCK_ALERTS_QUERY_KEY = ['stock_alerts', 'count'] as const;

/**
 * Hook pour compter les alertes stock actives.
 * Utilise le RPC get_stock_alerts_count() pour performance optimale.
 *
 * @param options.enableRealtime  @deprecated ignoré — stock_alerts_unified_view non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useStockAlertsCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): StockAlertsCountHook {
  const queryClient = useQueryClient();

  const {
    data = 0,
    isPending,
    dataUpdatedAt,
  } = useQuery({
    queryKey: STOCK_ALERTS_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_stock_alerts_count'
      );

      if (rpcError) {
        console.error('[useStockAlertsCount] RPC error:', rpcError);
        return 0;
      }
      return (rpcData as number | null) ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: STOCK_ALERTS_QUERY_KEY });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}

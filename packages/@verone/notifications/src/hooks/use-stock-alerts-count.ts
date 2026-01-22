/**
 * Hook Stock Alerts Count - Vérone Back Office
 * Compte les alertes stock actives en temps réel via Supabase Realtime
 *
 * Utilise:
 * - RPC: get_stock_alerts_count() (migration 20260113)
 * - Vue: stock_alerts_unified_view
 * - Realtime: Supabase subscriptions sur vue
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface StockAlertsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les alertes stock en temps réel
 *
 * Utilise le RPC get_stock_alerts_count() pour performance optimale
 * Supabase Realtime pour updates automatiques quand stock_alerts_unified_view change
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 30000 = 30s)
 * @returns {StockAlertsCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function StockBadge() {
 *   const { count, loading } = useStockAlertsCount();
 *   return <Badge variant="urgent">{count}</Badge>;
 * }
 * ```
 */
export function useStockAlertsCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): StockAlertsCountHook {
  const { enableRealtime = true, refetchInterval = 30000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count via RPC get_stock_alerts_count()
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_stock_alerts_count'
      );

      if (rpcError) {
        throw new Error(`RPC error: ${rpcError.message}`);
      }

      setCount(data || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useStockAlertsCount] Error:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Setup Supabase Realtime subscription
   */
  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Setup Realtime si activé
    if (enableRealtime) {
      // Créer channel Realtime sur stock_alerts_unified_view
      // Note: Vue publique, pas besoin de RLS pour SELECT
      channelRef.current = supabase
        .channel('stock-alerts-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'stock_alerts_unified_view',
          },
          payload => {
            console.log(
              '[useStockAlertsCount] Realtime change detected:',
              payload
            );
            // Refetch count après changement
            fetchCount();
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[useStockAlertsCount] Realtime subscribed ✓');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useStockAlertsCount] Realtime error');
            setError(new Error('Realtime subscription failed'));
          }
        });
    }

    // Polling fallback (si Realtime désactivé ou échec)
    if (!enableRealtime || refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchCount();
      }, refetchInterval);
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [supabase, enableRealtime, refetchInterval, fetchCount]);

  return {
    count,
    loading,
    error,
    refetch: fetchCount,
    lastUpdated,
  };
}

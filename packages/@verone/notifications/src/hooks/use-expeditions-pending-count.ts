/**
 * Hook Expeditions Pending Count - Vérone Back Office
 * Compte les expéditions en attente (commandes prêtes à expédier)
 *
 * Utilise:
 * - Table: sales_orders avec sales_order_items
 * - Critère: status = 'validated' avec items prêts
 * - Realtime: Supabase subscriptions
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ExpeditionsPendingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les expéditions en attente
 *
 * Compte les commandes:
 * - status = 'validated' ou 'partially_shipped'
 * - Avec au moins un item non encore expédié
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 30000)
 * @returns {ExpeditionsPendingCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function ExpeditionsBadge() {
 *   const { count, loading } = useExpeditionsPendingCount();
 *   return count > 0 ? <Badge variant="info">{count}</Badge> : null;
 * }
 * ```
 */
export function useExpeditionsPendingCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): ExpeditionsPendingCountHook {
  const { enableRealtime = true, refetchInterval = 30000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count des expéditions en attente
   * Commandes validées avec items non expédiés
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query commandes validées ou partiellement expédiées
      // qui ont encore des items à expédier
      const { count: totalCount, error: countError } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['validated', 'partially_shipped']);

      if (countError) {
        throw new Error(`Count error: ${countError.message}`);
      }

      setCount(totalCount || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useExpeditionsPendingCount] Error:', errorObj);
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
      channelRef.current = supabase
        .channel('expeditions-pending-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales_orders',
          },
          payload => {
            const newRow = payload.new as any;
            const oldRow = payload.old as any;
            const expeditionStatuses = ['validated', 'partially_shipped', 'shipped'];

            // Refetch si changement impacte les statuts d'expédition
            const shouldRefetch =
              payload.eventType === 'INSERT' ||
              payload.eventType === 'DELETE' ||
              (payload.eventType === 'UPDATE' &&
                (expeditionStatuses.includes(newRow?.status) ||
                  expeditionStatuses.includes(oldRow?.status)));

            if (shouldRefetch) {
              console.log(
                '[useExpeditionsPendingCount] Realtime change detected:',
                payload.eventType
              );
              fetchCount();
            }
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[useExpeditionsPendingCount] Realtime subscribed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useExpeditionsPendingCount] Realtime error');
            setError(new Error('Realtime subscription failed'));
          }
        });
    }

    // Polling fallback
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

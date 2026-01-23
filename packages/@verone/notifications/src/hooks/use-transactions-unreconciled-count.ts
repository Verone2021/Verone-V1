/**
 * Hook Transactions Unreconciled Count - Vérone Back Office
 * Compte les transactions bancaires non rapprochées
 *
 * Utilise:
 * - Table: bank_transactions
 * - Critère: reconciliation_status = 'pending' ou NULL
 * - Realtime: Supabase subscriptions
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TransactionsUnreconciledCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les transactions bancaires non rapprochées
 *
 * Compte les transactions où:
 * - reconciliation_status = 'pending'
 * - reconciliation_status IS NULL
 * - is_reconciled = false
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 60000)
 * @returns {TransactionsUnreconciledCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function TransactionsBadge() {
 *   const { count, loading } = useTransactionsUnreconciledCount();
 *   return count > 0 ? <Badge variant="warning">{count}</Badge> : null;
 * }
 * ```
 */
export function useTransactionsUnreconciledCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): TransactionsUnreconciledCountHook {
  const { enableRealtime = true, refetchInterval = 60000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count des transactions non rapprochées
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query transactions non rapprochées
      // matching_status = 'unmatched' (ENUM remplace is_reconciled boolean)
      const { count: totalCount, error: countError } = await supabase
        .from('bank_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('matching_status', 'unmatched');

      if (countError) {
        throw new Error(`Count error: ${countError.message}`);
      }

      setCount(totalCount || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useTransactionsUnreconciledCount] Error:', errorObj);
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
        .channel('transactions-unreconciled-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bank_transactions',
          },
          payload => {
            console.log(
              '[useTransactionsUnreconciledCount] Realtime change detected:',
              payload.eventType
            );
            fetchCount();
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[useTransactionsUnreconciledCount] Realtime subscribed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useTransactionsUnreconciledCount] Realtime error');
            setError(new Error('Realtime subscription failed'));
          }
        });
    }

    // Polling fallback (interval plus long pour finance)
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

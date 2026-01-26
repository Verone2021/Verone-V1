/**
 * Hook LinkMe Approvals Count - Vérone Back Office
 * Compte les commandes LinkMe nécessitant approbation
 *
 * Utilise:
 * - Vue: linkme_orders_enriched
 * - Critère: commandes avec marge < seuil ou besoin validation manuelle
 * - Realtime: Supabase subscriptions sur sales_orders
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LinkmeApprovalsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

// Channel ID LinkMe constant
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Hook pour compter les commandes LinkMe en attente d'approbation
 *
 * Une commande nécessite approbation si:
 * - status = 'draft' (nouvelles commandes à valider)
 * - marge_rate < seuil minimum (validation marge requise)
 * - needs_manual_approval = true
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 30000)
 * @returns {LinkmeApprovalsCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function LinkmeApprovalsBadge() {
 *   const { count, loading } = useLinkmeApprovalsCount();
 *   return count > 0 ? <Badge variant="urgent">{count}</Badge> : null;
 * }
 * ```
 */
export function useLinkmeApprovalsCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): LinkmeApprovalsCountHook {
  const { enableRealtime = true, refetchInterval = 30000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count des commandes LinkMe en attente d'approbation
   * Utilise la table sales_orders directement avec filtre channel_id
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query commandes LinkMe en draft (nécessitent approbation/validation)
      const { count: totalCount, error: countError } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', LINKME_CHANNEL_ID)
        .eq('status', 'draft');

      if (countError) {
        console.error('[useLinkmeApprovalsCount] Count error:', countError);
        setError(new Error(`Count error: ${countError.message}`));
        setCount(0); // Valeur par défaut gracieuse
        return; // Sortie anticipée sans exception
      }

      setCount(totalCount || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useLinkmeApprovalsCount] Error:', errorObj);
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
        .channel('linkme-approvals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales_orders',
            filter: `channel_id=eq.${LINKME_CHANNEL_ID}`,
          },
          payload => {
            const newRow = payload.new as any;
            const oldRow = payload.old as any;

            // Refetch si impact sur draft status
            const shouldRefetch =
              payload.eventType === 'INSERT' ||
              payload.eventType === 'DELETE' ||
              (payload.eventType === 'UPDATE' &&
                (newRow?.status === 'draft' || oldRow?.status === 'draft'));

            if (shouldRefetch) {
              console.log(
                '[useLinkmeApprovalsCount] Realtime change detected:',
                payload.eventType
              );
              fetchCount();
            }
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[useLinkmeApprovalsCount] Realtime subscribed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useLinkmeApprovalsCount] Realtime error');
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

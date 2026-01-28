/**
 * Hook Orders Pending Count - Vérone Back Office
 * Compte les commandes clients en brouillon ou attente validation
 *
 * Utilise:
 * - Table: sales_orders
 * - Statuts comptés: 'draft', 'pending_validation'
 * - Realtime: Supabase subscriptions sur sales_orders
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface OrdersPendingCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les commandes en attente de traitement
 *
 * Compte les commandes avec status:
 * - 'draft' (brouillon)
 * - 'pending_validation' (en attente validation)
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 30000)
 * @returns {OrdersPendingCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function OrdersBadge() {
 *   const { count, loading } = useOrdersPendingCount();
 *   return count > 0 ? <Badge variant="warning">{count}</Badge> : null;
 * }
 * ```
 */
export function useOrdersPendingCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): OrdersPendingCountHook {
  const { enableRealtime = true, refetchInterval = 30000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count des commandes en attente
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier authentification avant requête (évite erreur RLS 403)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Pas connecté = pas de count, pas d'erreur
        setCount(0);
        setLoading(false);
        return;
      }

      // Query commandes en brouillon
      // Note: seul 'draft' est un statut valide pour les commandes en attente
      const { count: totalCount, error: countError } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      if (countError) {
        console.error('[useOrdersPendingCount] Count error:', countError);
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
      console.error('[useOrdersPendingCount] Error:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Setup Supabase Realtime subscription (authentification requise)
   */
  useEffect(() => {
    let isMounted = true;

    const setupSubscriptions = async () => {
      // Vérifier authentification avant setup Realtime/polling
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        // Pas connecté = pas de Realtime, juste set count à 0
        setCount(0);
        setLoading(false);
        return;
      }

      // Initial fetch (authentifié)
      fetchCount();

      // Setup Realtime si activé ET authentifié
      if (enableRealtime) {
        channelRef.current = supabase
          .channel('orders-pending-changes')
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

              // Refetch si changement impacte le statut draft
              const shouldRefetch =
                payload.eventType === 'INSERT' ||
                payload.eventType === 'DELETE' ||
                (payload.eventType === 'UPDATE' &&
                  (newRow?.status === 'draft' || oldRow?.status === 'draft'));

              if (shouldRefetch) {
                console.log(
                  '[useOrdersPendingCount] Realtime change detected:',
                  payload.eventType
                );
                fetchCount();
              }
            }
          )
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              console.log('[useOrdersPendingCount] Realtime subscribed');
            } else if (status === 'CHANNEL_ERROR') {
              // Log silencieux, pas setError pour éviter bruit sur page login
              console.warn(
                '[useOrdersPendingCount] Realtime subscription failed'
              );
            }
          });
      }

      // Polling fallback (seulement si authentifié)
      if (!enableRealtime || refetchInterval > 0) {
        intervalRef.current = setInterval(() => {
          fetchCount();
        }, refetchInterval);
      }
    };

    setupSubscriptions();

    // Cleanup
    return () => {
      isMounted = false;
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

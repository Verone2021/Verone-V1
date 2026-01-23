/**
 * Hook Consultations Count - Vérone Back Office
 * Compte les consultations actives (en_attente, en_cours) en temps réel
 *
 * Utilise:
 * - Table: client_consultations
 * - Statuts comptés: 'en_attente', 'en_cours'
 * - Realtime: Supabase subscriptions
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConsultationsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  breakdown?: {
    pending: number; // en_attente
    inProgress: number; // en_cours
  };
}

/**
 * Hook pour compter les consultations actives en temps réel
 *
 * Compte les consultations avec status = 'en_attente' OU 'en_cours'
 * Supabase Realtime pour updates automatiques
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 30000 = 30s)
 * @param options.includeBreakdown - Inclure détail pending/inProgress (default: false)
 * @returns {ConsultationsCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function ConsultationsBadge() {
 *   const { count, breakdown } = useConsultationsCount({ includeBreakdown: true });
 *   return (
 *     <Badge variant={count > 0 ? 'urgent' : 'default'}>
 *       {count}
 *     </Badge>
 *   );
 * }
 * ```
 */
export function useConsultationsCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
  includeBreakdown?: boolean;
}): ConsultationsCountHook {
  const {
    enableRealtime = true,
    refetchInterval = 30000,
    includeBreakdown = false,
  } = options || {};

  const [count, setCount] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<{
    pending: number;
    inProgress: number;
  }>({ pending: 0, inProgress: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count via Supabase query
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query consultations actives (en_attente + en_cours)
      const { count: totalCount, error: countError } = await supabase
        .from('client_consultations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['en_attente', 'en_cours'])
        .is('archived_at', null) // Exclure archivées
        .is('deleted_at', null); // Exclure supprimées

      if (countError) {
        console.error('[useConsultationsCount] Count error:', countError);
        setError(new Error(`Count error: ${countError.message}`));
        setCount(0); // Valeur par défaut gracieuse
        return; // Sortie anticipée sans exception
      }

      setCount(totalCount || 0);

      // Breakdown si demandé
      if (includeBreakdown) {
        const [{ count: pendingCount }, { count: inProgressCount }] =
          await Promise.all([
            supabase
              .from('client_consultations')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'en_attente')
              .is('archived_at', null)
              .is('deleted_at', null),
            supabase
              .from('client_consultations')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'en_cours')
              .is('archived_at', null)
              .is('deleted_at', null),
          ]);

        setBreakdown({
          pending: pendingCount || 0,
          inProgress: inProgressCount || 0,
        });
      }

      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useConsultationsCount] Error:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [supabase, includeBreakdown]);

  /**
   * Setup Supabase Realtime subscription
   */
  useEffect(() => {
    // Initial fetch
    fetchCount();

    // Setup Realtime si activé
    if (enableRealtime) {
      channelRef.current = supabase
        .channel('consultations-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'client_consultations',
          },
          payload => {
            console.log(
              '[useConsultationsCount] Realtime change detected:',
              payload
            );
            // Refetch seulement si changement impact statut actif
            const eventType = payload.eventType;
            const newRow = payload.new as any;
            const oldRow = payload.old as any;

            // Refetch si:
            // - INSERT avec status actif
            // - UPDATE changement status
            // - DELETE (décrémente count)
            const shouldRefetch =
              eventType === 'INSERT' &&
              ['en_attente', 'en_cours'].includes(newRow?.status) ||
              eventType === 'UPDATE' &&
              (newRow?.status !== oldRow?.status ||
                newRow?.archived_at !== oldRow?.archived_at ||
                newRow?.deleted_at !== oldRow?.deleted_at) ||
              eventType === 'DELETE';

            if (shouldRefetch) {
              fetchCount();
            }
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[useConsultationsCount] Realtime subscribed ✓');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useConsultationsCount] Realtime error');
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
    breakdown: includeBreakdown ? breakdown : undefined,
  };
}

/**
 * Hook Form Submissions Count - Vérone Back Office
 * Compte les messages/prises de contact non traités (status = 'new')
 *
 * Utilise:
 * - Table: form_submissions
 * - Filtre: status = 'new' AND deleted_at IS NULL
 * - Realtime: Supabase subscriptions sur form_submissions
 *
 * @author Romeo Dos Santos
 * @date 2026-02-24
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface FormSubmissionsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook pour compter les soumissions de formulaire non traitées
 *
 * Compte les form_submissions avec status = 'new' (messages reçus non lus)
 *
 * @param options.enableRealtime - Activer Supabase Realtime (default: true)
 * @param options.refetchInterval - Intervalle de polling fallback en ms (default: 60000)
 * @returns {FormSubmissionsCountHook} État du hook avec count, loading, error
 *
 * @example
 * ```tsx
 * function MessagesBadge() {
 *   const { count, loading } = useFormSubmissionsCount();
 *   return count > 0 ? <Badge variant="warning">{count}</Badge> : null;
 * }
 * ```
 */
export function useFormSubmissionsCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): FormSubmissionsCountHook {
  const { enableRealtime = true, refetchInterval = 60000 } = options ?? {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch count des soumissions de formulaire non traitées
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

      const { count: totalCount, error: countError } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .is('deleted_at', null);

      if (countError) {
        console.error('[useFormSubmissionsCount] Count error:', countError);
        setError(new Error(`Count error: ${countError.message}`));
        setCount(0);
        return;
      }

      setCount(totalCount ?? 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useFormSubmissionsCount] Error:', errorObj);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        setCount(0);
        setLoading(false);
        return;
      }

      // Initial fetch (authentifié)
      void fetchCount().catch(err => {
        console.error('[useFormSubmissionsCount] Initial fetch failed:', err);
      });

      // Setup Realtime si activé ET authentifié
      if (enableRealtime) {
        channelRef.current = supabase
          .channel('form-submissions-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'form_submissions',
            },
            payload => {
              const newRow = payload.new as Record<string, unknown> | null;
              const oldRow = payload.old as Record<string, unknown> | null;

              const getStatus = (
                row: Record<string, unknown> | null
              ): string | null =>
                row && typeof row.status === 'string' ? row.status : null;

              const newStatus = getStatus(newRow);
              const oldStatus = getStatus(oldRow);

              // Refetch si changement impacte le statut 'new'
              const shouldRefetch =
                payload.eventType === 'INSERT' ||
                payload.eventType === 'DELETE' ||
                (payload.eventType === 'UPDATE' &&
                  (newStatus === 'new' || oldStatus === 'new'));

              if (shouldRefetch) {
                void fetchCount().catch(err => {
                  console.error(
                    '[useFormSubmissionsCount] Realtime refetch failed:',
                    err
                  );
                });
              }
            }
          )
          .subscribe(status => {
            if (status === 'CHANNEL_ERROR') {
              console.warn(
                '[useFormSubmissionsCount] Realtime unavailable - falling back to polling'
              );
              if (!intervalRef.current && refetchInterval > 0) {
                intervalRef.current = setInterval(() => {
                  void fetchCount().catch(console.error);
                }, refetchInterval);
              }
            } else if (status === 'CLOSED') {
              console.warn(
                '[useFormSubmissionsCount] Channel closed, will reconnect on next mount'
              );
            }
          });
      }

      // Polling fallback (seulement si authentifié)
      if (!enableRealtime || refetchInterval > 0) {
        intervalRef.current = setInterval(() => {
          void fetchCount().catch(err => {
            console.error('[useFormSubmissionsCount] Polling failed:', err);
          });
        }, refetchInterval);
      }
    };

    void setupSubscriptions().catch(err => {
      console.error(
        '[useFormSubmissionsCount] Setup subscriptions failed:',
        err
      );
    });

    // Cleanup
    return () => {
      isMounted = false;
      if (channelRef.current) {
        void supabase
          .removeChannel(channelRef.current)
          .then(() => {
            channelRef.current = null;
          })
          .catch(err => {
            console.warn(
              '[useFormSubmissionsCount] Channel cleanup error:',
              err
            );
            channelRef.current = null;
          });
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

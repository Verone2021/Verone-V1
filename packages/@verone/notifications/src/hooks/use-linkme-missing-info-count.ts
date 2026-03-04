'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LinkmeMissingInfoCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Hook pour compter les demandes d'info LinkMe en attente de retour.
 *
 * Compte les enregistrements `linkme_info_requests` qui sont:
 * - sent (sent_at IS NOT NULL)
 * - non completees (completed_at IS NULL)
 * - non annulees (cancelled_at IS NULL)
 * - non expirees (token_expires_at > now())
 */
export function useLinkmeMissingInfoCount(options?: {
  enableRealtime?: boolean;
  refetchInterval?: number;
}): LinkmeMissingInfoCountHook {
  const { enableRealtime = true, refetchInterval = 30000 } = options || {};

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        setLoading(false);
        return;
      }

      // Count pending info requests (sent but not completed/cancelled/expired)
      const { count: totalCount, error: countError } = await supabase
        .from('linkme_info_requests')
        .select('*', { count: 'exact', head: true })
        .not('sent_at', 'is', null)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .gt('token_expires_at', new Date().toISOString());

      if (countError) {
        console.error('[useLinkmeMissingInfoCount] Count error:', countError);
        setError(new Error(`Count error: ${countError.message}`));
        setCount(0);
        return;
      }

      setCount(totalCount || 0);
      setLastUpdated(new Date());
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error('Unknown error fetching count');
      setError(errorObj);
      console.error('[useLinkmeMissingInfoCount] Error:', errorObj);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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

      fetchCount();

      if (enableRealtime) {
        channelRef.current = supabase
          .channel('linkme-info-requests-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'linkme_info_requests',
            },
            () => {
              console.log(
                '[useLinkmeMissingInfoCount] Realtime change detected'
              );
              fetchCount();
            }
          )
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              console.log(
                '[useLinkmeMissingInfoCount] Realtime subscribed \u2713'
              );
            } else if (status === 'CHANNEL_ERROR') {
              console.warn(
                '[useLinkmeMissingInfoCount] Realtime subscription failed'
              );
            }
          });
      }

      if (!enableRealtime || refetchInterval > 0) {
        intervalRef.current = setInterval(() => {
          fetchCount();
        }, refetchInterval);
      }
    };

    void setupSubscriptions().catch(err => {
      console.error('[useLinkmeMissingInfoCount] Setup error:', err);
    });

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

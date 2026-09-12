'use client';

/**
 * Hook LinkmeMissingInfoCount - Vérone Back Office
 * Compte les demandes d'info LinkMe en attente de retour.
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet). linkme_info_requests n'est pas publiée dans Supabase Realtime
 * → pas d'abonnement, pas de polling.
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export interface LinkmeMissingInfoCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const LINKME_MISSING_INFO_QUERY_KEY = [
  'linkme_info_requests',
  'pending_count',
] as const;

/**
 * Compte les enregistrements `linkme_info_requests` qui sont :
 * - envoyés (sent_at IS NOT NULL)
 * - non complétés (completed_at IS NULL)
 * - non annulés (cancelled_at IS NULL)
 * - non expirés (token_expires_at > now())
 *
 * @param options.enableRealtime  @deprecated ignoré — linkme_info_requests non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useLinkmeMissingInfoCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): LinkmeMissingInfoCountHook {
  const queryClient = useQueryClient();

  const {
    data = 0,
    isPending,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: LINKME_MISSING_INFO_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count: totalCount, error: countError } = await supabase
        .from('linkme_info_requests')
        .select('id', { count: 'exact', head: true })
        .not('sent_at', 'is', null)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .gt('token_expires_at', new Date().toISOString());

      if (countError) {
        console.error('[useLinkmeMissingInfoCount] Count error:', countError);
        throw new Error(countError.message);
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: LINKME_MISSING_INFO_QUERY_KEY,
    });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: error ?? null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}

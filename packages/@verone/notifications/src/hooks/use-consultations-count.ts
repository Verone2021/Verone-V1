/**
 * Hook Consultations Count - Vérone Back Office
 * Compte les consultations actives (en_attente, en_cours).
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet). client_consultations n'est pas publiée dans Supabase Realtime
 * → pas d'abonnement, pas de polling.
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export interface ConsultationsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  breakdown?: {
    pending: number;
    inProgress: number;
  };
}

const CONSULTATIONS_COUNT_QUERY_KEY = ['consultations', 'count'] as const;

/**
 * Hook pour compter les consultations actives en temps réel.
 *
 * @param options.enableRealtime  @deprecated ignoré — client_consultations non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 * @param options.includeBreakdown Inclure détail pending/inProgress (default: false)
 */
export function useConsultationsCount(options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
  includeBreakdown?: boolean;
}): ConsultationsCountHook {
  const { includeBreakdown = false } = options ?? {};
  const queryClient = useQueryClient();

  const { data, isPending, dataUpdatedAt } = useQuery({
    queryKey: [...CONSULTATIONS_COUNT_QUERY_KEY, { includeBreakdown }],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { count: 0, breakdown: null };

      const { count: totalCount, error: countError } = await supabase
        .from('client_consultations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['en_attente', 'en_cours'])
        .is('archived_at', null)
        .is('deleted_at', null);

      if (countError) {
        console.error('[useConsultationsCount] Count error:', countError);
        return { count: 0, breakdown: null };
      }

      if (!includeBreakdown) return { count: totalCount ?? 0, breakdown: null };

      const [{ count: pendingCount }, { count: inProgressCount }] =
        await Promise.all([
          supabase
            .from('client_consultations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'en_attente')
            .is('archived_at', null)
            .is('deleted_at', null),
          supabase
            .from('client_consultations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'en_cours')
            .is('archived_at', null)
            .is('deleted_at', null),
        ]);

      return {
        count: totalCount ?? 0,
        breakdown: {
          pending: pendingCount ?? 0,
          inProgress: inProgressCount ?? 0,
        },
      };
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: CONSULTATIONS_COUNT_QUERY_KEY,
    });
  }, [queryClient]);

  return {
    count: data?.count ?? 0,
    loading: isPending,
    error: null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
    breakdown: includeBreakdown ? (data?.breakdown ?? undefined) : undefined,
  };
}

/**
 * Hook Consultations Count - Vérone Back Office
 * Consultations actives (en_attente, en_cours).
 *
 * Le nombre vient de l'appel unique du menu (`get_sidebar_counts`, champ
 * `consultations`) : aucune requête propre. Le détail par statut
 * (`includeBreakdown`) reste optionnel et n'émet ses 2 comptages que s'il est
 * demandé explicitement — aucun écran ne le demande aujourd'hui.
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { MENU_COUNT_QUERY_KEYS } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';

import { useMenuCount } from './use-menu-count';

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

const CONSULTATIONS_COUNT_QUERY_KEY = MENU_COUNT_QUERY_KEYS.consultations;

/**
 * Hook pour compter les consultations actives.
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

  const {
    count,
    loading,
    error,
    lastUpdated,
    refetch: refetchMenuCounts,
  } = useMenuCount('consultations');

  const { data: breakdown } = useQuery({
    queryKey: [...CONSULTATIONS_COUNT_QUERY_KEY, 'breakdown'],
    enabled: includeBreakdown,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { pending: 0, inProgress: 0 };

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
        pending: pendingCount ?? 0,
        inProgress: inProgressCount ?? 0,
      };
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await Promise.all([
      refetchMenuCounts(),
      queryClient.invalidateQueries({
        queryKey: CONSULTATIONS_COUNT_QUERY_KEY,
      }),
    ]);
  }, [queryClient, refetchMenuCounts]);

  return {
    count,
    loading,
    error,
    refetch,
    lastUpdated,
    breakdown: includeBreakdown ? breakdown : undefined,
  };
}

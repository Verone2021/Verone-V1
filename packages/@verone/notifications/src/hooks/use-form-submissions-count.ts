/**
 * Hook Form Submissions Count - Vérone Back Office
 * Compte les messages/prises de contact non traités (status = 'new').
 *
 * Implémentation : TanStack Query (staleTime 5 min, refetch au retour sur
 * l'onglet). form_submissions n'est pas publiée dans Supabase Realtime
 * → pas d'abonnement, pas de polling.
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export interface FormSubmissionsCountHook {
  count: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const FORM_SUBMISSIONS_QUERY_KEY = ['form_submissions', 'new_count'] as const;

/**
 * Hook pour compter les soumissions de formulaire non traitées.
 *
 * @param options.enableRealtime  @deprecated ignoré — form_submissions non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useFormSubmissionsCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): FormSubmissionsCountHook {
  const queryClient = useQueryClient();

  const {
    data = 0,
    isPending,
    dataUpdatedAt,
  } = useQuery({
    queryKey: FORM_SUBMISSIONS_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      // Note: form_submissions has no deleted_at column — filter on status only
      const { count: totalCount, error: countError } = await supabase
        .from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new');

      if (countError) {
        console.error('[useFormSubmissionsCount] Count error:', countError);
        return 0;
      }
      return totalCount ?? 0;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: FORM_SUBMISSIONS_QUERY_KEY,
    });
  }, [queryClient]);

  return {
    count: data,
    loading: isPending,
    error: null,
    refetch,
    lastUpdated: dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null,
  };
}

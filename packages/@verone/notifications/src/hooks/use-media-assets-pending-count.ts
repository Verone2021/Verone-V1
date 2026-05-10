'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Clé de cache TanStack Query pour la file d'attente de validation.
 * Exportée pour permettre l'invalidation depuis la modal d'approbation.
 */
export const MEDIA_ASSETS_PENDING_COUNT_QUERY_KEY = [
  'media_assets',
  'pending_review_count',
] as const;

/**
 * Retourne le nombre de photos en attente de validation (review_status = 'pending_review').
 * Utilisé par la sidebar pour afficher un badge d'alerte sur Marketing > Bibliothèque.
 *
 * Implémentation : TanStack Query avec refetch automatique toutes les 30s.
 * Pour rafraîchissement immédiat après une approbation/rejet, invalider via
 * `queryClient.invalidateQueries({ queryKey: MEDIA_ASSETS_PENDING_COUNT_QUERY_KEY })`.
 */
export function useMediaAssetsPendingCount(): number {
  const { data = 0 } = useQuery({
    queryKey: MEDIA_ASSETS_PENDING_COUNT_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('media_assets')
        .select('id', { count: 'exact', head: true })
        .eq('review_status', 'pending_review')
        .is('archived_at', null);
      return count ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  return data;
}

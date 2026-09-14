'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import {
  segmentOfProduct,
  type SourcingListSegment,
} from '../../utils/sourcing-stage';

export const SOURCING_SEGMENT_COUNTS_QUERY_KEY = [
  'sourcing',
  'segment-counts',
] as const;

const EMPTY_COUNTS: Record<SourcingListSegment, number> = {
  in_progress: 0,
  on_hold: 0,
  refused: 0,
  withdrawn: 0,
  validated: 0,
};

/**
 * Nombre de produits par segment de la liste sourcing (BO-SOURCING-P5-001) :
 * une seule lecture légère (3 colonnes) des produits en sourcing ou validés,
 * regroupés avec segmentOfProduct — la même règle que les filtres de la liste.
 */
export function useSourcingSegmentCounts() {
  const query = useQuery({
    queryKey: SOURCING_SEGMENT_COUNTS_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('sourcing_status, archived_at, creation_mode')
        .or('creation_mode.eq.sourcing,sourcing_status.eq.validated')
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useMemo(() => {
    const result = { ...EMPTY_COUNTS };
    for (const row of query.data ?? []) {
      const segment = segmentOfProduct(row);
      if (segment) result[segment] += 1;
    }
    return result;
  }, [query.data]);

  return { counts, loading: query.isLoading, refetch: query.refetch };
}

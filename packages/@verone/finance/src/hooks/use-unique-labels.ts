/**
 * Hook pour récupérer les libellés uniques des dépenses non classées
 *
 * Utilisé par la page de gestion des règles pour afficher
 * tous les libellés de transactions qui n'ont pas encore de règle.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface UniqueLabel {
  label: string;
  transaction_count: number;
  total_amount: number;
  first_seen: string;
  last_seen: string;
  expense_ids: string[];
}

export interface UseUniqueLabelsReturn {
  labels: UniqueLabel[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUniqueLabels(): UseUniqueLabelsReturn {
  const [labels, setLabels] = useState<UniqueLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Query la vue v_unique_unclassified_labels
      const { data, error: fetchError } = await (
        supabase as { from: CallableFunction }
      )
        .from('v_unique_unclassified_labels')
        .select('*')
        .order('transaction_count', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setLabels((data || []) as UniqueLabel[]);
    } catch (err) {
      console.error('[useUniqueLabels] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return {
    labels,
    isLoading,
    error,
    refetch: fetchLabels,
  };
}

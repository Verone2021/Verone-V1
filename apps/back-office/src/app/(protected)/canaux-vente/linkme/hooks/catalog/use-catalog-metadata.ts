/**
 * Hooks pour la gestion des paramètres de marge du catalogue LinkMe.
 * SI-DESC-001 (2026-04-21) : useUpdateCustomMetadata retiré — les colonnes
 * custom_* ont été droppées de channel_pricing (0 % usage prod).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from './constants';

/**
 * Hook: mettre à jour les paramètres de marge
 */
export function useUpdateMarginSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      marginSettings,
    }: {
      catalogProductId: string;
      marginSettings: {
        min_margin_rate?: number;
        max_margin_rate?: number;
        suggested_margin_rate?: number;
      };
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update(marginSettings)
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-catalog-products'],
      });
    },
  });
}

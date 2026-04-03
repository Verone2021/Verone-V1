/**
 * Hooks pour la gestion des marges et métadonnées custom du catalogue
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

/**
 * Hook: mettre à jour les métadonnées custom
 */
export function useUpdateCustomMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      metadata,
    }: {
      catalogProductId: string;
      metadata: {
        custom_title?: string | null;
        custom_description?: string | null;
        custom_selling_points?: string[] | null;
      };
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update(metadata)
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

/**
 * Hook: useUpdateMetadata
 * Mutation pour mettre à jour les métadonnées canal d'un produit
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

interface UpdateMetadataParams {
  product_id: string;
  channel_id: string;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_description_long?: string | null;
  custom_technical_description?: string | null;
  custom_brand?: string | null;
  custom_selling_points?: string[] | null;
}

const supabase = createClient();

export function useUpdateMetadata() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdateMetadataParams) => {
      const { error } = await supabase
        .from('channel_product_metadata')
        .upsert(
          {
            product_id: params.product_id,
            channel_id: params.channel_id,
            custom_title: params.custom_title,
            custom_description: params.custom_description,
            custom_description_long: params.custom_description_long,
            custom_technical_description: params.custom_technical_description,
            custom_brand: params.custom_brand,
            custom_selling_points: params.custom_selling_points || [],
          },
          { onConflict: 'product_id,channel_id' }
        )
        .select();

      if (error) {
        console.error('❌ Erreur update metadata:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Métadonnées mises à jour',
        description: 'Les informations du produit ont été sauvegardées',
      });

      // Invalider cache pour forcer refresh
      queryClient.invalidateQueries({
        queryKey: ['site-internet-product-detail', variables.product_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
    },
    onError: (error: Error) => {
      console.error('❌ Mutation ERROR metadata:', error);
      toast({
        title: 'Erreur lors de la sauvegarde',
        description:
          error.message || 'Impossible de sauvegarder les métadonnées',
        variant: 'destructive',
      });
    },
  });
}

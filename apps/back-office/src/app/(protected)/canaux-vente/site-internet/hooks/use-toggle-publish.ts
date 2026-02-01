/**
 * Hook: useTogglePublish
 * Mutation pour publier/dépublier un produit en ligne
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

interface TogglePublishParams {
  product_id: string;
  is_published: boolean;
}

const supabase = createClient();

export function useTogglePublish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: TogglePublishParams) => {
      const { error } = await supabase
        .from('products')
        .update({
          is_published_online: params.is_published,
          publication_date: params.is_published
            ? new Date().toISOString()
            : null,
        })
        .eq('id', params.product_id);

      if (error) {
        console.error('❌ Erreur toggle publish:', error);
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      toast({
        title: variables.is_published ? 'Produit publié' : 'Produit dépublié',
        description: variables.is_published
          ? 'Le produit est maintenant visible en ligne'
          : 'Le produit a été retiré du site',
      });

      // Invalider cache
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-product-detail', variables.product_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-products'],
      });
    },
    onError: (error: Error) => {
      console.error('❌ Mutation ERROR toggle publish:', error);
      toast({
        title: 'Erreur lors de la publication',
        description:
          error.message ?? 'Impossible de modifier le statut de publication',
        variant: 'destructive',
      });
    },
  });
}

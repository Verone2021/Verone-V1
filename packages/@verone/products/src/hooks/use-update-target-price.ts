'use client';

/**
 * useUpdateTargetPrice — mutation TanStack pour mettre à jour products.target_price.
 *
 * Sprint : BO-PRODUCTS-PROFIT-004
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

interface UpdateTargetPriceInput {
  productId: string;
  targetPrice: number | null;
}

export function useUpdateTargetPrice() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, UpdateTargetPriceInput>({
    mutationFn: async ({ productId, targetPrice }) => {
      const { error } = await supabase
        .from('products')
        .update({ target_price: targetPrice })
        .eq('id', productId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async (_data, { productId }) => {
      await queryClient.invalidateQueries({
        queryKey: ['product-sales-margin', productId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['product', productId],
      });
      toast({
        title: 'Prix cible mis à jour',
        description: 'Le prix cible du produit a été sauvegardé.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

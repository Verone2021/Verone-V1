/**
 * Hooks mutation pour ajout/suppression de produits au catalogue LinkMe
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddProductWithPricing } from './types';
import { LINKME_CHANNEL_ID, getSupabaseClient } from './constants';

/**
 * Hook: ajouter des produits au catalogue LinkMe
 * Utilise fonction RPC SECURITY DEFINER pour bypasser RLS
 */
export function useAddProductsToCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: AddProductWithPricing[]) => {
      const supabase = getSupabaseClient();

      const rows = products.map(p => ({
        product_id: p.productId,
        channel_id: LINKME_CHANNEL_ID,
        is_active: true,
        custom_price_ht: p.customPriceHt,
        channel_commission_rate: p.commissionRate,
      }));

      const { data, error } = await supabase
        .from('channel_pricing')
        .upsert(rows, { onConflict: 'channel_id,product_id' })
        .select('id');

      if (error) throw new Error(error.message);

      return data?.length ?? 0;
    },
    onSuccess: async count => {
      await queryClient.invalidateQueries({
        queryKey: ['linkme-catalog-products'],
      });
      console.warn(`✅ ${count} produits ajoutés au catalogue LinkMe`);
    },
  });
}

/**
 * Hook: supprimer un produit du catalogue LinkMe
 */
export function useRemoveProductFromCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalogProductId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .delete()
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

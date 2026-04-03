/**
 * Hooks pour la propagation de prix et gestion des sélections
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { ProductSelectionPresence } from './types';
import { LINKME_CHANNEL_ID, getSupabaseClient } from './constants';

/**
 * Hook: récupère les sélections contenant un produit donné
 * Compare base_price_ht (sélection) avec public_price_ht (catalogue)
 */
export function useProductSelections(productId: string | null) {
  return useQuery({
    queryKey: ['linkme-product-selections', productId],
    queryFn: async (): Promise<ProductSelectionPresence[]> => {
      if (!productId) return [];

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('linkme_selection_items')
        .select(
          `
          id,
          selection_id,
          base_price_ht,
          margin_rate,
          selling_price_ht,
          linkme_selections!inner(id, name)
        `
        )
        .eq('product_id', productId);

      if (error) {
        console.error('Erreur fetch product selections:', error);
        throw error;
      }

      if (!data || data.length === 0) return [];

      return data.map(item => ({
        item_id: item.id,
        selection_id: item.selection_id,
        selection_name:
          (
            item.linkme_selections as unknown as {
              id: string;
              name: string;
            }
          )?.name ?? 'Sans nom',
        base_price_ht: Number(item.base_price_ht ?? 0),
        margin_rate: item.margin_rate != null ? Number(item.margin_rate) : null,
        selling_price_ht:
          item.selling_price_ht != null ? Number(item.selling_price_ht) : null,
      }));
    },
    enabled: !!productId,
    staleTime: 300_000,
  });
}

/**
 * Hook: propage le prix catalogue vers toutes les sélections
 * Active le flag propagate_to_selections sur channel_pricing
 * Le trigger DB fait le reste (sync base_price_ht)
 */
export function usePropagatePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const supabase = getSupabaseClient();

      // propagate_to_selections added by migration but not yet in generated types
      const updateData = {
        propagate_to_selections: true,
      } as Database['public']['Tables']['channel_pricing']['Update'];
      const { error } = await supabase
        .from('channel_pricing')
        .update(updateData)
        .eq('product_id', productId)
        .eq('channel_id', LINKME_CHANNEL_ID);

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-product-selections'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-product-detail'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-catalog-products'],
        }),
      ]);
    },
  });
}

/**
 * Hook: supprimer un produit du catalogue LinkMe
 * Retire d'abord le produit de toutes les sélections, puis supprime la ligne channel_pricing.
 * Le produit doit être désactivé (is_active = false) avant suppression.
 */
export function useDeleteLinkMeCatalogProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      productId,
    }: {
      catalogProductId: string;
      productId: string;
    }) => {
      const supabase = getSupabaseClient();

      // Safety check: verify product is deactivated before deletion
      const { data: cp, error: fetchError } = await supabase
        .from('channel_pricing')
        .select('is_active')
        .eq('id', catalogProductId)
        .single();

      if (fetchError) throw fetchError;
      if (cp.is_active) {
        throw new Error(
          'Le produit doit être désactivé avant de pouvoir être supprimé du catalogue.'
        );
      }

      // Step 1: Remove product from all selections
      const { data: selectionItems, error: itemsError } = await supabase
        .from('linkme_selection_items')
        .select('id, selection_id')
        .eq('product_id', productId);

      if (itemsError) throw itemsError;

      if (selectionItems && selectionItems.length > 0) {
        // Delete all selection items for this product
        const { error: deleteItemsError } = await supabase
          .from('linkme_selection_items')
          .delete()
          .eq('product_id', productId);

        if (deleteItemsError) throw deleteItemsError;

        // Decrement product counts for each affected selection
        const uniqueSelectionIds = [
          ...new Set(selectionItems.map(i => i.selection_id)),
        ];
        for (const selectionId of uniqueSelectionIds) {
          await supabase.rpc('decrement_selection_products_count', {
            p_selection_id: selectionId,
          });
        }
      }

      // Step 2: Delete the channel_pricing row
      const { error } = await supabase
        .from('channel_pricing')
        .delete()
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-catalog-products'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-product-detail'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-selections'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-selection'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-product-selections'],
        }),
      ]);
    },
  });
}

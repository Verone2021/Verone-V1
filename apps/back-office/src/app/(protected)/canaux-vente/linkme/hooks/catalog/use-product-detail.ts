/**
 * Hooks pour la page détail produit LinkMe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLinkMeProductDetail } from './fetchers-detail';
import { getSupabaseClient } from './constants';

/**
 * Hook: récupère le détail d'un produit LinkMe
 * @param catalogProductId - ID de channel_pricing
 */
export function useLinkMeProductDetail(catalogProductId: string | null) {
  return useQuery({
    queryKey: ['linkme-product-detail', catalogProductId],
    queryFn: () =>
      catalogProductId ? fetchLinkMeProductDetail(catalogProductId) : null,
    enabled: !!catalogProductId,
    staleTime: 300_000,
  });
}

/**
 * Hook: mettre à jour marges produit LinkMe (channel_pricing)
 */
export function useUpdateLinkMePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      pricing,
    }: {
      catalogProductId: string;
      pricing: {
        min_margin_rate?: number;
        max_margin_rate?: number;
        suggested_margin_rate?: number | null;
        channel_commission_rate?: number; // Correct column name
        buffer_rate?: number | null; // Marge de sécurité (décimal)
        custom_price_ht?: number | null; // Prix de vente canal
        public_price_ht?: number | null; // Tarif public HT
      };
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('channel_pricing')
        .update(pricing)
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-product-detail', variables.catalogProductId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-catalog-products'],
        }),
      ]);
    },
  });
}

// SI-DESC-001 : useUpdateLinkMeMetadata retiré (custom_* dropped de DB).
// Les descriptions / arguments de vente viennent désormais du master products.
// Edition via /produits/catalogue/[id] onglet Descriptions.

/**
 * Hook: mettre à jour la commission affilié (table products)
 * Pour les produits affiliés, la commission est stockée dans products.affiliate_commission_rate
 */
export function useUpdateAffiliateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      commissionRate,
    }: {
      productId: string;
      commissionRate: number;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('products')
        .update({ affiliate_commission_rate: commissionRate })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: async () => {
      // Invalider le cache pour rafraîchir les données
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-product-detail'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-catalog-products'],
        }),
      ]);
    },
  });
}

/**
 * Hook: toggle pour page détail (channel_pricing)
 * Supporte 'is_enabled' qui est mappé vers 'is_active' dans channel_pricing
 */
export function useToggleLinkMeProductField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogProductId,
      field,
      value,
    }: {
      catalogProductId: string;
      field:
        | 'is_enabled' // UI field, mapped to is_active
        | 'is_active'
        | 'is_public_showcase'
        | 'is_featured'
        | 'show_supplier';
      value: boolean;
    }) => {
      const supabase = getSupabaseClient();
      // Map is_enabled to is_active (column name in channel_pricing)
      const dbField = field === 'is_enabled' ? 'is_active' : field;

      const { error } = await supabase
        .from('channel_pricing')
        .update({ [dbField]: value })
        .eq('id', catalogProductId);

      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['linkme-product-detail', variables.catalogProductId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-catalog-products'],
        }),
      ]);
    },
  });
}

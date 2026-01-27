/**
 * Hook: useProductVariants
 * Récupère et gère variantes produit
 *
 * NOTE: product_variants table doesn't exist yet in database
 * These are stub implementations that return empty data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { SiteInternetProductDetail } from '../types';

const supabase = createClient();

/**
 * Fetch détail produit avec variantes via RPC
 */
async function fetchProductDetail(
  productId: string
): Promise<SiteInternetProductDetail | null> {
  const { data, error } = await supabase.rpc(
    'get_site_internet_product_detail' as any,
    {
      p_product_id: productId,
    }
  );

  if (error) {
    console.error('Erreur fetch product detail:', error);
    throw error;
  }

  return data as unknown as SiteInternetProductDetail | null;
}

/**
 * Hook principal: récupère détail produit avec variantes
 */
export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => fetchProductDetail(productId),
    enabled: !!productId,
    staleTime: 30000, // 30 secondes
  });
}

/**
 * Fetch variantes produit (STUB - product_variants table doesn't exist yet)
 */
async function fetchProductVariants(_productId: string) {
  // Return null since product_variants table doesn't exist yet
  return null;
}

/**
 * Hook: récupère variantes produit (STUB)
 */
export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => fetchProductVariants(productId),
    enabled: !!productId,
    staleTime: 30000,
  });
}

/**
 * Toggle activation variante (STUB - product_variants table doesn't exist yet)
 */
export function useToggleVariantActivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { variantId: string; isActive: boolean }) => {
      // Stub - do nothing since table doesn't exist
      console.warn(
        'useToggleVariantActivation: product_variants table not implemented yet'
      );
      return null;
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
    },
  });
}

/**
 * Créer nouvelle variante (STUB - product_variants table doesn't exist yet)
 */
export function useCreateProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: {
      variantGroupId: string;
      optionValue: string;
      sku: string;
      priceHt?: number;
      stockQuantity?: number;
    }) => {
      // Stub - do nothing since table doesn't exist
      console.warn(
        'useCreateProductVariant: product_variants table not implemented yet'
      );
      return null;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-variants'],
      });
    },
  });
}

/**
 * Mettre à jour variante (STUB - product_variants table doesn't exist yet)
 */
export function useUpdateProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: {
      variantId: string;
      updates: {
        sku?: string;
        option_value?: string;
        price_ht?: number;
        stock_quantity?: number;
        is_active?: boolean;
        display_order?: number;
      };
    }) => {
      // Stub - do nothing since table doesn't exist
      console.warn(
        'useUpdateProductVariant: product_variants table not implemented yet'
      );
      return null;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-variants'],
      });
    },
  });
}

/**
 * Supprimer variante (STUB - product_variants table doesn't exist yet)
 */
export function useDeleteProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_variantId: string) => {
      // Stub - do nothing since table doesn't exist
      console.warn(
        'useDeleteProductVariant: product_variants table not implemented yet'
      );
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product-variants'],
      });
    },
  });
}

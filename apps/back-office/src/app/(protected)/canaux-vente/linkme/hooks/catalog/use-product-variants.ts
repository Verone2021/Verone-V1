/**
 * Hook pour les variantes produit dans le catalogue LinkMe
 */

import { useQuery } from '@tanstack/react-query';
import type { ProductVariant } from './types';
import { LINKME_CHANNEL_ID, getSupabaseClient } from './constants';

/**
 * Hook: récupérer les variantes d'un produit présentes dans le catalogue LinkMe
 * Note: Filtre les variantes pour n'afficher que celles qui sont dans channel_pricing
 */
export function useLinkMeProductVariants(productId: string | null) {
  return useQuery({
    queryKey: ['linkme-product-variants', productId],
    queryFn: async (): Promise<ProductVariant[]> => {
      if (!productId) return [];

      const supabase = getSupabaseClient();

      // 1. Récupérer le variant_group_id du produit principal
      const { data: mainProduct, error: mainError } = await supabase
        .from('products')
        .select('variant_group_id')
        .eq('id', productId)
        .single();

      if (mainError || !mainProduct?.variant_group_id) {
        return [];
      }

      // 2. Récupérer toutes les variantes du même groupe
      const { data: allVariants, error } = await supabase
        .from('products')
        .select(
          `
          id,
          sku,
          name,
          variant_attributes,
          stock_real,
          cost_price
        `
        )
        .eq('variant_group_id', mainProduct.variant_group_id)
        .neq('id', productId) // Exclure le produit principal
        .order('variant_position');

      if (error) {
        console.error('Erreur fetch variantes produit:', error);
        return [];
      }

      if (!allVariants || allVariants.length === 0) return []; // Keep || for null check logic

      // 3. Filtrer par présence dans channel_pricing (catalogue LinkMe)
      const variantIds = allVariants.map(v => v.id);
      const { data: catalogEntries } = await supabase
        .from('channel_pricing')
        .select('product_id')
        .eq('channel_id', LINKME_CHANNEL_ID)
        .in('product_id', variantIds);

      // Set des product_id présents dans le catalogue LinkMe
      const catalogProductIds = new Set(
        (catalogEntries ?? []).map(e => e.product_id)
      );

      // Filtrer les variantes pour ne garder que celles dans le catalogue
      const variantsInCatalog = allVariants.filter(v =>
        catalogProductIds.has(v.id)
      );

      if (variantsInCatalog.length === 0) return [];

      // 4. Récupérer les images primaires pour les variantes filtrées
      const filteredIds = variantsInCatalog.map(v => v.id);
      const { data: images } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', filteredIds)
        .eq('is_primary', true);

      // Map des images par product_id
      const imageMap = new Map(
        (images ?? []).map(img => [img.product_id, img.public_url])
      );

      return variantsInCatalog.map(v => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        variant_attributes: v.variant_attributes as Record<
          string,
          string
        > | null,
        stock_real: v.stock_real ?? 0,
        cost_price: v.cost_price,
        image_url: imageMap.get(v.id) ?? null,
      }));
    },
    enabled: !!productId,
    staleTime: 60000,
  });
}

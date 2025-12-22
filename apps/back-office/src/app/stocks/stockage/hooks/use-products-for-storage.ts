/**
 * Hook: useProductsForStorage
 * Selecteur de produits pour allocation de stockage
 * Filtre: Produits Sur Mesure (is_sourced) OU Produits Affilies (created_by_affiliate)
 *
 * @module use-products-for-storage
 * @since 2025-12-20
 */

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ProductForStorage {
  id: string;
  name: string;
  sku: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
  volume_m3: number;
  image_url: string | null;
  product_type: 'sur_mesure' | 'affiliate';
}

/**
 * Calcule le volume en m3 depuis les dimensions
 */
function calcVolumeM3(dimensions: ProductForStorage['dimensions']): number {
  if (!dimensions) return 0;

  const length = dimensions.length ?? 0;
  const width = dimensions.width ?? 0;
  const height = dimensions.height ?? 0;

  if (length === 0 || width === 0 || height === 0) return 0;

  // Dimensions en cm, convertir en m3
  return (length * width * height) / 1000000;
}

/**
 * Hook: recherche les produits disponibles pour stockage
 * Filtre: is_sourced = true OU created_by_affiliate IS NOT NULL
 */
export function useProductsForStorage(
  searchTerm?: string
): UseQueryResult<ProductForStorage[]> {
  return useQuery({
    queryKey: ['products-for-storage', searchTerm],
    queryFn: async (): Promise<ProductForStorage[]> => {
      const supabase = createClient();

      // Build query for products eligible for storage
      // Sur Mesure: enseigne_id IS NOT NULL OR assigned_client_id IS NOT NULL
      // Affiliate: created_by_affiliate IS NOT NULL
      let query = supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          dimensions,
          enseigne_id,
          assigned_client_id,
          created_by_affiliate,
          product_images!product_images_product_id_fkey(public_url, display_order)
        `
        )
        .or(
          'enseigne_id.not.is.null,assigned_client_id.not.is.null,created_by_affiliate.not.is.null'
        )
        .order('name')
        .limit(100);

      if (searchTerm && searchTerm.length >= 2) {
        query = query.or(
          `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching products:', error.message);
        return [];
      }

      return (data ?? []).map(p => {
        // Get first image URL (ordered by display_order)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productData = p as any;
        const images =
          (productData.product_images as
            | { public_url: string; display_order: number }[]
            | null) ?? [];
        const sortedImages = [...images].sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        const imageUrl = sortedImages[0]?.public_url ?? null;

        // Determine product type
        // Affiliate: created_by_affiliate IS NOT NULL
        // Sur Mesure: enseigne_id or assigned_client_id IS NOT NULL
        const productType: ProductForStorage['product_type'] =
          productData.created_by_affiliate ? 'affiliate' : 'sur_mesure';

        return {
          id: productData.id,
          name: productData.name ?? 'Sans nom',
          sku: productData.sku ?? '-',
          dimensions: productData.dimensions as ProductForStorage['dimensions'],
          volume_m3: calcVolumeM3(
            productData.dimensions as ProductForStorage['dimensions']
          ),
          image_url: imageUrl,
          product_type: productType,
        };
      });
    },
    enabled: !searchTerm || searchTerm.length >= 2,
    staleTime: 60000,
  });
}

/**
 * Format volume for display
 */
export function formatVolumePreview(volumeM3: number): string {
  if (volumeM3 === 0) return '0 m³ (dimensions manquantes)';
  if (volumeM3 < 0.001) return '< 0.001 m³';
  if (volumeM3 < 1) return `${volumeM3.toFixed(4)} m³`;
  return `${volumeM3.toFixed(3)} m³`;
}

/**
 * Get badge label for product type
 */
export function getProductTypeBadge(type: ProductForStorage['product_type']): {
  label: string;
  className: string;
} {
  if (type === 'affiliate') {
    return {
      label: 'Affilié',
      className: 'bg-purple-100 text-purple-700',
    };
  }
  return {
    label: 'Sur Mesure',
    className: 'bg-blue-100 text-blue-700',
  };
}

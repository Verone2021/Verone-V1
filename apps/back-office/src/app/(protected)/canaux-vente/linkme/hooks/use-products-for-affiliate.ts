/**
 * Hook: useProductsForAffiliate
 * Récupère les produits associés à un affilié (via son enseigne OU organisation)
 *
 * Un affilié est lié à une enseigne OU une organisation. Les produits sont:
 * 1. Produits avec enseigne_id = affiliate.enseigne_id (Sur Mesure - enseigne)
 * 2. Produits avec organisation_id = affiliate.organisation_id (Sur Mesure - org)
 * 3. Produits avec created_by_affiliate = affiliate.id (Affilié)
 *
 * @module use-products-for-affiliate
 * @since 2025-12-21
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Supabase query return type
interface ProductAffiliateRow {
  id: string;
  name: string | null;
  sku: string | null;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  } | null;
  stock_real: number | null;
  created_by_affiliate: string | null;
  product_images: { public_url: string; display_order: number | null }[] | null;
}

export interface ProductForAffiliate {
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
  stock_real: number;
  image_url: string | null;
  product_type: 'sur_mesure' | 'affiliate';
}

/**
 * Calcule le volume en m3 depuis les dimensions
 */
function calcVolumeM3(dimensions: ProductForAffiliate['dimensions']): number {
  if (!dimensions) return 0;

  const length = dimensions.length ?? 0;
  const width = dimensions.width ?? 0;
  const height = dimensions.height ?? 0;

  if (length === 0 || width === 0 || height === 0) return 0;

  // Dimensions en cm, convertir en m3
  return (length * width * height) / 1000000;
}

/**
 * Hook: récupère les produits associés à un affilié
 *
 * @param affiliateId - ID de l'affilié sélectionné
 * @param enseigneId - ID de l'enseigne de l'affilié (null si org independante)
 * @param organisationId - ID de l'organisation (null si enseigne)
 * @param searchTerm - Terme de recherche optionnel
 */
export function useProductsForAffiliate(
  affiliateId: string | null,
  enseigneId: string | null,
  organisationId: string | null = null,
  searchTerm?: string
) {
  return useQuery({
    queryKey: [
      'products-for-affiliate',
      affiliateId,
      enseigneId,
      organisationId,
      searchTerm,
    ],
    queryFn: async (): Promise<ProductForAffiliate[]> => {
      // Need affiliateId AND (enseigneId OR organisationId)
      if (!affiliateId || (!enseigneId && !organisationId)) return [];

      const supabase = createClient();

      // Build filter based on affiliate type
      // Enseigne: enseigne_id = enseigneId OR created_by_affiliate = affiliateId
      // Org independante: only created_by_affiliate = affiliateId (no organisation link in products)
      const orFilter = enseigneId
        ? `enseigne_id.eq.${enseigneId},created_by_affiliate.eq.${affiliateId}`
        : `created_by_affiliate.eq.${affiliateId}`;

      let query = supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          dimensions,
          stock_real,
          enseigne_id,
          created_by_affiliate,
          product_images!product_images_product_id_fkey(public_url, display_order)
        `
        )
        .or(orFilter)
        .order('name')
        .limit(100);

      if (searchTerm && searchTerm.length >= 2) {
        query = query.or(
          `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.returns<ProductAffiliateRow[]>();

      if (error) {
        console.warn('Error fetching products for affiliate:', error.message);
        return [];
      }

      return (data ?? []).map(p => {
        // Get first image URL
        const images = p.product_images ?? [];
        const sortedImages = [...images].sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        const imageUrl = sortedImages[0]?.public_url ?? null;

        // Determine product type
        const productType: ProductForAffiliate['product_type'] =
          p.created_by_affiliate ? 'affiliate' : 'sur_mesure';

        return {
          id: p.id,
          name: p.name ?? 'Sans nom',
          sku: p.sku ?? '-',
          dimensions: p.dimensions,
          volume_m3: calcVolumeM3(p.dimensions),
          stock_real: p.stock_real ?? 0,
          image_url: imageUrl,
          product_type: productType,
        };
      });
    },
    enabled: !!affiliateId && (!!enseigneId || !!organisationId),
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
export function getProductTypeBadge(
  type: ProductForAffiliate['product_type']
): {
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

/**
 * Hook: useAllProductsStats
 * Statistiques de TOUS les produits vendus par l'affilié
 *
 * 100% orienté produit : quantités vendues, CA généré.
 * Zero commission, zero marge, zero rémunération.
 *
 * @module use-all-products-stats
 * @since 2026-01-08
 * @updated 2026-02-10 - Purge commissions, focus produit
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-selection';

const supabase = createClient();

// ============================================
// TYPES
// ============================================

export type ProductSource = 'catalogue' | 'mes-produits' | 'sur-mesure';
export interface ProductStatsFilters {
  year?: number; // 2023 à current year
  search?: string; // nom ou SKU
}

export interface ProductStatsData {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  quantitySold: number;
  revenueHT: number;
  revenueTTC: number;
  productSource: ProductSource;
  avgPriceHT: number; // total_ht / quantity (moyenne pondérée)
}

export interface AllProductsStatsResult {
  products: ProductStatsData[];
  totals: {
    productsCount: number;
    totalQuantity: number;
    totalRevenueHT: number;
    totalRevenueTTC: number;
  };
}

// ============================================
// HOOK
// ============================================

export function useAllProductsStats(
  filters?: ProductStatsFilters
): ReturnType<typeof useQuery<AllProductsStatsResult | null>> {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['all-products-stats', affiliate?.id, filters],
    queryFn: async (): Promise<AllProductsStatsResult | null> => {
      if (!affiliate) {
        return null;
      }

      // 1. Récupérer les commissions de l'affilié (UNIQUEMENT pour order_id + filtre année)
      let commissionsQuery = supabase
        .from('linkme_commissions')
        .select('order_id, created_at')
        .eq('affiliate_id', affiliate.id);

      // Filtrer par année si spécifié
      if (filters?.year) {
        commissionsQuery = commissionsQuery
          .gte('created_at', `${filters.year}-01-01`)
          .lte('created_at', `${filters.year}-12-31`);
      }

      const { data: commissionsData, error: commissionsError } =
        await commissionsQuery;

      if (commissionsError) {
        console.error('Erreur fetch commissions:', commissionsError);
        throw commissionsError;
      }

      const orderIds = (commissionsData ?? [])
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      if (orderIds.length === 0) {
        return {
          products: [],
          totals: {
            productsCount: 0,
            totalQuantity: 0,
            totalRevenueHT: 0,
            totalRevenueTTC: 0,
          },
        };
      }

      // 2. Récupérer les items depuis linkme_order_items_enriched
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          `
          product_id,
          quantity,
          total_ht,
          tax_rate,
          sales_order_id
        `
        )
        .in('sales_order_id', orderIds);

      if (orderItemsError) {
        console.error('Erreur fetch order items:', orderItemsError);
        throw orderItemsError;
      }

      const orderItems = orderItemsData ?? [];

      // 3. Récupérer les produits avec infos de type
      const productIdsFromItems: string[] = [
        ...new Set(
          orderItems
            .map(item => item.product_id)
            .filter((id): id is string => id !== null && id !== undefined)
        ),
      ];

      const { data: productsTypeData } = await supabase
        .from('products')
        .select('id, created_by_affiliate, enseigne_id, assigned_client_id')
        .in('id', productIdsFromItems);

      // Map pour identifier la source de chaque produit
      const productSourceMap = new Map<
        string,
        { isAffiliate: boolean; isCustom: boolean }
      >();
      (productsTypeData ?? []).forEach(p => {
        productSourceMap.set(p.id, {
          isAffiliate: p.created_by_affiliate !== null,
          isCustom: p.enseigne_id !== null || p.assigned_client_id !== null,
        });
      });

      // 4. Agréger par produit
      const productMap = new Map<
        string,
        {
          quantity: number;
          revenueHT: number;
          revenueTTC: number;
          isAffiliateProduct: boolean;
          isCustomProduct: boolean;
        }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productId) return;

        const sourceInfo = productSourceMap.get(productId);
        const isAffiliateProduct = sourceInfo?.isAffiliate ?? false;
        const isCustomProduct = sourceInfo?.isCustom ?? false;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            quantity: 0,
            revenueHT: 0,
            revenueTTC: 0,
            isAffiliateProduct,
            isCustomProduct,
          });
        }

        const entry = productMap.get(productId)!;
        const qty = item.quantity ?? 0;
        const totalHT = item.total_ht ?? 0;
        const taxRate = item.tax_rate ?? 0;
        const totalTTC = totalHT * (1 + taxRate / 100);

        entry.quantity += qty;
        entry.revenueHT += totalHT;
        entry.revenueTTC += totalTTC;
      });

      // 5. Récupérer les infos produits et images
      const productIds = Array.from(productMap.keys());

      if (productIds.length === 0) {
        return {
          products: [],
          totals: {
            productsCount: 0,
            totalQuantity: 0,
            totalRevenueHT: 0,
            totalRevenueTTC: 0,
          },
        };
      }

      const [productsResult, imagesResult] = await Promise.all([
        supabase.from('products').select('id, name, sku').in('id', productIds),
        supabase
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', productIds)
          .eq('is_primary', true),
      ]);

      const productsInfo = new Map(
        (productsResult.data ?? []).map(p => [
          p.id,
          { name: p.name, sku: p.sku },
        ])
      );

      const imageMap = new Map(
        (imagesResult.data ?? []).map(img => [img.product_id, img.public_url])
      );

      // 6. Construire les données finales
      const products: ProductStatsData[] = Array.from(productMap.entries()).map(
        ([productId, data]) => {
          const info = productsInfo.get(productId);

          // Déterminer la source du produit
          let productSource: ProductSource = 'catalogue';
          if (data.isAffiliateProduct) {
            productSource = 'mes-produits';
          } else if (data.isCustomProduct) {
            productSource = 'sur-mesure';
          }

          return {
            productId,
            productName: info?.name ?? 'Produit inconnu',
            productSku: info?.sku ?? '',
            productImageUrl: imageMap.get(productId) ?? null,
            quantitySold: data.quantity,
            revenueHT: data.revenueHT,
            revenueTTC: data.revenueTTC,
            productSource,
            avgPriceHT: data.quantity > 0 ? data.revenueHT / data.quantity : 0,
          };
        }
      );

      // 7. Trier par quantité vendue décroissante (plus pertinent que commission)
      products.sort((a, b) => b.quantitySold - a.quantitySold);

      // 8. Calculer les totaux
      const totals = products.reduce(
        (acc, p) => ({
          productsCount: acc.productsCount + 1,
          totalQuantity: acc.totalQuantity + p.quantitySold,
          totalRevenueHT: acc.totalRevenueHT + p.revenueHT,
          totalRevenueTTC: acc.totalRevenueTTC + p.revenueTTC,
        }),
        {
          productsCount: 0,
          totalQuantity: 0,
          totalRevenueHT: 0,
          totalRevenueTTC: 0,
        }
      );

      return { products, totals };
    },
    enabled: !!affiliate,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook: useAllProductsStats
 * Statistiques de TOUS les produits vendus par l'affilié
 *
 * Retourne tous les produits (pas limité à 10) avec :
 * - Calcul TVA correct
 * - Valeurs HT et TTC
 * - Tri et pagination côté client
 *
 * @module use-all-products-stats
 * @since 2026-01-08
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-selection';

const supabase = createClient();

// ============================================
// TYPES
// ============================================

export type CommissionType = 'catalogue' | 'revendeur';

export interface ProductStatsData {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  quantitySold: number;
  revenueHT: number;
  commissionHT: number;
  commissionType: CommissionType; // 'catalogue' = produit Vérone, 'revendeur' = produit affilié
  // Nouveaux champs - Source de vérité: linkme_order_items_enriched
  avgMarginRate: number; // Taux de commission moyen pondéré par quantité (%)
  marginPerUnit: number; // Marge HT par unité (€)
  isCustomProduct: boolean; // true si enseigne_id ou assigned_client_id non-null (Sur mesure)
}

export interface AllProductsStatsResult {
  products: ProductStatsData[];
  totals: {
    productsCount: number;
    totalQuantity: number;
    totalRevenueHT: number;
    totalCommissionHT: number;
  };
}

// ============================================
// HOOK
// ============================================

export function useAllProductsStats(): ReturnType<
  typeof useQuery<AllProductsStatsResult | null>
> {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['all-products-stats', affiliate?.id],
    queryFn: async (): Promise<AllProductsStatsResult | null> => {
      if (!affiliate) {
        return null;
      }

      // 1. Récupérer toutes les commissions de l'affilié (SOURCE DE VÉRITÉ)
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('linkme_commissions')
        .select('order_id, affiliate_commission_ttc')
        .eq('affiliate_id', affiliate.id);

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
            totalCommissionHT: 0,
          },
        };
      }

      // 2. Récupérer les items depuis linkme_order_items_enriched (inclut margin_rate)
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          `
          product_id,
          quantity,
          total_ht,
          affiliate_margin,
          margin_rate
        `
        )
        .in('sales_order_id', orderIds);

      if (orderItemsError) {
        console.error('Erreur fetch order items:', orderItemsError);
        throw orderItemsError;
      }

      const orderItems = orderItemsData ?? [];

      // 2b. Récupérer les produits avec leurs infos de type
      // - created_by_affiliate: produit créé par affilié (revendeur)
      // - enseigne_id / assigned_client_id: produit sur mesure Vérone
      const productIdsFromItems: string[] = [
        ...new Set(
          (orderItemsData ?? [])
            .map(item => item.product_id)
            .filter((id): id is string => id !== null && id !== undefined)
        ),
      ];

      const { data: productsTypeData } = await supabase
        .from('products')
        .select('id, created_by_affiliate, enseigne_id, assigned_client_id')
        .in('id', productIdsFromItems);

      // Map pour identifier le type de chaque produit
      const productTypeMap = new Map<
        string,
        { isAffiliate: boolean; isCustom: boolean }
      >();
      (productsTypeData ?? []).forEach(p => {
        productTypeMap.set(p.id, {
          isAffiliate: p.created_by_affiliate !== null,
          isCustom: p.enseigne_id !== null || p.assigned_client_id !== null,
        });
      });

      // 3. Agréger par produit
      const productMap = new Map<
        string,
        {
          quantity: number;
          revenueHT: number;
          commissionHT: number;
          weightedMarginRate: number; // margin_rate × quantity pour moyenne pondérée
          isAffiliateProduct: boolean;
          isCustomProduct: boolean;
        }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productId) return;

        const marginRate = item.margin_rate ?? 0;
        const typeInfo = productTypeMap.get(productId);
        const isAffiliateProduct = typeInfo?.isAffiliate ?? false;
        const isCustomProduct = typeInfo?.isCustom ?? false;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            quantity: 0,
            revenueHT: 0,
            commissionHT: 0,
            weightedMarginRate: 0,
            isAffiliateProduct,
            isCustomProduct,
          });
        }

        const entry = productMap.get(productId)!;
        const qty = item.quantity ?? 0;
        entry.quantity += qty;
        entry.revenueHT += item.total_ht ?? 0;
        entry.commissionHT += item.affiliate_margin ?? 0;
        // Moyenne pondérée du taux de commission
        entry.weightedMarginRate += marginRate * qty;
      });

      // 4. Récupérer les infos produits et images
      const productIds = Array.from(productMap.keys());

      if (productIds.length === 0) {
        return {
          products: [],
          totals: {
            productsCount: 0,
            totalQuantity: 0,
            totalRevenueHT: 0,
            totalCommissionHT: 0,
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

      // 5. Construire les données finales
      const products: ProductStatsData[] = Array.from(productMap.entries()).map(
        ([productId, data]) => {
          const info = productsInfo.get(productId);
          // Calculer le taux de commission moyen pondéré par quantité
          const avgMarginRate =
            data.quantity > 0 ? data.weightedMarginRate / data.quantity : 0;
          // Calculer la marge HT par unité
          const marginPerUnit =
            data.quantity > 0 ? data.commissionHT / data.quantity : 0;

          return {
            productId,
            productName: info?.name ?? 'Produit inconnu',
            productSku: info?.sku ?? '',
            productImageUrl: imageMap.get(productId) ?? null,
            quantitySold: data.quantity,
            revenueHT: data.revenueHT,
            commissionHT: data.commissionHT,
            commissionType: data.isAffiliateProduct ? 'revendeur' : 'catalogue',
            avgMarginRate,
            marginPerUnit,
            isCustomProduct: data.isCustomProduct,
          };
        }
      );

      // 6. Trier par commission HT décroissante
      products.sort((a, b) => b.commissionHT - a.commissionHT);

      // 7. Calculer les totaux
      const totals = products.reduce(
        (acc, p) => ({
          productsCount: acc.productsCount + 1,
          totalQuantity: acc.totalQuantity + p.quantitySold,
          totalRevenueHT: acc.totalRevenueHT + p.revenueHT,
          totalCommissionHT: acc.totalCommissionHT + p.commissionHT,
        }),
        {
          productsCount: 0,
          totalQuantity: 0,
          totalRevenueHT: 0,
          totalCommissionHT: 0,
        }
      );

      return { products, totals };
    },
    enabled: !!affiliate,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

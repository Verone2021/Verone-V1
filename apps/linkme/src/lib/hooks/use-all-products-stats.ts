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
  taxRate: number; // % TVA (20, 10, 5.5, etc.)
  revenueTTC: number;
  commissionHT: number;
  commissionTTC: number;
  commissionType: CommissionType; // 'catalogue' = produit Vérone, 'revendeur' = produit affilié
}

export interface AllProductsStatsResult {
  products: ProductStatsData[];
  totals: {
    productsCount: number;
    totalQuantity: number;
    totalRevenueHT: number;
    totalRevenueTTC: number;
    totalCommissionHT: number;
    totalCommissionTTC: number;
  };
  // Réconciliation avec source de vérité
  reconciliation: {
    sourceOfTruthTTC: number; // linkme_commissions.affiliate_commission_ttc total
    catalogueCommissionTTC: number; // Produits Vérone
    revendeurCommissionTTC: number; // Produits affilié (Pokawa, etc.)
    otherCommissionTTC: number; // Différence non ventilée
    isReconciled: boolean; // true si écart < 1€
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

      // Calculer la source de vérité (total TTC officiel)
      const sourceOfTruthTTC = (commissionsData ?? []).reduce(
        (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
        0
      );

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
            totalCommissionHT: 0,
            totalCommissionTTC: 0,
          },
          reconciliation: {
            sourceOfTruthTTC,
            catalogueCommissionTTC: 0,
            revendeurCommissionTTC: 0,
            otherCommissionTTC: sourceOfTruthTTC,
            isReconciled: sourceOfTruthTTC === 0,
          },
        };
      }

      // 2. Récupérer les items depuis linkme_order_items_enriched (inclut tax_rate)
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          `
          product_id,
          quantity,
          total_ht,
          tax_rate,
          affiliate_margin
        `
        )
        .in('sales_order_id', orderIds);

      if (orderItemsError) {
        console.error('Erreur fetch order items:', orderItemsError);
        throw orderItemsError;
      }

      const orderItems = orderItemsData ?? [];

      // 2b. Récupérer les produits créés par un affilié (Modèle 2 = Revendeur)
      const { data: affiliateProductsData } = await supabase
        .from('products')
        .select('id')
        .not('created_by_affiliate', 'is', null);

      const affiliateProductIds = new Set(
        (affiliateProductsData ?? []).map(p => p.id)
      );

      // 3. Agréger par produit avec TVA
      const productMap = new Map<
        string,
        {
          quantity: number;
          revenueHT: number;
          commissionHT: number;
          taxRate: number;
          taxRateCount: number;
          isAffiliateProduct: boolean;
        }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productId) return;

        // DB stocke le taux TVA en décimal (0.20) ou en pourcentage (20)
        const taxRateRaw = item.tax_rate ?? 0.2;
        // Convertir en pourcentage si c'est un décimal (< 1)
        const taxRate = taxRateRaw < 1 ? taxRateRaw * 100 : taxRateRaw;
        const isAffiliateProduct = affiliateProductIds.has(productId);

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            quantity: 0,
            revenueHT: 0,
            commissionHT: 0,
            taxRate: 0,
            taxRateCount: 0,
            isAffiliateProduct,
          });
        }

        const entry = productMap.get(productId)!;
        entry.quantity += item.quantity ?? 0;
        entry.revenueHT += item.total_ht ?? 0;
        entry.commissionHT += item.affiliate_margin ?? 0;
        // Moyenne pondérée du taux de TVA
        entry.taxRate += taxRate;
        entry.taxRateCount += 1;
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
            totalRevenueTTC: 0,
            totalCommissionHT: 0,
            totalCommissionTTC: 0,
          },
          reconciliation: {
            sourceOfTruthTTC,
            catalogueCommissionTTC: 0,
            revendeurCommissionTTC: 0,
            otherCommissionTTC: sourceOfTruthTTC,
            isReconciled: sourceOfTruthTTC === 0,
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

      // 5. Construire les données finales avec TTC et type de commission
      const products: ProductStatsData[] = Array.from(productMap.entries()).map(
        ([productId, data]) => {
          const info = productsInfo.get(productId);
          // Calculer le taux moyen de TVA
          const avgTaxRate =
            data.taxRateCount > 0 ? data.taxRate / data.taxRateCount : 20;

          return {
            productId,
            productName: info?.name ?? 'Produit inconnu',
            productSku: info?.sku ?? '',
            productImageUrl: imageMap.get(productId) ?? null,
            quantitySold: data.quantity,
            revenueHT: data.revenueHT,
            taxRate: avgTaxRate,
            revenueTTC: data.revenueHT * (1 + avgTaxRate / 100),
            commissionHT: data.commissionHT,
            commissionTTC: data.commissionHT * (1 + avgTaxRate / 100),
            commissionType: data.isAffiliateProduct ? 'revendeur' : 'catalogue',
          };
        }
      );

      // 6. Trier par commission TTC décroissante
      products.sort((a, b) => b.commissionTTC - a.commissionTTC);

      // 7. Calculer les totaux et réconciliation par type
      const totals = products.reduce(
        (acc, p) => ({
          productsCount: acc.productsCount + 1,
          totalQuantity: acc.totalQuantity + p.quantitySold,
          totalRevenueHT: acc.totalRevenueHT + p.revenueHT,
          totalRevenueTTC: acc.totalRevenueTTC + p.revenueTTC,
          totalCommissionHT: acc.totalCommissionHT + p.commissionHT,
          totalCommissionTTC: acc.totalCommissionTTC + p.commissionTTC,
        }),
        {
          productsCount: 0,
          totalQuantity: 0,
          totalRevenueHT: 0,
          totalRevenueTTC: 0,
          totalCommissionHT: 0,
          totalCommissionTTC: 0,
        }
      );

      // 8. Calculer les commissions par type pour réconciliation
      const catalogueCommissionTTC = products
        .filter(p => p.commissionType === 'catalogue')
        .reduce((sum, p) => sum + p.commissionTTC, 0);

      const revendeurCommissionTTC = products
        .filter(p => p.commissionType === 'revendeur')
        .reduce((sum, p) => sum + p.commissionTTC, 0);

      // Commissions non ventilées par produit (différence avec source de vérité)
      const productsTotalTTC = catalogueCommissionTTC + revendeurCommissionTTC;
      const otherCommissionTTC = sourceOfTruthTTC - productsTotalTTC;

      // Écart < 1€ = réconcilié
      const isReconciled = Math.abs(otherCommissionTTC) < 1;

      const reconciliation = {
        sourceOfTruthTTC,
        catalogueCommissionTTC,
        revendeurCommissionTTC,
        otherCommissionTTC,
        isReconciled,
      };

      return { products, totals, reconciliation };
    },
    enabled: !!affiliate,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

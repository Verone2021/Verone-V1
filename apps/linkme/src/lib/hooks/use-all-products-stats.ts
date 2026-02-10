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
export type ProductTypeFilter = 'all' | 'catalogue' | 'revendeur' | 'custom';
export type CommissionStatus = 'pending' | 'validated' | 'paid';

export interface ProductStatsFilters {
  year?: number; // 2024, 2025, 2026...
  organisationIds?: string[]; // Multi-select organisations
  productType?: ProductTypeFilter;
  commissionStatuses?: CommissionStatus[];
}

export interface ProductStatsData {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  quantitySold: number;
  revenueHT: number;
  revenueTTC: number; // CA TTC (nouveau)
  commissionHT: number;
  commissionTTC: number; // Commission TTC (nouveau)
  commissionType: CommissionType; // 'catalogue' = produit Vérone, 'revendeur' = produit affilié
  // Nouveaux champs - Source de vérité: linkme_order_items_enriched
  avgMarginRate: number; // Taux de commission moyen pondéré par quantité (%)
  marginPerUnit: number; // Marge HT par unité (€)
  isCustomProduct: boolean; // true si enseigne_id ou assigned_client_id non-null (Sur mesure)
  organisationId: string | null; // ID organisation (pour filtrage)
  commissionStatus: CommissionStatus; // Statut commission dominant
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
    totalCommissionPending: number; // Commissions en attente
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

      // 1. Récupérer toutes les commissions de l'affilié (SOURCE DE VÉRITÉ)
      // Avec filtrage optionnel par année et statut
      let commissionsQuery = supabase
        .from('linkme_commissions')
        .select('order_id, affiliate_commission_ttc, status, created_at')
        .eq('affiliate_id', affiliate.id);

      // Filtrer par année si spécifié
      if (filters?.year) {
        commissionsQuery = commissionsQuery
          .gte('created_at', `${filters.year}-01-01`)
          .lte('created_at', `${filters.year}-12-31`);
      }

      // Filtrer par statut si spécifié
      if (
        filters?.commissionStatuses &&
        filters.commissionStatuses.length > 0
      ) {
        commissionsQuery = commissionsQuery.in(
          'status',
          filters.commissionStatuses
        );
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
            totalCommissionHT: 0,
            totalCommissionTTC: 0,
            totalCommissionPending: 0,
          },
        };
      }

      // 2. Récupérer les items depuis linkme_order_items_enriched (inclut margin_rate + tax_rate)
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          `
          product_id,
          quantity,
          total_ht,
          tax_rate,
          affiliate_margin,
          margin_rate,
          sales_order_id
        `
        )
        .in('sales_order_id', orderIds);

      if (orderItemsError) {
        console.error('Erreur fetch order items:', orderItemsError);
        throw orderItemsError;
      }

      const orderItems = orderItemsData ?? [];

      // 2c. Créer une map des statuts de commission par order_id
      const commissionStatusMap = new Map<string, CommissionStatus>();
      (commissionsData ?? []).forEach(c => {
        if (c.order_id) {
          commissionStatusMap.set(c.order_id, c.status as CommissionStatus);
        }
      });

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

      let productsTypeQuery = supabase
        .from('products')
        .select('id, created_by_affiliate, enseigne_id, assigned_client_id')
        .in('id', productIdsFromItems);

      // Filtrer par type de produit si spécifié
      if (filters?.productType && filters.productType !== 'all') {
        if (filters.productType === 'catalogue') {
          // Catalogue = created_by_affiliate IS NULL AND (enseigne_id IS NULL AND assigned_client_id IS NULL)
          productsTypeQuery = productsTypeQuery
            .is('created_by_affiliate', null)
            .is('enseigne_id', null)
            .is('assigned_client_id', null);
        } else if (filters.productType === 'revendeur') {
          // Revendeur = created_by_affiliate NOT NULL
          productsTypeQuery = productsTypeQuery.not(
            'created_by_affiliate',
            'is',
            null
          );
        } else if (filters.productType === 'custom') {
          // Sur mesure = enseigne_id NOT NULL OR assigned_client_id NOT NULL
          productsTypeQuery = productsTypeQuery.or(
            'enseigne_id.not.is.null,assigned_client_id.not.is.null'
          );
        }
      }

      const { data: productsTypeData } = await productsTypeQuery;

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
          revenueTTC: number;
          commissionHT: number;
          commissionTTC: number;
          weightedMarginRate: number; // margin_rate × quantity pour moyenne pondérée
          isAffiliateProduct: boolean;
          isCustomProduct: boolean;
          organisationIds: Set<string>; // Organisations liées (pour filtrage)
          commissionStatuses: Map<CommissionStatus, number>; // Count par statut
        }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productId) return;

        const marginRate = item.margin_rate ?? 0;
        const typeInfo = productTypeMap.get(productId);
        const isAffiliateProduct = typeInfo?.isAffiliate ?? false;
        const isCustomProduct = typeInfo?.isCustom ?? false;
        const orderId = item.sales_order_id;
        const status = orderId ? commissionStatusMap.get(orderId) : undefined;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            quantity: 0,
            revenueHT: 0,
            revenueTTC: 0,
            commissionHT: 0,
            commissionTTC: 0,
            weightedMarginRate: 0,
            isAffiliateProduct,
            isCustomProduct,
            organisationIds: new Set(),
            commissionStatuses: new Map(),
          });
        }

        const entry = productMap.get(productId)!;
        const qty = item.quantity ?? 0;
        const totalHT = item.total_ht ?? 0;
        const taxRate = item.tax_rate ?? 0;
        const affiliateMarginHT = item.affiliate_margin ?? 0;
        // Calculer TTC à partir de HT + tax_rate (la vue n'a pas de colonnes TTC)
        const totalTTC = totalHT * (1 + taxRate / 100);
        const affiliateMarginTTC = affiliateMarginHT * (1 + taxRate / 100);

        entry.quantity += qty;
        entry.revenueHT += totalHT;
        entry.revenueTTC += totalTTC;
        entry.commissionHT += affiliateMarginHT;
        entry.commissionTTC += affiliateMarginTTC;
        // Moyenne pondérée du taux de commission
        entry.weightedMarginRate += marginRate * qty;

        // Compter les statuts de commission
        if (status) {
          const currentCount = entry.commissionStatuses.get(status) ?? 0;
          entry.commissionStatuses.set(status, currentCount + 1);
        }
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
            totalCommissionPending: 0,
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

          // Déterminer le statut de commission dominant (le plus fréquent)
          let dominantStatus: CommissionStatus = 'pending';
          let maxCount = 0;
          data.commissionStatuses.forEach((count, status) => {
            if (count > maxCount) {
              maxCount = count;
              dominantStatus = status;
            }
          });

          // Prendre la première organisation (pour filtrage simple)
          const organisationId =
            data.organisationIds.size > 0
              ? Array.from(data.organisationIds)[0]
              : null;

          return {
            productId,
            productName: info?.name ?? 'Produit inconnu',
            productSku: info?.sku ?? '',
            productImageUrl: imageMap.get(productId) ?? null,
            quantitySold: data.quantity,
            revenueHT: data.revenueHT,
            revenueTTC: data.revenueTTC,
            commissionHT: data.commissionHT,
            commissionTTC: data.commissionTTC,
            commissionType: data.isAffiliateProduct ? 'revendeur' : 'catalogue',
            avgMarginRate,
            marginPerUnit,
            isCustomProduct: data.isCustomProduct,
            organisationId,
            commissionStatus: dominantStatus,
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
          totalRevenueTTC: acc.totalRevenueTTC + p.revenueTTC,
          totalCommissionHT: acc.totalCommissionHT + p.commissionHT,
          totalCommissionTTC: acc.totalCommissionTTC + p.commissionTTC,
          totalCommissionPending:
            acc.totalCommissionPending +
            (p.commissionStatus === 'pending' ? p.commissionTTC : 0),
        }),
        {
          productsCount: 0,
          totalQuantity: 0,
          totalRevenueHT: 0,
          totalRevenueTTC: 0,
          totalCommissionHT: 0,
          totalCommissionTTC: 0,
          totalCommissionPending: 0,
        }
      );

      return { products, totals };
    },
    enabled: !!affiliate,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook Performance Analytics LinkMe
 *
 * Récupère les métriques de performance pour les pages Analytics:
 * - Page globale (/analytics/performance)
 * - Page par affilié (/analytics/performance/[affiliateId])
 * - Page par sélection (/analytics/performance/[affiliateId]/[selectionId])
 *
 * Métriques disponibles:
 * - Panier moyen
 * - Top produits (quantité + CA)
 * - CA généré (HT)
 * - Commissions (TTC)
 * - Nb commandes
 *
 * @module use-performance-analytics
 * @since 2025-12-17
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// Types
// ============================================================================

export type DatePreset = '1m' | '2m' | '3m' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PerformanceFilters {
  dateRange: DateRange;
  affiliateId?: string;
  selectionId?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  quantitySold: number;
  totalRevenueHT: number;
  ordersCount: number;
}

export interface AffiliateListItem {
  id: string;
  displayName: string;
  slug: string;
  ordersCount: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
}

export interface SelectionListItem {
  id: string;
  name: string;
  slug: string;
  affiliateId: string;
  affiliateName: string;
  ordersCount: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
  productsCount: number;
}

export interface PerformanceData {
  // KPIs principaux
  averageBasket: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
  totalOrders: number;

  // Top produits (quantité et CA)
  topProducts: TopProduct[];

  // Drill-down data
  affiliates: AffiliateListItem[];
  selections: SelectionListItem[];

  // Context info (pour le titre de la page)
  affiliateName?: string;
  selectionName?: string;
}

// ============================================================================
// Helpers
// ============================================================================

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const endDate = new Date();
  const startDate = new Date();

  switch (preset) {
    case '1m':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '2m':
      startDate.setMonth(startDate.getMonth() - 2);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  return { startDate, endDate };
}

export function formatDateRange(dateRange: DateRange): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return `${dateRange.startDate.toLocaleDateString('fr-FR', options)} - ${dateRange.endDate.toLocaleDateString('fr-FR', options)}`;
}

// ============================================================================
// Hook Principal
// ============================================================================

export function usePerformanceAnalytics(filters: PerformanceFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: [
      'linkme',
      'performance-analytics',
      filters.dateRange.startDate.toISOString(),
      filters.dateRange.endDate.toISOString(),
      filters.affiliateId ?? 'all',
      filters.selectionId ?? 'all',
    ],
    queryFn: async (): Promise<PerformanceData> => {
      const startISO = filters.dateRange.startDate.toISOString();
      const endISO = filters.dateRange.endDate.toISOString();

      // ========================================
      // 1. Récupérer les commissions filtrées
      // ========================================
      let commissionsQuery = supabase
        .from('linkme_commissions')
        .select(
          `
          id,
          order_id,
          affiliate_id,
          selection_id,
          order_number,
          order_amount_ht,
          affiliate_commission,
          affiliate_commission_ttc,
          created_at,
          affiliate:linkme_affiliates(id, display_name, slug),
          selection:linkme_selections(id, name, slug, products_count)
        `
        )
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      // Filtrer par affilié si spécifié
      if (filters.affiliateId) {
        commissionsQuery = commissionsQuery.eq(
          'affiliate_id',
          filters.affiliateId
        );
      }

      // Filtrer par sélection si spécifié
      if (filters.selectionId) {
        commissionsQuery = commissionsQuery.eq(
          'selection_id',
          filters.selectionId
        );
      }

      const { data: commissionsData, error: commissionsError } =
        await commissionsQuery;

      if (commissionsError) throw commissionsError;

      const commissions = commissionsData ?? [];

      // ========================================
      // 2. Calculs KPIs
      // ========================================
      const totalOrders = commissions.length;
      const totalRevenueHT = commissions.reduce(
        (sum, c) => sum + (c.order_amount_ht ?? 0),
        0
      );
      const totalCommissionsTTC = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
        0
      );
      const averageBasket = totalOrders > 0 ? totalRevenueHT / totalOrders : 0;

      // ========================================
      // 3. Récupérer les order_ids pour les produits
      // ========================================
      const orderIds = commissions
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      let topProducts: TopProduct[] = [];

      if (orderIds.length > 0) {
        // Récupérer les lignes de commande
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('sales_order_items')
          .select(
            `
            id,
            product_id,
            quantity,
            total_ht,
            sales_order_id,
            product:products(id, name, sku)
          `
          )
          .in('sales_order_id', orderIds);

        if (orderItemsError) throw orderItemsError;

        // Récupérer les images primaires des produits
        const productIds = [
          ...new Set(
            (orderItemsData ?? [])
              .map(item => {
                const product = item.product as { id: string } | null;
                return product?.id;
              })
              .filter((id): id is string => !!id)
          ),
        ];

        const productImages = new Map<string, string>();
        if (productIds.length > 0) {
          const { data: imagesData } = await supabase
            .from('product_images')
            .select('product_id, public_url')
            .in('product_id', productIds)
            .eq('is_primary', true);

          (imagesData ?? []).forEach(img => {
            if (img.public_url) {
              productImages.set(img.product_id, img.public_url);
            }
          });
        }

        // Agréger par produit
        const productMap = new Map<
          string,
          {
            id: string;
            name: string;
            sku: string;
            imageUrl: string | null;
            quantitySold: number;
            totalRevenueHT: number;
            orderIds: Set<string>;
          }
        >();

        (orderItemsData ?? []).forEach(item => {
          const product = item.product as {
            id: string;
            name: string;
            sku: string;
          } | null;
          if (!product) return;

          const existing = productMap.get(product.id);
          if (existing) {
            existing.quantitySold += item.quantity ?? 0;
            existing.totalRevenueHT += item.total_ht ?? 0;
            existing.orderIds.add(item.sales_order_id);
          } else {
            productMap.set(product.id, {
              id: product.id,
              name: product.name,
              sku: product.sku ?? '-',
              imageUrl: productImages.get(product.id) ?? null,
              quantitySold: item.quantity ?? 0,
              totalRevenueHT: item.total_ht ?? 0,
              orderIds: new Set([item.sales_order_id]),
            });
          }
        });

        // Convertir et trier par quantité vendue
        topProducts = Array.from(productMap.values())
          .map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            imageUrl: p.imageUrl,
            quantitySold: p.quantitySold,
            totalRevenueHT: p.totalRevenueHT,
            ordersCount: p.orderIds.size,
          }))
          .sort((a, b) => b.quantitySold - a.quantitySold)
          .slice(0, 10);
      }

      // ========================================
      // 4. Agréger par affilié (pour drill-down)
      // ========================================
      const affiliateMap = new Map<
        string,
        {
          id: string;
          displayName: string;
          slug: string;
          ordersCount: number;
          totalRevenueHT: number;
          totalCommissionsTTC: number;
        }
      >();

      commissions.forEach(c => {
        const affiliate = c.affiliate as {
          id: string;
          display_name: string;
          slug: string;
        } | null;
        if (!affiliate) return;

        const existing = affiliateMap.get(affiliate.id);
        if (existing) {
          existing.ordersCount += 1;
          existing.totalRevenueHT += c.order_amount_ht ?? 0;
          existing.totalCommissionsTTC += c.affiliate_commission_ttc ?? 0;
        } else {
          affiliateMap.set(affiliate.id, {
            id: affiliate.id,
            displayName: affiliate.display_name,
            slug: affiliate.slug ?? '',
            ordersCount: 1,
            totalRevenueHT: c.order_amount_ht ?? 0,
            totalCommissionsTTC: c.affiliate_commission_ttc ?? 0,
          });
        }
      });

      const affiliates = Array.from(affiliateMap.values()).sort(
        (a, b) => b.totalRevenueHT - a.totalRevenueHT
      );

      // ========================================
      // 5. Agréger par sélection (pour drill-down)
      // ========================================
      const selectionMap = new Map<
        string,
        {
          id: string;
          name: string;
          slug: string;
          affiliateId: string;
          affiliateName: string;
          ordersCount: number;
          totalRevenueHT: number;
          totalCommissionsTTC: number;
          productsCount: number;
        }
      >();

      commissions.forEach(c => {
        const selection = c.selection as {
          id: string;
          name: string;
          slug: string;
          products_count: number;
        } | null;
        const affiliate = c.affiliate as {
          id: string;
          display_name: string;
        } | null;
        if (!selection) return;

        const existing = selectionMap.get(selection.id);
        if (existing) {
          existing.ordersCount += 1;
          existing.totalRevenueHT += c.order_amount_ht ?? 0;
          existing.totalCommissionsTTC += c.affiliate_commission_ttc ?? 0;
        } else {
          selectionMap.set(selection.id, {
            id: selection.id,
            name: selection.name,
            slug: selection.slug ?? '',
            affiliateId: affiliate?.id ?? '',
            affiliateName: affiliate?.display_name ?? 'Inconnu',
            ordersCount: 1,
            totalRevenueHT: c.order_amount_ht ?? 0,
            totalCommissionsTTC: c.affiliate_commission_ttc ?? 0,
            productsCount: selection.products_count ?? 0,
          });
        }
      });

      const selections = Array.from(selectionMap.values()).sort(
        (a, b) => b.totalRevenueHT - a.totalRevenueHT
      );

      // ========================================
      // 6. Context info (nom affilié/sélection)
      // ========================================
      let affiliateName: string | undefined;
      let selectionName: string | undefined;

      if (filters.affiliateId && commissions.length > 0) {
        const firstCommission = commissions[0];
        const affiliate = firstCommission.affiliate as {
          display_name: string;
        } | null;
        affiliateName = affiliate?.display_name;
      }

      if (filters.selectionId && commissions.length > 0) {
        const firstCommission = commissions[0];
        const selection = firstCommission.selection as {
          name: string;
        } | null;
        selectionName = selection?.name;
      }

      return {
        averageBasket,
        totalRevenueHT,
        totalCommissionsTTC,
        totalOrders,
        topProducts,
        affiliates,
        selections,
        affiliateName,
        selectionName,
      };
    },
    staleTime: 30000, // 30 seconds cache
  });
}

// ============================================================================
// Hook pour liste des affiliés (navigation)
// ============================================================================

export function useAffiliatesList() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'affiliates-list'],
    queryFn: async (): Promise<
      { id: string; displayName: string; slug: string }[]
    > => {
      const { data, error } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, slug')
        .eq('status', 'active')
        .order('display_name');

      if (error) throw error;

      return (data ?? []).map(a => ({
        id: a.id,
        displayName: a.display_name,
        slug: a.slug ?? '',
      }));
    },
    staleTime: 60000, // 1 minute cache
  });
}

// ============================================================================
// Hook pour liste des sélections d'un affilié (navigation)
// ============================================================================

export function useAffiliateSelections(affiliateId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'affiliate-selections', affiliateId],
    queryFn: async (): Promise<
      { id: string; name: string; slug: string; productsCount: number }[]
    > => {
      if (!affiliateId) return [];

      const { data, error } = await supabase
        .from('linkme_selections')
        .select('id, name, slug, products_count')
        .eq('affiliate_id', affiliateId)
        .is('archived_at', null)
        .order('name');

      if (error) throw error;

      return (data ?? []).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug ?? '',
        productsCount: s.products_count ?? 0,
      }));
    },
    enabled: !!affiliateId,
    staleTime: 60000,
  });
}

/**
 * Hook: useAffiliateAnalytics
 * Analytics pour l'affilié connecté (page /statistiques)
 *
 * Récupère toutes les métriques de performance :
 * - KPIs (commandes, CA, commissions)
 * - Évolution CA sur période
 * - Top produits vendus
 * - Performance par sélection
 *
 * Features (React Query):
 * - Automatic caching (1 min stale, 10 min gc)
 * - Deduplication of concurrent requests
 * - Background refetch disabled (manual refresh)
 *
 * @module use-affiliate-analytics
 * @since 2025-12-10
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// Query keys factory for cache management
export const affiliateAnalyticsKeys = {
  all: ['affiliate-analytics'] as const,
  analytics: (affiliateId: string | undefined, period: string) =>
    [...affiliateAnalyticsKeys.all, affiliateId, period] as const,
  selectionProducts: (selectionId: string | null) =>
    [...affiliateAnalyticsKeys.all, 'selection-products', selectionId] as const,
};

import { useUserAffiliate } from './use-user-selection';
import type {
  AnalyticsPeriod,
  AffiliateAnalyticsData,
  RevenueDataPoint,
  CommissionsByStatus,
  SelectionPerformance,
  TopProductData,
} from '../../types/analytics';
import { getPeriodStartDate } from '../../types/analytics';

// ============================================
// HELPERS
// ============================================

function formatDateLabel(date: Date, period: AnalyticsPeriod): string {
  if (period === 'week') {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    });
  }
  if (period === 'month') {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
  if (period === 'quarter') {
    return `S${getWeekNumber(date)}`;
  }
  // Pour 'all' ou 'year': inclure mois + année (ex: "juin 24")
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getDateKey(date: Date, period: AnalyticsPeriod): string {
  if (period === 'week' || period === 'month') {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  if (period === 'quarter') {
    return `${date.getFullYear()}-W${getWeekNumber(date)}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================
// MAIN HOOK
// ============================================

export function useAffiliateAnalytics(period: AnalyticsPeriod = 'all') {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: affiliateAnalyticsKeys.analytics(affiliate?.id, period),
    queryFn: async (): Promise<AffiliateAnalyticsData | null> => {
      if (!affiliate) {
        console.error('❌ ALERTE KPI: Aucun affilié trouvé');
        console.error(
          '   → Vérifier user_app_roles + linkme_affiliates mapping'
        );
        return null;
      }

      const periodStart = getPeriodStartDate(period);
      const periodStartISO = periodStart?.toISOString() ?? null;

      // ============================================
      // 1-2. Requêtes parallèles
      // ============================================
      const [allCommissionsResult, selectionsResult] = await Promise.all([
        // 1. Commissions (sans jointure sales_orders pour éviter erreurs RLS)
        // PERF: Limiter à 500 dernières commissions pour éviter chargement 15+ secondes
        supabase
          .from('linkme_commissions')
          .select(
            `
            id,
            order_id,
            selection_id,
            order_number,
            order_amount_ht,
            affiliate_commission,
            affiliate_commission_ttc,
            linkme_commission,
            margin_rate_applied,
            status,
            created_at,
            validated_at,
            paid_at
          `
          )
          .eq('affiliate_id', affiliate.id)
          .order('created_at', { ascending: false })
          .limit(500),

        // 2. Sélections de l'affilié
        supabase
          .from('linkme_selections')
          .select(
            `
            id,
            name,
            slug,
            image_url,
            products_count,
            views_count,
            orders_count,
            total_revenue,
            published_at
          `
          )
          .eq('affiliate_id', affiliate.id),
      ]);

      if (allCommissionsResult.error) {
        console.error('Erreur fetch commissions:', allCommissionsResult.error);
        throw allCommissionsResult.error;
      }

      const allCommissions = allCommissionsResult.data ?? [];

      // ============================================
      // FILTRAGE PAR PÉRIODE (basé sur created_at de la commission)
      // ============================================
      const commissions = periodStartISO
        ? allCommissions.filter(
            c => c.created_at && c.created_at >= periodStartISO
          )
        : allCommissions;

      // ============================================
      // Calculs par statut - basé sur linkme_commissions.status
      // ============================================
      // pending = commande non payée
      // validated = commande payée, prête pour demande de versement
      // requested = demande de versement en cours
      // paid = commission versée à l'affilié

      const pendingCommissions = commissions.filter(
        c => c.status === 'pending' || c.status === null
      );

      // 'payable' est un alias de 'validated' dans la DB
      const validatedCommissions = commissions.filter(
        c => c.status === 'validated' || c.status === 'payable'
      );

      const requestedCommissions = commissions.filter(
        c => c.status === 'requested'
      );

      const paidCommissions = commissions.filter(c => c.status === 'paid');

      const commissionsByStatus: CommissionsByStatus = {
        pending: {
          count: pendingCommissions.length,
          amountHT: pendingCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission ?? 0),
            0
          ),
          amountTTC: pendingCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
            0
          ),
        },
        validated: {
          count: validatedCommissions.length,
          amountHT: validatedCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission ?? 0),
            0
          ),
          amountTTC: validatedCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
            0
          ),
        },
        requested: {
          count: requestedCommissions.length,
          amountHT: requestedCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission ?? 0),
            0
          ),
          amountTTC: requestedCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
            0
          ),
        },
        paid: {
          count: paidCommissions.length,
          amountHT: paidCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission ?? 0),
            0
          ),
          amountTTC: paidCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
            0
          ),
        },
        total: {
          // Utiliser commissions (filtré par période) pour cohérence avec les autres KPIs
          count: commissions.length,
          amountHT: commissions.reduce(
            (sum, c) => sum + (c.affiliate_commission ?? 0),
            0
          ),
          amountTTC: commissions.reduce(
            (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
            0
          ),
        },
      };

      // ============================================
      // 3. KPIs période
      // ============================================
      const totalOrders = commissions.length;
      const totalRevenueHT = commissions.reduce(
        (sum, c) => sum + (c.order_amount_ht ?? 0),
        0
      );
      const totalCommissionsHT = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission ?? 0),
        0
      );
      const totalCommissionsTTC = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
        0
      );
      const averageBasket = totalOrders > 0 ? totalRevenueHT / totalOrders : 0;

      // Selections deja recuperees dans Promise.all
      if (selectionsResult.error) {
        console.error('Erreur fetch selections:', selectionsResult.error);
        throw selectionsResult.error;
      }

      const selections = selectionsResult.data ?? [];

      // Performance par sélection
      const selectionsPerformance: SelectionPerformance[] = selections.map(
        s => ({
          id: s.id,
          name: s.name,
          slug: s.slug ?? '',
          imageUrl: s.image_url,
          productsCount: s.products_count ?? 0,
          views: s.views_count ?? 0,
          orders: s.orders_count ?? 0,
          revenue: s.total_revenue ?? 0,
          conversionRate:
            (s.views_count ?? 0) > 0
              ? ((s.orders_count ?? 0) / (s.views_count ?? 1)) * 100
              : 0,
          publishedAt: s.published_at,
        })
      );

      // Taux de conversion global
      const totalViews = selections.reduce(
        (sum, s) => sum + (s.views_count ?? 0),
        0
      );
      const conversionRate =
        totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

      // ============================================
      // 5. Revenue par période (graphique) - CA CUMULATIF
      // ============================================
      // IMPORTANT: Utiliser sales_orders.created_at (date commande, pas commission)
      const revenueMap = new Map<
        string,
        { revenue: number; orders: number; label: string }
      >();

      commissions.forEach(c => {
        // Utiliser la date de création de la commission
        const orderDate = c.created_at;

        if (orderDate) {
          const date = new Date(orderDate);
          const key = getDateKey(date, period);
          const label = formatDateLabel(date, period);

          if (!revenueMap.has(key)) {
            revenueMap.set(key, { revenue: 0, orders: 0, label });
          }

          const entry = revenueMap.get(key)!;
          entry.revenue += c.order_amount_ht ?? 0;
          entry.orders += 1;
        }
      });

      // Calculer le CA CUMULATIF (ligne qui ne fait que monter)
      let cumulativeRevenue = 0;
      const revenueByPeriod: RevenueDataPoint[] = Array.from(
        revenueMap.entries()
      )
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => {
          cumulativeRevenue += data.revenue;
          return {
            date,
            label: data.label,
            revenue: cumulativeRevenue, // CA cumulatif
            orders: data.orders,
          };
        });

      // ============================================
      // 6. Top produits vendus (ALL TIME - pas filtré par période)
      // ============================================
      // Utiliser allCommissions pour avoir TOUS les produits vendus
      const orderIds = allCommissions
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      let topProducts: TopProductData[] = [];

      let totalQuantitySoldAllTime = 0;

      if (orderIds.length > 0) {
        // Utiliser linkme_order_items_enriched qui calcule correctement affiliate_margin
        // à partir de linkme_selection_items.base_price_ht × margin_rate / 100 × quantity
        // PERF: Limiter aux 100 dernières commandes pour top produits
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('linkme_order_items_enriched')
          .select(
            `
            product_id,
            quantity,
            total_ht,
            affiliate_margin
          `
          )
          .in('sales_order_id', orderIds.slice(0, 100));

        if (orderItemsError) {
          // Erreur non bloquante - continuer avec tableau vide
        }

        const orderItems = orderItemsData ?? [];

        // Agréger par produit
        const productMap = new Map<
          string,
          { quantity: number; revenue: number; commission: number }
        >();

        orderItems.forEach(item => {
          const productId = item.product_id;
          const qty = item.quantity ?? 0;

          // Ajouter à la somme totale des quantités
          totalQuantitySoldAllTime += qty;

          // Ignorer les items sans product_id pour l'agrégation par produit
          if (!productId) return;

          if (!productMap.has(productId)) {
            productMap.set(productId, {
              quantity: 0,
              revenue: 0,
              commission: 0,
            });
          }
          const entry = productMap.get(productId)!;
          entry.quantity += qty;
          entry.revenue += item.total_ht ?? 0;
          // SOURCE DE VÉRITÉ: affiliate_margin depuis linkme_order_items_enriched
          entry.commission += item.affiliate_margin ?? 0;
        });

        // Récupérer les infos produits
        const productIds = Array.from(productMap.keys());

        if (productIds.length > 0) {
          // Requetes paralleles pour products et images
          const [productsResult, imagesResult] = await Promise.all([
            supabase
              .from('products')
              .select('id, name, sku, created_by_affiliate')
              .in('id', productIds),
            supabase
              .from('product_images')
              .select('product_id, public_url')
              .in('product_id', productIds)
              .eq('is_primary', true),
          ]);

          const imageMap = new Map(
            (imagesResult.data ?? []).map(img => [
              img.product_id,
              img.public_url,
            ])
          );

          const productsInfo = new Map(
            (productsResult.data ?? []).map(p => [
              p.id,
              {
                name: p.name,
                sku: p.sku,
                createdByAffiliate: p.created_by_affiliate,
              },
            ])
          );

          topProducts = Array.from(productMap.entries())
            .map(([productId, data]) => {
              const info = productsInfo.get(productId);
              return {
                productId,
                productName: info?.name ?? 'Produit inconnu',
                productSku: info?.sku ?? '',
                productImageUrl: imageMap.get(productId) ?? null,
                quantitySold: data.quantity,
                revenueHT: data.revenue,
                commissionHT: data.commission,
                isRevendeur: !!info?.createdByAffiliate,
              };
            })
            .sort((a, b) => b.commissionHT - a.commissionHT)
            .slice(0, 10);
        }
      }

      // ============================================
      // RETURN DATA
      // ============================================
      return {
        // KPIs de la periode selectionnee
        totalOrders,
        totalRevenueHT,
        totalCommissionsHT,
        totalCommissionsTTC,
        totalQuantitySold: totalQuantitySoldAllTime,
        // KPIs ALL TIME (pour page Commissions)
        // IMPORTANT: Utiliser les valeurs ALL TIME de commissionsByStatus
        totalCommissionsTTCAllTime: commissionsByStatus.total.amountTTC,
        pendingCommissionsHT: commissionsByStatus.pending.amountHT,
        pendingCommissionsTTC: commissionsByStatus.pending.amountTTC,
        validatedCommissionsHT: commissionsByStatus.validated.amountHT,
        validatedCommissionsTTC: commissionsByStatus.validated.amountTTC,
        paidCommissionsHT: commissionsByStatus.paid.amountHT,
        paidCommissionsTTC: commissionsByStatus.paid.amountTTC,
        averageBasket,
        conversionRate,
        totalViews,
        revenueByPeriod,
        commissionsByStatus,
        selectionsPerformance: selectionsPerformance.sort(
          (a, b) => b.revenue - a.revenue
        ),
        topProducts,
      };
    },
    enabled: !!affiliate,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook: Top produits d'une sélection spécifique
 */
export function useSelectionTopProducts(selectionId: string | null) {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: affiliateAnalyticsKeys.selectionProducts(selectionId),
    queryFn: async (): Promise<TopProductData[]> => {
      if (!selectionId || !affiliate) return [];

      // Récupérer les commissions de cette sélection
      const { data: commissionsData } = await supabase
        .from('linkme_commissions')
        .select('order_id')
        .eq('affiliate_id', affiliate.id)
        .eq('selection_id', selectionId);

      const orderIds = (commissionsData ?? [])
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      if (orderIds.length === 0) return [];

      // Récupérer les items depuis la vue enrichie (source de vérité)
      const { data: orderItemsData } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          `
          product_id,
          quantity,
          total_ht,
          affiliate_margin
        `
        )
        .in('sales_order_id', orderIds);

      const orderItems = orderItemsData ?? [];

      // Agréger par produit
      const productMap = new Map<
        string,
        { quantity: number; revenue: number; commission: number }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productId) return; // Skip items without product_id
        if (!productMap.has(productId)) {
          productMap.set(productId, { quantity: 0, revenue: 0, commission: 0 });
        }
        const entry = productMap.get(productId)!;
        entry.quantity += item.quantity ?? 0;
        entry.revenue += item.total_ht ?? 0;
        entry.commission += item.affiliate_margin ?? 0;
      });

      const productIds = Array.from(productMap.keys());

      if (productIds.length === 0) return [];

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku')
        .in('id', productIds);

      const { data: imagesData } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', productIds)
        .eq('is_primary', true);

      const imageMap = new Map(
        (imagesData ?? []).map(img => [img.product_id, img.public_url])
      );

      const productsInfo = new Map(
        (productsData ?? []).map(p => [p.id, { name: p.name, sku: p.sku }])
      );

      return Array.from(productMap.entries())
        .map(([productId, data]) => {
          const info = productsInfo.get(productId);
          return {
            productId,
            productName: info?.name ?? 'Produit inconnu',
            productSku: info?.sku ?? '',
            productImageUrl: imageMap.get(productId) ?? null,
            quantitySold: data.quantity,
            revenueHT: data.revenue,
            commissionHT: data.commission,
            selectionId,
          };
        })
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);
    },
    enabled: !!selectionId && !!affiliate,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to invalidate affiliate analytics cache
 * Useful after placing orders or commission updates
 */
export function useInvalidateAffiliateAnalytics() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: affiliateAnalyticsKeys.all }),
    invalidateAnalytics: (affiliateId: string, period: string) =>
      queryClient.invalidateQueries({
        queryKey: affiliateAnalyticsKeys.analytics(affiliateId, period),
      }),
    invalidateSelectionProducts: (selectionId: string) =>
      queryClient.invalidateQueries({
        queryKey: affiliateAnalyticsKeys.selectionProducts(selectionId),
      }),
  };
}

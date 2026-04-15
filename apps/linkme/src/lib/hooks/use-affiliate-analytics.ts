'use client';

/**
 * Hook: useAffiliateAnalytics
 * Analytics pour l'affilié connecté (page /statistiques)
 *
 * @module use-affiliate-analytics
 * @since 2025-12-10
 * @updated 2026-04-14 - Refactoring: extraction helpers + useSelectionTopProducts
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

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
import { formatDateLabel, getDateKey } from './use-affiliate-analytics-helpers';

// Re-exports for backward compatibility
export { useSelectionTopProducts } from './use-selection-top-products';

const supabase = createClient();

// Query keys factory
export const affiliateAnalyticsKeys = {
  all: ['affiliate-analytics'] as const,
  analytics: (affiliateId: string | undefined, period: string) =>
    [...affiliateAnalyticsKeys.all, affiliateId, period] as const,
  selectionProducts: (selectionId: string | null) =>
    [...affiliateAnalyticsKeys.all, 'selection-products', selectionId] as const,
};

export function useAffiliateAnalytics(period: AnalyticsPeriod = 'all') {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: affiliateAnalyticsKeys.analytics(affiliate?.id, period),
    queryFn: async (): Promise<AffiliateAnalyticsData | null> => {
      if (!affiliate) {
        console.error('❌ ALERTE KPI: Aucun affilié trouvé');
        return null;
      }

      const periodStart = getPeriodStartDate(period);
      const periodStartISO = periodStart?.toISOString() ?? null;

      let commissionsQuery = supabase
        .from('linkme_commissions')
        .select(
          `id, order_id, selection_id, order_number, order_amount_ht,
          affiliate_commission, affiliate_commission_ttc, total_payout_ht,
          total_payout_ttc, linkme_commission, margin_rate_applied, status,
          created_at, validated_at, paid_at, sales_order:order_id(order_date)`
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (periodStartISO) {
        commissionsQuery = commissionsQuery.gte('created_at', periodStartISO);
      }

      const [commissionsResult, selectionsResult] = await Promise.all([
        commissionsQuery,
        supabase
          .from('linkme_selections')
          .select(
            'id, name, slug, image_url, products_count, views_count, orders_count, total_revenue, published_at'
          )
          .eq('affiliate_id', affiliate.id),
      ]);

      if (commissionsResult.error) throw commissionsResult.error;
      if (selectionsResult.error) throw selectionsResult.error;

      const commissions = commissionsResult.data ?? [];
      const allCommissions = commissions;

      // Commissions par statut
      const pendingCommissions = commissions.filter(
        c => c.status === 'pending' || c.status === null
      );
      const validatedCommissions = commissions.filter(
        c => c.status === 'validated' || c.status === 'payable'
      );
      const requestedCommissions = commissions.filter(
        c => c.status === 'requested'
      );
      const paidCommissions = commissions.filter(c => c.status === 'paid');

      const sumHT = (arr: typeof commissions) =>
        arr.reduce(
          (sum, c) => sum + (c.total_payout_ht ?? c.affiliate_commission ?? 0),
          0
        );
      const sumTTC = (arr: typeof commissions) =>
        arr.reduce(
          (sum, c) =>
            sum + (c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0),
          0
        );

      const commissionsByStatus: CommissionsByStatus = {
        pending: {
          count: pendingCommissions.length,
          amountHT: sumHT(pendingCommissions),
          amountTTC: sumTTC(pendingCommissions),
        },
        validated: {
          count: validatedCommissions.length,
          amountHT: sumHT(validatedCommissions),
          amountTTC: sumTTC(validatedCommissions),
        },
        requested: {
          count: requestedCommissions.length,
          amountHT: sumHT(requestedCommissions),
          amountTTC: sumTTC(requestedCommissions),
        },
        paid: {
          count: paidCommissions.length,
          amountHT: sumHT(paidCommissions),
          amountTTC: sumTTC(paidCommissions),
        },
        total: {
          count: commissions.length,
          amountHT: sumHT(commissions),
          amountTTC: sumTTC(commissions),
        },
      };

      // KPIs
      const totalOrders = commissions.length;
      const totalRevenueHT = commissions.reduce(
        (sum, c) => sum + (c.order_amount_ht ?? 0),
        0
      );
      const totalCommissionsHT = sumHT(commissions);
      const totalCommissionsTTC = sumTTC(commissions);
      const averageBasket = totalOrders > 0 ? totalRevenueHT / totalOrders : 0;

      const selections = selectionsResult.data ?? [];

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

      const totalViews = selections.reduce(
        (sum, s) => sum + (s.views_count ?? 0),
        0
      );
      const conversionRate =
        totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

      // Revenue par période (graphique cumulatif)
      const revenueMap = new Map<
        string,
        { revenue: number; orders: number; label: string }
      >();
      commissions.forEach(c => {
        const orderDate =
          (c.sales_order as { order_date: string | null } | null)?.order_date ??
          c.created_at;
        if (orderDate) {
          const date = new Date(orderDate);
          const key = getDateKey(date, period);
          const label = formatDateLabel(date, period);
          if (!revenueMap.has(key))
            revenueMap.set(key, { revenue: 0, orders: 0, label });
          const entry = revenueMap.get(key)!;
          entry.revenue += c.order_amount_ht ?? 0;
          entry.orders += 1;
        }
      });

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
            revenue: cumulativeRevenue,
            orders: data.orders,
          };
        });

      // Top produits
      const orderIds = allCommissions
        .map(c => c.order_id)
        .filter((id): id is string => !!id);
      let topProducts: TopProductData[] = [];
      let totalQuantitySoldAllTime = 0;

      if (orderIds.length > 0) {
        const { data: orderItemsData } = await supabase
          .from('linkme_order_items_enriched')
          .select('product_id, quantity, total_ht, affiliate_margin')
          .in('sales_order_id', orderIds.slice(0, 100));

        const orderItems = orderItemsData ?? [];
        const productMap = new Map<
          string,
          { quantity: number; revenue: number; commission: number }
        >();

        orderItems.forEach(item => {
          const productId = item.product_id;
          totalQuantitySoldAllTime += item.quantity ?? 0;
          if (!productId) return;
          if (!productMap.has(productId))
            productMap.set(productId, {
              quantity: 0,
              revenue: 0,
              commission: 0,
            });
          const entry = productMap.get(productId)!;
          entry.quantity += item.quantity ?? 0;
          entry.revenue += item.total_ht ?? 0;
          entry.commission += item.affiliate_margin ?? 0;
        });

        const productIds = Array.from(productMap.keys());
        if (productIds.length > 0) {
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

      return {
        totalOrders,
        totalRevenueHT,
        totalCommissionsHT,
        totalCommissionsTTC,
        totalQuantitySold: totalQuantitySoldAllTime,
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useInvalidateAffiliateAnalytics() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: async () => {
      await queryClient.invalidateQueries({
        queryKey: affiliateAnalyticsKeys.all,
      });
    },
    invalidateAnalytics: async (affiliateId: string, period: string) => {
      await queryClient.invalidateQueries({
        queryKey: affiliateAnalyticsKeys.analytics(affiliateId, period),
      });
    },
    invalidateSelectionProducts: async (selectionId: string) => {
      await queryClient.invalidateQueries({
        queryKey: affiliateAnalyticsKeys.selectionProducts(selectionId),
      });
    },
  };
}

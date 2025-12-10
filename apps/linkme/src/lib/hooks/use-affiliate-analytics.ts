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
 * @module use-affiliate-analytics
 * @since 2025-12-10
 */

import { useQuery } from '@tanstack/react-query';

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
import { supabase } from '../supabase';

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
  return date.toLocaleDateString('fr-FR', { month: 'short' });
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

export function useAffiliateAnalytics(period: AnalyticsPeriod = 'month') {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['affiliate-analytics', affiliate?.id, period],
    queryFn: async (): Promise<AffiliateAnalyticsData | null> => {
      if (!affiliate) return null;

      const periodStart = getPeriodStartDate(period);
      const periodStartISO = periodStart.toISOString();

      // ============================================
      // 1. Commissions de l'affilié (période)
      // ============================================
      const { data: commissionsData, error: commissionsError } = await supabase
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
        .gte('created_at', periodStartISO)
        .order('created_at', { ascending: true });

      if (commissionsError) {
        console.error('Erreur fetch commissions:', commissionsError);
        throw commissionsError;
      }

      const commissions = commissionsData || [];

      // ============================================
      // 2. Commissions ALL TIME (pour status)
      // ============================================
      const { data: allCommissionsData } = await supabase
        .from('linkme_commissions')
        .select('status, affiliate_commission, affiliate_commission_ttc')
        .eq('affiliate_id', affiliate.id);

      const allCommissions = allCommissionsData || [];

      // Calculs par statut
      const commissionsByStatus: CommissionsByStatus = {
        pending: {
          count: allCommissions.filter(c => c.status === 'pending').length,
          amountHT: allCommissions
            .filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + (c.affiliate_commission || 0), 0),
          amountTTC: allCommissions
            .filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + (c.affiliate_commission_ttc || 0), 0),
        },
        validated: {
          count: allCommissions.filter(c => c.status === 'validated').length,
          amountHT: allCommissions
            .filter(c => c.status === 'validated')
            .reduce((sum, c) => sum + (c.affiliate_commission || 0), 0),
          amountTTC: allCommissions
            .filter(c => c.status === 'validated')
            .reduce((sum, c) => sum + (c.affiliate_commission_ttc || 0), 0),
        },
        paid: {
          count: allCommissions.filter(c => c.status === 'paid').length,
          amountHT: allCommissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + (c.affiliate_commission || 0), 0),
          amountTTC: allCommissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + (c.affiliate_commission_ttc || 0), 0),
        },
        total: {
          count: allCommissions.length,
          amountHT: allCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission || 0),
            0
          ),
          amountTTC: allCommissions.reduce(
            (sum, c) => sum + (c.affiliate_commission_ttc || 0),
            0
          ),
        },
      };

      // ============================================
      // 3. KPIs période
      // ============================================
      const totalOrders = commissions.length;
      const totalRevenueHT = commissions.reduce(
        (sum, c) => sum + (c.order_amount_ht || 0),
        0
      );
      const totalCommissionsHT = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission || 0),
        0
      );
      const totalCommissionsTTC = commissions.reduce(
        (sum, c) => sum + (c.affiliate_commission_ttc || 0),
        0
      );
      const averageBasket = totalOrders > 0 ? totalRevenueHT / totalOrders : 0;

      // ============================================
      // 4. Sélections de l'affilié
      // ============================================
      const { data: selectionsData, error: selectionsError } = await supabase
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
        .eq('affiliate_id', affiliate.id);

      if (selectionsError) {
        console.error('Erreur fetch selections:', selectionsError);
        throw selectionsError;
      }

      const selections = selectionsData || [];

      // Performance par sélection
      const selectionsPerformance: SelectionPerformance[] = selections.map(
        s => ({
          id: s.id,
          name: s.name,
          slug: s.slug || '',
          imageUrl: s.image_url,
          productsCount: s.products_count || 0,
          views: s.views_count || 0,
          orders: s.orders_count || 0,
          revenue: s.total_revenue || 0,
          conversionRate:
            (s.views_count || 0) > 0
              ? ((s.orders_count || 0) / (s.views_count || 1)) * 100
              : 0,
          publishedAt: s.published_at,
        })
      );

      // Taux de conversion global
      const totalViews = selections.reduce(
        (sum, s) => sum + (s.views_count || 0),
        0
      );
      const conversionRate =
        totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

      // ============================================
      // 5. Revenue par période (graphique)
      // ============================================
      const revenueMap = new Map<
        string,
        { revenue: number; orders: number; label: string }
      >();

      commissions.forEach(c => {
        if (c.created_at) {
          const date = new Date(c.created_at);
          const key = getDateKey(date, period);
          const label = formatDateLabel(date, period);

          if (!revenueMap.has(key)) {
            revenueMap.set(key, { revenue: 0, orders: 0, label });
          }

          const entry = revenueMap.get(key)!;
          entry.revenue += c.order_amount_ht || 0;
          entry.orders += 1;
        }
      });

      const revenueByPeriod: RevenueDataPoint[] = Array.from(
        revenueMap.entries()
      )
        .map(([date, data]) => ({
          date,
          label: data.label,
          revenue: data.revenue,
          orders: data.orders,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ============================================
      // 6. Top produits vendus
      // ============================================
      // Récupérer les order_ids des commissions
      const orderIds = commissions
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      let topProducts: TopProductData[] = [];

      if (orderIds.length > 0) {
        // Récupérer les items de commande
        const { data: orderItemsData } = await supabase
          .from('sales_order_items')
          .select(
            `
            product_id,
            quantity,
            total_ht,
            retrocession_amount
          `
          )
          .in('sales_order_id', orderIds);

        const orderItems = orderItemsData || [];

        // Agréger par produit
        const productMap = new Map<
          string,
          { quantity: number; revenue: number; commission: number }
        >();

        orderItems.forEach(item => {
          const productId = item.product_id;
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              quantity: 0,
              revenue: 0,
              commission: 0,
            });
          }
          const entry = productMap.get(productId)!;
          entry.quantity += item.quantity || 0;
          entry.revenue += item.total_ht || 0;
          entry.commission += item.retrocession_amount || 0;
        });

        // Récupérer les infos produits
        const productIds = Array.from(productMap.keys());

        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, sku')
            .in('id', productIds);

          // Récupérer les images
          const { data: imagesData } = await supabase
            .from('product_images')
            .select('product_id, public_url')
            .in('product_id', productIds)
            .eq('is_primary', true);

          const imageMap = new Map(
            (imagesData || []).map(img => [img.product_id, img.public_url])
          );

          const productsInfo = new Map(
            (productsData || []).map(p => [p.id, { name: p.name, sku: p.sku }])
          );

          topProducts = Array.from(productMap.entries())
            .map(([productId, data]) => {
              const info = productsInfo.get(productId);
              return {
                productId,
                productName: info?.name || 'Produit inconnu',
                productSku: info?.sku || '',
                productImageUrl: imageMap.get(productId) || null,
                quantitySold: data.quantity,
                revenueHT: data.revenue,
                commissionHT: data.commission,
              };
            })
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 10);
        }
      }

      // ============================================
      // RETURN DATA
      // ============================================
      return {
        totalOrders,
        totalRevenueHT,
        totalCommissionsHT,
        totalCommissionsTTC,
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
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook: Top produits d'une sélection spécifique
 */
export function useSelectionTopProducts(selectionId: string | null) {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['selection-top-products', selectionId],
    queryFn: async (): Promise<TopProductData[]> => {
      if (!selectionId || !affiliate) return [];

      // Récupérer les commissions de cette sélection
      const { data: commissionsData } = await supabase
        .from('linkme_commissions')
        .select('order_id')
        .eq('affiliate_id', affiliate.id)
        .eq('selection_id', selectionId);

      const orderIds = (commissionsData || [])
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      if (orderIds.length === 0) return [];

      // Récupérer les items
      const { data: orderItemsData } = await supabase
        .from('sales_order_items')
        .select(
          `
          product_id,
          quantity,
          total_ht,
          retrocession_amount
        `
        )
        .in('sales_order_id', orderIds);

      const orderItems = orderItemsData || [];

      // Agréger par produit
      const productMap = new Map<
        string,
        { quantity: number; revenue: number; commission: number }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, { quantity: 0, revenue: 0, commission: 0 });
        }
        const entry = productMap.get(productId)!;
        entry.quantity += item.quantity || 0;
        entry.revenue += item.total_ht || 0;
        entry.commission += item.retrocession_amount || 0;
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
        (imagesData || []).map(img => [img.product_id, img.public_url])
      );

      const productsInfo = new Map(
        (productsData || []).map(p => [p.id, { name: p.name, sku: p.sku }])
      );

      return Array.from(productMap.entries())
        .map(([productId, data]) => {
          const info = productsInfo.get(productId);
          return {
            productId,
            productName: info?.name || 'Produit inconnu',
            productSku: info?.sku || '',
            productImageUrl: imageMap.get(productId) || null,
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
    staleTime: 60000,
  });
}

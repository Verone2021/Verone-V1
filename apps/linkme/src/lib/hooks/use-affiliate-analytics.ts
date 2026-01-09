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
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

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
    queryKey: ['affiliate-analytics', affiliate?.id, period],
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
      // 1-3. Requêtes parallèles
      // ============================================
      // IMPORTANT: On récupère TOUTES les commissions avec jointure sales_orders
      // puis on filtre côté client par sales_orders.created_at (DATE DE COMMANDE)
      const [allCommissionsResult, selectionsResult] = await Promise.all([
        // 1. Commissions avec jointure sales_orders (SOURCE DE VÉRITÉ)
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
            paid_at,
            sales_orders(
              payment_status,
              created_at
            )
          `
          )
          .eq('affiliate_id', affiliate.id)
          .order('created_at', { ascending: true }),

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
      // HELPER: Extraire sales_orders (peut être objet ou tableau selon PostgREST)
      // ============================================
      const getSalesOrder = (c: (typeof allCommissions)[0]) => {
        const so = c.sales_orders;
        if (!so) return null;
        // Si c'est un tableau, prendre le premier élément
        if (Array.isArray(so)) return so[0] ?? null;
        return so;
      };

      // ============================================
      // FILTRAGE PAR PÉRIODE (basé sur sales_orders.created_at)
      // ============================================
      // Si period = 'all', on garde toutes les commissions
      // Sinon, on filtre par la date de commande (pas la date de commission)
      const commissions = periodStartISO
        ? allCommissions.filter(c => {
            const salesOrder = getSalesOrder(c);
            const orderDate = salesOrder?.created_at;
            return orderDate && orderDate >= periodStartISO;
          })
        : allCommissions;

      // ============================================
      // Calculs par statut - SOURCE DE VÉRITÉ: sales_orders.payment_status
      // ============================================
      // IMPORTANT: On utilise `commissions` (filtré par période) pour les KPIs
      // pending = client n'a PAS payé (payment_status !== 'paid')
      // validated = client a payé ET pas de demande de paiement (PAYABLE)
      // requested = demande de paiement en cours
      // paid = commission payée à l'affilié

      const pendingCommissions = commissions.filter(c => {
        const salesOrder = getSalesOrder(c);
        return salesOrder?.payment_status !== 'paid';
      });

      const validatedCommissions = commissions.filter(c => {
        const salesOrder = getSalesOrder(c);
        // Payable = client a payé ET commission pas encore demandée/payée à l'affilié
        // status peut être null, 'pending', ou 'validated' - tous sont payables
        return (
          salesOrder?.payment_status === 'paid' &&
          !['requested', 'paid'].includes(c.status ?? '')
        );
      });

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

      // Selections deja recuperees dans Promise.all
      if (selectionsResult.error) {
        console.error('Erreur fetch selections:', selectionsResult.error);
        throw selectionsResult.error;
      }

      const selections = selectionsResult.data || [];

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
      // 5. Revenue par période (graphique) - CA CUMULATIF
      // ============================================
      // IMPORTANT: Utiliser sales_orders.created_at (date commande, pas commission)
      const revenueMap = new Map<
        string,
        { revenue: number; orders: number; label: string }
      >();

      commissions.forEach(c => {
        // Utiliser la DATE DE COMMANDE (pas la date de commission)
        const salesOrder = getSalesOrder(c);
        const orderDate = salesOrder?.created_at;

        if (orderDate) {
          const date = new Date(orderDate);
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

      if (orderIds.length > 0) {
        // Utiliser linkme_order_items_enriched qui calcule correctement affiliate_margin
        // à partir de linkme_selection_items.base_price_ht × margin_rate / 100 × quantity
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
          .in('sales_order_id', orderIds);

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
          // Ignorer les items sans product_id
          if (!productId) return;

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
          // SOURCE DE VÉRITÉ: affiliate_margin depuis linkme_order_items_enriched
          entry.commission += item.affiliate_margin || 0;
        });

        // Récupérer les infos produits
        const productIds = Array.from(productMap.keys());

        if (productIds.length > 0) {
          // Requetes paralleles pour products et images
          const [productsResult, imagesResult] = await Promise.all([
            supabase
              .from('products')
              .select('id, name, sku')
              .in('id', productIds),
            supabase
              .from('product_images')
              .select('product_id, public_url')
              .in('product_id', productIds)
              .eq('is_primary', true),
          ]);

          const imageMap = new Map(
            (imagesResult.data || []).map(img => [
              img.product_id,
              img.public_url,
            ])
          );

          const productsInfo = new Map(
            (productsResult.data || []).map(p => [
              p.id,
              { name: p.name, sku: p.sku },
            ])
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

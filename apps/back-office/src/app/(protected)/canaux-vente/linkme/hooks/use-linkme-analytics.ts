/**
 * Hook Analytics LinkMe
 * Récupère toutes les métriques pour le dashboard Analytics
 *
 * @param period - Période de filtrage (week, month, quarter, year)
 * @param dateOptions - Options de date avancées (année, startDate, endDate)
 * @returns Données analytics + états loading/error
 *
 * Refonte 2025-12-17:
 * - Support filtrage par année + période
 * - Utilisation des dates explicites au lieu de rolling window
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface DateOptions {
  year?: number; // 0 = Tout (pas de filtrage de date)
  startDate?: Date;
  endDate?: Date;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface TopAffiliateData {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  commissions: number;
}

export interface SelectionPerformance {
  id: string;
  name: string;
  slug: string;
  affiliateName: string;
  productsCount: number;
  views: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface CommissionsByStatus {
  pendingHT: number;
  validatedHT: number;
  paidHT: number;
  pendingTTC: number;
  validatedTTC: number;
  paidTTC: number;
}

export interface PendingCommission {
  id: string;
  affiliateName: string;
  amount: number;
  orderNumber: string;
  date: string;
}

export interface LinkMeAnalyticsData {
  // KPI principales
  activeAffiliates: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;

  // Graphiques
  revenueByPeriod: RevenueDataPoint[];
  topAffiliates: TopAffiliateData[];

  // Sélections
  selectionsPerformance: SelectionPerformance[];

  // Commissions
  commissionsByStatus: CommissionsByStatus;
  topPendingCommissions: PendingCommission[];

  // KPI secondaires
  totalSelections: number;
  averageBasket: number;
  totalPaidCommissionsHT: number;
  totalPaidCommissionsTTC: number;
}

// ============================================
// HELPERS
// ============================================

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

function formatDateLabel(date: Date, period: AnalyticsPeriod): string {
  if (period === 'week' || period === 'month') {
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

// ============================================
// HOOK
// ============================================

export function useLinkMeAnalytics(
  period: AnalyticsPeriod = 'month',
  dateOptions?: DateOptions
) {
  const [data, setData] = useState<LinkMeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize dateOptions for dependency array
  const startDateISO = dateOptions?.startDate?.toISOString();
  const endDateISO = dateOptions?.endDate?.toISOString();
  const year = dateOptions?.year;

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    // Si year = 0 (Tout), on ne filtre pas par date
    const isAllTime = year === 0;

    // Utiliser les dates explicites si fournies, sinon rolling window
    let periodStartISO: string | null = null;
    let periodEndISO: string | null = null;

    if (!isAllTime) {
      if (startDateISO && endDateISO) {
        periodStartISO = startDateISO;
        periodEndISO = endDateISO;
      } else {
        periodStartISO = getPeriodStart(period).toISOString();
        periodEndISO = new Date().toISOString();
      }
    }

    try {
      // ============================================
      // 1. KPI: Affiliés actifs (total, pas filtré par période)
      // ============================================
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('linkme_affiliates')
        .select('id, status')
        .eq('status', 'active');

      if (affiliatesError) throw affiliatesError;
      const activeAffiliates = affiliatesData?.length || 0;

      // ============================================
      // 2. Commissions (filtrées par période/année OU toutes si isAllTime)
      // ============================================
      let commissionsQuery = supabase.from('linkme_commissions').select(
        `
          id,
          affiliate_id,
          order_amount_ht,
          affiliate_commission,
          affiliate_commission_ttc,
          status,
          order_number,
          created_at,
          affiliate:linkme_affiliates(display_name)
        `
      );

      // Appliquer filtres de date seulement si pas "Tout"
      if (!isAllTime && periodStartISO && periodEndISO) {
        commissionsQuery = commissionsQuery
          .gte('created_at', periodStartISO)
          .lte('created_at', periodEndISO);
      }

      const { data: commissionsData, error: commissionsError } =
        await commissionsQuery.order('created_at', { ascending: true });

      if (commissionsError) throw commissionsError;

      // Calculs agrégés
      const commissions = commissionsData || [];
      const totalOrders = commissions.length;
      const totalRevenue = commissions.reduce(
        (sum, c) => sum + (c.order_amount_ht || 0),
        0
      );
      const averageBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // ============================================
      // 3. Commissions par statut (filtrées aussi par période)
      // ============================================
      const commissionsByStatus: CommissionsByStatus = {
        // Montants HT
        pendingHT: commissions
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + (c.affiliate_commission || 0), 0),
        validatedHT: commissions
          .filter(c => c.status === 'validated')
          .reduce((sum, c) => sum + (c.affiliate_commission || 0), 0),
        paidHT: commissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + (c.affiliate_commission || 0), 0),
        // Montants TTC
        pendingTTC: commissions
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + (c.affiliate_commission_ttc || 0), 0),
        validatedTTC: commissions
          .filter(c => c.status === 'validated')
          .reduce((sum, c) => sum + (c.affiliate_commission_ttc || 0), 0),
        paidTTC: commissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + (c.affiliate_commission_ttc || 0), 0),
      };

      const totalPaidCommissionsHT = commissionsByStatus.paidHT;
      const totalPaidCommissionsTTC = commissionsByStatus.paidTTC;

      // ============================================
      // 4. Revenue by period (graphique)
      // ============================================
      const revenueMap = new Map<string, number>();
      commissions.forEach(c => {
        if (c.created_at) {
          const date = new Date(c.created_at);
          const label = formatDateLabel(date, period);
          revenueMap.set(
            label,
            (revenueMap.get(label) || 0) + (c.order_amount_ht || 0)
          );
        }
      });

      const revenueByPeriod: RevenueDataPoint[] = Array.from(
        revenueMap.entries()
      ).map(([date, revenue]) => ({ date, revenue }));

      // ============================================
      // 5. Top Affiliés
      // ============================================
      const affiliateMap = new Map<
        string,
        { name: string; revenue: number; orders: number; commissions: number }
      >();

      commissions.forEach(c => {
        const affiliateId = c.affiliate_id;
        const affiliateName =
          (c.affiliate as { display_name: string } | null)?.display_name ||
          'Inconnu';

        if (!affiliateMap.has(affiliateId)) {
          affiliateMap.set(affiliateId, {
            name: affiliateName,
            revenue: 0,
            orders: 0,
            commissions: 0,
          });
        }

        const aff = affiliateMap.get(affiliateId)!;
        aff.revenue += c.order_amount_ht || 0;
        aff.orders += 1;
        aff.commissions += c.affiliate_commission_ttc || 0;
      });

      const topAffiliates: TopAffiliateData[] = Array.from(
        affiliateMap.entries()
      )
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // ============================================
      // 6. Top Commissions en attente (dans la période)
      // ============================================
      const topPendingCommissions: PendingCommission[] = commissions
        .filter(c => c.status === 'pending' || c.status === 'validated')
        .sort(
          (a, b) =>
            (b.affiliate_commission_ttc || 0) -
            (a.affiliate_commission_ttc || 0)
        )
        .slice(0, 5)
        .map((c, index) => ({
          id: String(index),
          affiliateName:
            (c.affiliate as { display_name: string } | null)?.display_name ||
            'Affilié',
          amount: c.affiliate_commission_ttc || 0,
          orderNumber: c.order_number || '-',
          date: c.created_at
            ? new Date(c.created_at).toLocaleDateString('fr-FR')
            : '-',
        }));

      // ============================================
      // 7. Sélections (total + performance)
      // ============================================
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('linkme_selections')
        .select(
          `
          id,
          name,
          slug,
          views_count,
          products_count,
          orders_count,
          total_revenue,
          affiliate_id,
          affiliate:linkme_affiliates(display_name)
        `
        )
        .not('published_at', 'is', null);

      if (selectionsError) throw selectionsError;

      const selections = selectionsData || [];
      const totalSelections = selections.length;

      // Performance par sélection
      const selectionsPerformance: SelectionPerformance[] = selections.map(
        s => {
          const views = s.views_count || 0;
          const orders = s.orders_count || 0;

          return {
            id: s.id,
            name: s.name,
            slug: s.slug ?? '',
            affiliateName:
              (s.affiliate as { display_name: string } | null)?.display_name ||
              'Inconnu',
            productsCount: s.products_count || 0,
            views,
            orders,
            revenue: s.total_revenue || 0,
            conversionRate: views > 0 ? (orders / views) * 100 : 0,
          };
        }
      );

      // Taux de conversion global (approximatif)
      const totalViews = selections.reduce(
        (sum, s) => sum + (s.views_count || 0),
        0
      );
      const conversionRate =
        totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

      // ============================================
      // SET DATA
      // ============================================
      setData({
        activeAffiliates,
        totalOrders,
        totalRevenue,
        conversionRate,
        revenueByPeriod,
        topAffiliates,
        selectionsPerformance: selectionsPerformance.sort(
          (a, b) => b.revenue - a.revenue
        ),
        commissionsByStatus,
        topPendingCommissions,
        totalSelections,
        averageBasket,
        totalPaidCommissionsHT,
        totalPaidCommissionsTTC,
      });
    } catch (err) {
      console.error('Erreur fetch analytics LinkMe:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [period, startDateISO, endDateISO, year]);

  useEffect(() => {
    void fetchAnalytics().catch(error => {
      console.error(
        '[useLinkMeAnalytics] useEffect fetchAnalytics failed:',
        error
      );
    });
  }, [fetchAnalytics]);

  return { data, isLoading, error, refetch: fetchAnalytics };
}

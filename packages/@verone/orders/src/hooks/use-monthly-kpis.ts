'use client';

/**
 * Hook: useMonthlyKPIs
 * KPIs mensuels avec comparaison mois précédent
 *
 * Utilise query directe sur `sales_orders` (RLS-aware) au lieu du RPC cassé.
 * Commissions depuis `linkme_commissions` (source de vérité).
 *
 * @module use-monthly-kpis
 * @since 2025-12-19
 * @updated 2026-02-25 - Migration RPC → query directe + commissions réelles
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface MonthlyKPIs {
  // Mois en cours
  currentMonth: {
    label: string;
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Mois précédent
  previousMonth: {
    label: string;
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Variations vs mois précédent (en %)
  variations: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Variations vs moyenne générale (en %)
  averageVariations: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Moyenne mensuelle (pour référence)
  monthlyAverage: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
    panierMoyen: number;
  };
  // Totaux all-time
  allTime: {
    ordersCount: number;
    caHT: number;
    caTTC: number;
    commissionsHT: number;
    commissionsTTC: number;
  };
}

export interface UseMonthlyKPIsOptions {
  /** ID du canal de vente (ex: LinkMe, Site Internet) */
  channelId?: string | null;
  /** ID de l'affilié (pour LinkMe front-end) — non utilisé car RLS filtre auto */
  affiliateId?: string | null;
  /** Activer le hook */
  enabled?: boolean;
}

// LinkMe channel UUID
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// ============================================
// HELPERS
// ============================================

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// Row types for queries
// ============================================

interface OrderKpiRow {
  created_at: string;
  total_ht: number;
  total_ttc: number;
}

interface CommissionKpiRow {
  created_at: string;
  affiliate_commission: number | null;
  affiliate_commission_ttc: number | null;
}

// ============================================
// MAIN HOOK
// ============================================

export function useMonthlyKPIs(options: UseMonthlyKPIsOptions = {}) {
  const { channelId, enabled = true } = options;

  return useQuery({
    queryKey: ['monthly-kpis', channelId],
    queryFn: async (): Promise<MonthlyKPIs> => {
      const supabase = createClient();

      const now = new Date();
      const currentMonthStart = getMonthStart(now);
      const currentMonthEnd = getMonthEnd(now);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthStart = getMonthStart(prevMonth);
      const previousMonthEnd = getMonthEnd(prevMonth);

      // Fetch all LinkMe orders (lightweight: only needed columns for KPIs)
      // RLS filters automatically by affiliate/enseigne
      const effectiveChannelId = channelId ?? LINKME_CHANNEL_ID;

      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select('created_at, total_ht, total_ttc')
        .eq('channel_id', effectiveChannelId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('[useMonthlyKPIs] Orders error:', ordersError);
        throw ordersError;
      }

      // Fetch commissions from linkme_commissions (source of truth)
      // RLS filters automatically
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('linkme_commissions')
        .select('created_at, affiliate_commission, affiliate_commission_ttc');

      if (commissionsError) {
        console.error('[useMonthlyKPIs] Commissions error:', commissionsError);
        throw commissionsError;
      }

      const orders = (ordersData ?? []) as OrderKpiRow[];
      const commissions = (commissionsData ?? []) as CommissionKpiRow[];

      // Filter orders by period
      const filterByPeriod = <T extends { created_at: string }>(
        items: T[],
        start: Date,
        end: Date
      ) =>
        items.filter(item => {
          const d = new Date(item.created_at);
          return d >= start && d <= end;
        });

      const currentMonthOrders = filterByPeriod(
        orders,
        currentMonthStart,
        currentMonthEnd
      );
      const previousMonthOrders = filterByPeriod(
        orders,
        previousMonthStart,
        previousMonthEnd
      );
      const currentMonthCommissions = filterByPeriod(
        commissions,
        currentMonthStart,
        currentMonthEnd
      );
      const previousMonthCommissions = filterByPeriod(
        commissions,
        previousMonthStart,
        previousMonthEnd
      );

      // Calculate KPIs
      const calcOrderKPIs = (ordersList: OrderKpiRow[]) => {
        const count = ordersList.length;
        const caHT = ordersList.reduce(
          (sum, o) => sum + (Number(o.total_ht) || 0),
          0
        );
        const caTTC = ordersList.reduce(
          (sum, o) => sum + (Number(o.total_ttc) || 0),
          0
        );
        return { count, caHT, caTTC };
      };

      const calcCommissionKPIs = (commissionsList: CommissionKpiRow[]) => {
        const commissionsHT = commissionsList.reduce(
          (sum, c) => sum + (Number(c.affiliate_commission) || 0),
          0
        );
        const commissionsTTC = commissionsList.reduce(
          (sum, c) => sum + (Number(c.affiliate_commission_ttc) || 0),
          0
        );
        return { commissionsHT, commissionsTTC };
      };

      const currentOrderKPIs = calcOrderKPIs(currentMonthOrders);
      const previousOrderKPIs = calcOrderKPIs(previousMonthOrders);
      const allTimeOrderKPIs = calcOrderKPIs(orders);

      const currentCommKPIs = calcCommissionKPIs(currentMonthCommissions);
      const previousCommKPIs = calcCommissionKPIs(previousMonthCommissions);
      const allTimeCommKPIs = calcCommissionKPIs(commissions);

      const buildKPIs = (
        orderKPIs: { count: number; caHT: number; caTTC: number },
        commKPIs: { commissionsHT: number; commissionsTTC: number }
      ) => ({
        ordersCount: orderKPIs.count,
        caHT: orderKPIs.caHT,
        caTTC: orderKPIs.caTTC,
        commissionsHT: commKPIs.commissionsHT,
        commissionsTTC: commKPIs.commissionsTTC,
        panierMoyen:
          orderKPIs.count > 0 ? orderKPIs.caTTC / orderKPIs.count : 0,
      });

      const currentKPIs = buildKPIs(currentOrderKPIs, currentCommKPIs);
      const previousKPIs = buildKPIs(previousOrderKPIs, previousCommKPIs);

      // Monthly averages
      const monthsWithOrders = new Set(
        orders.map(o => {
          const d = new Date(o.created_at);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })
      );
      const numberOfMonths = Math.max(monthsWithOrders.size, 1);

      const allTimeKPIs = buildKPIs(allTimeOrderKPIs, allTimeCommKPIs);

      const monthlyAverage = {
        ordersCount: Math.round(allTimeKPIs.ordersCount / numberOfMonths),
        caHT: allTimeKPIs.caHT / numberOfMonths,
        caTTC: allTimeKPIs.caTTC / numberOfMonths,
        commissionsHT: allTimeKPIs.commissionsHT / numberOfMonths,
        commissionsTTC: allTimeKPIs.commissionsTTC / numberOfMonths,
        panierMoyen: allTimeKPIs.panierMoyen,
      };

      // Variations
      const variations = {
        ordersCount: calculateVariation(
          currentKPIs.ordersCount,
          previousKPIs.ordersCount
        ),
        caHT: calculateVariation(currentKPIs.caHT, previousKPIs.caHT),
        caTTC: calculateVariation(currentKPIs.caTTC, previousKPIs.caTTC),
        commissionsHT: calculateVariation(
          currentKPIs.commissionsHT,
          previousKPIs.commissionsHT
        ),
        commissionsTTC: calculateVariation(
          currentKPIs.commissionsTTC,
          previousKPIs.commissionsTTC
        ),
        panierMoyen: calculateVariation(
          currentKPIs.panierMoyen,
          previousKPIs.panierMoyen
        ),
      };

      const averageVariations = {
        ordersCount: calculateVariation(
          currentKPIs.ordersCount,
          monthlyAverage.ordersCount
        ),
        caHT: calculateVariation(currentKPIs.caHT, monthlyAverage.caHT),
        caTTC: calculateVariation(currentKPIs.caTTC, monthlyAverage.caTTC),
        commissionsHT: calculateVariation(
          currentKPIs.commissionsHT,
          monthlyAverage.commissionsHT
        ),
        commissionsTTC: calculateVariation(
          currentKPIs.commissionsTTC,
          monthlyAverage.commissionsTTC
        ),
        panierMoyen: calculateVariation(
          currentKPIs.panierMoyen,
          monthlyAverage.panierMoyen
        ),
      };

      return {
        currentMonth: {
          label: formatMonthLabel(currentMonthStart),
          ...currentKPIs,
        },
        previousMonth: {
          label: formatMonthLabel(previousMonthStart),
          ...previousKPIs,
        },
        variations,
        averageVariations,
        monthlyAverage,
        allTime: {
          ordersCount: allTimeKPIs.ordersCount,
          caHT: allTimeKPIs.caHT,
          caTTC: allTimeKPIs.caTTC,
          commissionsHT: allTimeKPIs.commissionsHT,
          commissionsTTC: allTimeKPIs.commissionsTTC,
        },
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });
}

/**
 * Helper pour formater la variation avec signe + ou -
 */
export function formatVariation(value: number): string {
  if (value === 0) return '0%';
  return value > 0 ? `+${value}%` : `${value}%`;
}

/**
 * Helper pour obtenir la couleur de la variation
 */
export function getVariationColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-500';
}

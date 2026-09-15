'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

export type {
  DatePreset,
  DateRange,
  PerformanceFilters,
  TopProduct,
  AffiliateListItem,
  SelectionListItem,
  PerformanceData,
} from './performance-analytics-types';
export {
  getDateRangeFromPreset,
  formatDateRange,
} from './performance-analytics-types';

// Re-export navigation hooks for backward-compatible imports
export {
  useAffiliatesList,
  useAffiliateSelections,
} from './use-performance-navigation';

import type {
  PerformanceFilters,
  PerformanceData,
} from './performance-analytics-types';
import {
  fetchCommissions,
  fetchOrderItemsWithImages,
} from './performance-analytics-fetchers';
import {
  calcKPIs,
  aggregateTopProducts,
  aggregateByAffiliate,
  aggregateBySelection,
  extractContextNames,
} from './performance-analytics-aggregations';

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
      // 1. Commissions filtrées
      const commissions = await fetchCommissions(supabase, filters);

      // 2. KPIs
      const {
        totalOrders,
        totalRevenueHT,
        totalCommissionsTTC,
        averageBasket,
      } = calcKPIs(commissions);

      // 3. Lignes de commande + images produits
      const orderIds = commissions
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      const { orderItemsData, productImages } = await fetchOrderItemsWithImages(
        supabase,
        orderIds
      );

      // 4. Top produits
      const topProducts = aggregateTopProducts(orderItemsData, productImages);

      // 5. Par affilié
      const affiliates = aggregateByAffiliate(commissions);

      // 6. Par sélection
      const selections = aggregateBySelection(commissions);

      // 7. Noms contextuels
      const { affiliateName, selectionName } = extractContextNames(
        commissions,
        filters.affiliateId,
        filters.selectionId
      );

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
    staleTime: 300_000, // 5 minutes cache
  });
}

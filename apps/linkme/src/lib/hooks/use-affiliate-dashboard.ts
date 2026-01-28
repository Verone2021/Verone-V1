/**
 * Hook: useAffiliateDashboard
 * Optimized dashboard data fetching using RPC
 *
 * Replaces multiple client-side queries with a single RPC call.
 * Uses get_affiliate_dashboard_data() which aggregates all data server-side.
 *
 * Performance improvements:
 * - 1 RPC call instead of 6+ queries
 * - Server-side aggregation (no client-side JS loops)
 * - Proper caching with React Query
 *
 * @module use-affiliate-dashboard
 * @since 2026-01-24
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-selection';

const supabase = createClient();

// ============================================
// Types
// ============================================

export interface CommissionsByStatus {
  total: { count: number; amountHT: number; amountTTC: number };
  pending: { count: number; amountTTC: number };
  validated: { count: number; amountTTC: number };
  requested: { count: number; amountTTC: number };
  paid: { count: number; amountTTC: number };
}

export interface TopProductData {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  quantitySold: number;
  revenueHT: number;
  commissionHT: number;
  isRevendeur: boolean;
}

export interface DashboardData {
  commissionsByStatus: CommissionsByStatus;
  topProducts: TopProductData[];
}

// ============================================
// Query Keys
// ============================================

export const affiliateDashboardKeys = {
  all: ['affiliate-dashboard'] as const,
  dashboard: (affiliateId: string | undefined) =>
    [...affiliateDashboardKeys.all, affiliateId] as const,
};

// ============================================
// Main Hook
// ============================================

export function useAffiliateDashboard() {
  const {
    data: affiliate,
    isLoading: affiliateLoading,
    error: affiliateError,
  } = useUserAffiliate();

  const query = useQuery({
    queryKey: affiliateDashboardKeys.dashboard(affiliate?.id),
    queryFn: async (): Promise<DashboardData | null> => {
      if (!affiliate?.id) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const { data, error } = await (supabase as any).rpc(
        'get_affiliate_dashboard_data',
        {
          p_affiliate_id: affiliate.id,
        }
      );

      if (error) {
        console.error('[useAffiliateDashboard] RPC error:', error);
        throw error;
      }

      // The RPC returns JSONB which is automatically parsed
      return data as DashboardData;
    },
    enabled: !!affiliate?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    affiliateLoading,
    affiliateError,
    affiliate,
  };
}

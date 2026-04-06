/**
 * Hook: useLinkMeOrders
 * Récupère les commandes LinkMe via query directe (RLS-aware)
 *
 * Remplace l'ancien RPC `get_linkme_orders` (SECURITY DEFINER = bypass RLS)
 * par une query directe sur `sales_orders` qui respecte la RLS :
 * - Affilié voit SES commandes
 * - Enseigne_admin voit TOUTES les commandes de son enseigne
 * - Staff back-office voit tout
 *
 * @module use-linkme-orders
 * @since 2025-12-18
 * @updated 2026-02-25 - Migration RPC → query directe + pagination server-side
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { mapRowToOrder } from './use-linkme-orders.helpers';
import type {
  LinkMeOrder,
  OrderStats,
  ProductImageRow,
  QueryOrderRow,
  UseLinkMeOrdersOptions,
  UseLinkMeOrdersResult,
} from './use-linkme-orders.types';
import { LINKME_CHANNEL_ID, ORDER_SELECT } from './use-linkme-orders.types';

export type {
  LinkMeOrder,
  OrderItem,
  OrderStats,
  StructuredAddress,
  UseLinkMeOrdersOptions,
  UseLinkMeOrdersResult,
} from './use-linkme-orders.types';

/**
 * Hook: récupère les commandes LinkMe avec pagination server-side
 *
 * RLS filtre automatiquement :
 * - Affilié voit ses commandes
 * - Enseigne_admin voit toutes les commandes de son enseigne
 * - Staff back-office voit tout
 */
export function useLinkMeOrders(
  options: UseLinkMeOrdersOptions
): UseLinkMeOrdersResult {
  const {
    page,
    pageSize,
    yearFilter = 'all',
    periodFilter = 'all',
    ownershipTypeFilter = 'all',
    statusFilter = 'all',
  } = options;

  // Main paginated query
  const ordersQuery = useQuery({
    queryKey: [
      'linkme-orders',
      page,
      pageSize,
      yearFilter,
      periodFilter,
      ownershipTypeFilter,
      statusFilter,
    ],
    queryFn: async (): Promise<{
      orders: LinkMeOrder[];
      totalCount: number;
    }> => {
      const supabase = createClient();
      const offset = page * pageSize;

      // If ownership_type filter is active, pre-fetch matching org IDs
      let orgIds: string[] | null = null;
      if (ownershipTypeFilter && ownershipTypeFilter !== 'all') {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id')
          .eq(
            'ownership_type',
            ownershipTypeFilter as 'succursale' | 'franchise'
          );
        orgIds = (orgs ?? []).map(o => o.id);
      }

      let query = supabase
        .from('sales_orders')
        .select(ORDER_SELECT, { count: 'exact' })
        .eq('channel_id', LINKME_CHANNEL_ID)
        .order('created_at', { ascending: false });

      // Ownership type filter (via customer_id IN matching org IDs)
      if (orgIds !== null) {
        if (orgIds.length === 0) {
          return { orders: [], totalCount: 0 };
        }
        query = query
          .eq('customer_type', 'organization')
          .in('customer_id', orgIds);
      }

      // Year + period filter combined
      if (yearFilter && yearFilter !== 'all') {
        const year =
          yearFilter === 'current'
            ? new Date().getFullYear()
            : Number(yearFilter);

        if (periodFilter && periodFilter !== 'all') {
          if (periodFilter.startsWith('q')) {
            const quarter = Number(periodFilter.slice(1));
            const startMonth = (quarter - 1) * 3 + 1;
            const endMonth = startMonth + 3;
            const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
            const endDate =
              endMonth <= 12
                ? `${year}-${String(endMonth).padStart(2, '0')}-01`
                : `${year + 1}-01-01`;
            query = query
              .gte('created_at', startDate)
              .lt('created_at', endDate);
          } else {
            const month = Number(periodFilter);
            const nextMonth = month + 1;
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate =
              nextMonth <= 12
                ? `${year}-${String(nextMonth).padStart(2, '0')}-01`
                : `${year + 1}-01-01`;
            query = query
              .gte('created_at', startDate)
              .lt('created_at', endDate);
          }
        } else {
          query = query
            .gte('created_at', `${year}-01-01`)
            .lt('created_at', `${year + 1}-01-01`);
        }
      }

      // Status filter (tab)
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'shipped') {
          query = query.in('status', [
            'shipped',
            'partially_shipped',
            'delivered',
          ]);
        } else if (statusFilter === 'pending_approval') {
          query = query.in('status', ['draft', 'pending_approval']);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('[useLinkMeOrders] Query error:', error);
        throw error;
      }

      const rows = (data ?? []) as unknown as QueryOrderRow[];

      // Fetch product images (separate query)
      const productIds = rows.flatMap(row =>
        (row.items ?? []).map(item => item.product_id)
      );

      let imageMap = new Map<string, string | null>();
      if (productIds.length > 0) {
        const uniqueProductIds = [...new Set(productIds)];
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', uniqueProductIds)
          .eq('is_primary', true)
          .returns<ProductImageRow[]>();

        imageMap = new Map(
          (images ?? []).map(img => [img.product_id, img.public_url])
        );
      }

      const orders = rows.map(row => mapRowToOrder(row, imageMap));

      return { orders, totalCount: count ?? 0 };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Status counts query (lightweight, no pagination, no items)
  const countsQuery = useQuery({
    queryKey: [
      'linkme-orders-counts',
      yearFilter,
      periodFilter,
      ownershipTypeFilter,
    ],
    queryFn: async (): Promise<Record<string, number>> => {
      const supabase = createClient();

      let orgIds: string[] | null = null;
      if (ownershipTypeFilter && ownershipTypeFilter !== 'all') {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id')
          .eq(
            'ownership_type',
            ownershipTypeFilter as 'succursale' | 'franchise'
          );
        orgIds = (orgs ?? []).map(o => o.id);
      }

      let query = supabase
        .from('sales_orders')
        .select('status', { count: 'exact', head: false })
        .eq('channel_id', LINKME_CHANNEL_ID);

      if (orgIds !== null) {
        if (orgIds.length === 0) return { all: 0, shipped_tab: 0 };
        query = query
          .eq('customer_type', 'organization')
          .in('customer_id', orgIds);
      }

      if (yearFilter && yearFilter !== 'all') {
        const year =
          yearFilter === 'current'
            ? new Date().getFullYear()
            : Number(yearFilter);

        if (periodFilter && periodFilter !== 'all') {
          if (periodFilter.startsWith('q')) {
            const quarter = Number(periodFilter.slice(1));
            const startMonth = (quarter - 1) * 3 + 1;
            const endMonth = startMonth + 3;
            const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
            const endDate =
              endMonth <= 12
                ? `${year}-${String(endMonth).padStart(2, '0')}-01`
                : `${year + 1}-01-01`;
            query = query
              .gte('created_at', startDate)
              .lt('created_at', endDate);
          } else {
            const month = Number(periodFilter);
            const nextMonth = month + 1;
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate =
              nextMonth <= 12
                ? `${year}-${String(nextMonth).padStart(2, '0')}-01`
                : `${year + 1}-01-01`;
            query = query
              .gte('created_at', startDate)
              .lt('created_at', endDate);
          }
        } else {
          query = query
            .gte('created_at', `${year}-01-01`)
            .lt('created_at', `${year + 1}-01-01`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useLinkMeOrders] Counts error:', error);
        return {};
      }

      const counts: Record<string, number> = {};
      let total = 0;
      for (const row of data ?? []) {
        const status = (row as { status: string }).status;
        counts[status] = (counts[status] ?? 0) + 1;
        total++;
      }
      counts['all'] = total;

      counts['shipped_tab'] =
        (counts['shipped'] ?? 0) +
        (counts['partially_shipped'] ?? 0) +
        (counts['delivered'] ?? 0);

      counts['pending_approval_tab'] =
        (counts['draft'] ?? 0) + (counts['pending_approval'] ?? 0);

      return counts;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    orders: ordersQuery.data?.orders ?? [],
    totalCount: ordersQuery.data?.totalCount ?? 0,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    statusCounts: countsQuery.data ?? {},
    isCountsLoading: countsQuery.isLoading,
  };
}

/**
 * Hook: récupère les statistiques des commandes
 */
export function useOrderStats(orders: LinkMeOrder[]): OrderStats {
  if (!orders || orders.length === 0) {
    return {
      total_orders: 0,
      total_ht: 0,
      total_affiliate_margins: 0,
      orders_by_status: {},
    };
  }

  return {
    total_orders: orders.length,
    total_ht: orders.reduce((sum, o) => sum + (o.total_ht ?? 0), 0),
    total_affiliate_margins: orders.reduce(
      (sum, o) => sum + (o.total_affiliate_margin ?? 0),
      0
    ),
    orders_by_status: orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

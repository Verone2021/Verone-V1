'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { SITE_INTERNET_CHANNEL_ID } from '../constants';

const supabase = createClient();

interface DashboardKPIs {
  ordersThisMonth: number;
  revenueThisMonth: number;
  ordersPending: number;
  reviewsPending: number;
  ordersLastMonth: number;
  revenueLastMonth: number;
}

function getMonthRange(monthsAgo: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo + 1,
    0,
    23,
    59,
    59
  );
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function calcTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  const [
    ordersThisMonthResult,
    revenueThisMonthResult,
    ordersPendingResult,
    reviewsPendingResult,
    ordersLastMonthResult,
    revenueLastMonthResult,
  ] = await Promise.all([
    // Orders this month (excluding cancelled and draft)
    supabase
      .from('sales_orders')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
      .gte('created_at', thisMonth.start)
      .lte('created_at', thisMonth.end)
      .not('status', 'in', '("cancelled","draft")'),

    // Revenue this month (paid orders only)
    supabase
      .from('sales_orders')
      .select('total_ttc')
      .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
      .eq('payment_status_v2', 'paid')
      .gte('created_at', thisMonth.start)
      .lte('created_at', thisMonth.end),

    // Pending orders
    supabase
      .from('sales_orders')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
      .eq('status', 'pending'),

    // Pending reviews
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Orders last month
    supabase
      .from('sales_orders')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
      .gte('created_at', lastMonth.start)
      .lte('created_at', lastMonth.end)
      .not('status', 'in', '("cancelled","draft")'),

    // Revenue last month
    supabase
      .from('sales_orders')
      .select('total_ttc')
      .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
      .eq('payment_status_v2', 'paid')
      .gte('created_at', lastMonth.start)
      .lte('created_at', lastMonth.end),
  ]);

  const revenueThis = (revenueThisMonthResult.data ?? []).reduce(
    (sum, row) =>
      sum + (Number((row as { total_ttc: number | null }).total_ttc) || 0),
    0
  );

  const revenueLast = (revenueLastMonthResult.data ?? []).reduce(
    (sum, row) =>
      sum + (Number((row as { total_ttc: number | null }).total_ttc) || 0),
    0
  );

  return {
    ordersThisMonth: ordersThisMonthResult.count ?? 0,
    revenueThisMonth: Math.round(revenueThis * 100) / 100,
    ordersPending: ordersPendingResult.count ?? 0,
    reviewsPending: reviewsPendingResult.count ?? 0,
    ordersLastMonth: ordersLastMonthResult.count ?? 0,
    revenueLastMonth: Math.round(revenueLast * 100) / 100,
  };
}

export function useSiteInternetDashboard() {
  const query = useQuery({
    queryKey: ['site-internet-dashboard'],
    queryFn: fetchDashboardKPIs,
    staleTime: 30_000,
  });

  const data = query.data;

  return {
    ...query,
    kpis: data
      ? {
          ordersThisMonth: data.ordersThisMonth,
          revenueThisMonth: data.revenueThisMonth,
          ordersPending: data.ordersPending,
          reviewsPending: data.reviewsPending,
          ordersTrend: calcTrend(data.ordersThisMonth, data.ordersLastMonth),
          revenueTrend: calcTrend(data.revenueThisMonth, data.revenueLastMonth),
        }
      : null,
  };
}

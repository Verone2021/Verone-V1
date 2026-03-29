'use server';

import { createServerClient } from '@verone/utils/supabase/server';

export interface ProductMetrics {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  stockAlerts: number;
  trend: number;
}

export async function getProductMetrics(): Promise<ProductMetrics> {
  const supabase = await createServerClient();

  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalResult,
      activeResult,
      inactiveResult,
      draftResult,
      stockAlertsResult,
      recentResult,
      previousResult,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('product_status', 'active'),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('product_status', 'discontinued'),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .in('product_status', ['draft', 'preorder']),
      supabase
        .from('stock_alerts_unified_view')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', fourteenDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString()),
    ]);

    const recentCount = recentResult.count ?? 0;
    const previousCount = previousResult.count ?? 0;

    let trend = 0;
    if (previousCount > 0) {
      trend = ((recentCount - previousCount) / previousCount) * 100;
    } else if (recentCount > 0) {
      trend = 100;
    }
    trend = Number.isFinite(trend) ? Math.round(trend * 10) / 10 : 0;

    return {
      total: totalResult.count ?? 0,
      active: activeResult.count ?? 0,
      inactive: inactiveResult.count ?? 0,
      draft: draftResult.count ?? 0,
      stockAlerts: stockAlertsResult.count ?? 0,
      trend,
    };
  } catch (error) {
    console.error('[getProductMetrics] Error:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      draft: 0,
      stockAlerts: 0,
      trend: 0,
    };
  }
}

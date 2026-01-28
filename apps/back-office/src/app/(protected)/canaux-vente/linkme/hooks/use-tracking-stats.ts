'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface SelectionStats {
  id: string;
  name: string;
  slug: string;
  affiliate_name: string;
  affiliate_slug: string;
  views_count: number;
  orders_count: number;
  total_revenue: number;
  products_count: number;
  conversion_rate: number; // orders_count / views_count * 100
  created_at: string;
  updated_at: string;
}

export interface TrackingKPIs {
  total_views: number;
  total_orders: number;
  total_revenue: number;
  avg_conversion_rate: number;
  views_change?: number; // % change vs previous period
  orders_change?: number;
}

export interface RecentConversion {
  id: string;
  order_number: string;
  selection_name: string;
  affiliate_name: string;
  order_amount_ht: number;
  affiliate_commission: number;
  created_at: string;
}

// ============================================================================
// Hook: useTrackingStats
// ============================================================================

export function useTrackingStats() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'tracking-stats'],
    queryFn: async (): Promise<SelectionStats[]> => {
      const { data, error } = await supabase
        .from('linkme_selections')
        .select(
          `
          id,
          name,
          slug,
          views_count,
          orders_count,
          total_revenue,
          products_count,
          created_at,
          updated_at,
          affiliate:linkme_affiliates(
            display_name,
            slug
          )
        `
        )
        .is('archived_at', null) // Sélections non archivées
        .not('published_at', 'is', null) // Sélections publiées
        .order('views_count', { ascending: false, nullsFirst: false });

      if (error) throw error;

      return (data || []).map(selection => ({
        id: selection.id,
        name: selection.name,
        slug: selection.slug,
        affiliate_name: selection.affiliate?.display_name || 'Inconnu',
        affiliate_slug: selection.affiliate?.slug ?? '',
        views_count: selection.views_count || 0,
        orders_count: selection.orders_count || 0,
        total_revenue: selection.total_revenue || 0,
        products_count: selection.products_count || 0,
        conversion_rate:
          selection.views_count && selection.views_count > 0
            ? Math.round(
                ((selection.orders_count || 0) / selection.views_count) * 10000
              ) / 100
            : 0,
        created_at: selection.created_at || new Date().toISOString(),
        updated_at: selection.updated_at || new Date().toISOString(),
      }));
    },
    staleTime: 30000, // 30 seconds cache
  });
}

// ============================================================================
// Hook: useTrackingKPIs
// ============================================================================

export function useTrackingKPIs() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'tracking-kpis'],
    queryFn: async (): Promise<TrackingKPIs> => {
      // Aggregate stats from all active selections (non archivées et publiées)
      const { data, error } = await supabase
        .from('linkme_selections')
        .select('views_count, orders_count, total_revenue')
        .is('archived_at', null)
        .not('published_at', 'is', null);

      if (error) throw error;

      const totals = (data || []).reduce(
        (acc, sel) => ({
          total_views: acc.total_views + (sel.views_count || 0),
          total_orders: acc.total_orders + (sel.orders_count || 0),
          total_revenue: acc.total_revenue + (sel.total_revenue || 0),
        }),
        { total_views: 0, total_orders: 0, total_revenue: 0 }
      );

      return {
        ...totals,
        avg_conversion_rate:
          totals.total_views > 0
            ? Math.round((totals.total_orders / totals.total_views) * 10000) /
              100
            : 0,
      };
    },
    staleTime: 30000,
  });
}

// ============================================================================
// Hook: useRecentConversions
// ============================================================================

export function useRecentConversions(limit = 10) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'recent-conversions', limit],
    queryFn: async (): Promise<RecentConversion[]> => {
      const { data, error } = await supabase
        .from('linkme_commissions')
        .select(
          `
          id,
          order_number,
          order_amount_ht,
          affiliate_commission,
          created_at,
          selection:linkme_selections(name),
          affiliate:linkme_affiliates(display_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(commission => ({
        id: commission.id,
        order_number: commission.order_number || 'N/A',
        selection_name: commission.selection?.name || 'Sélection inconnue',
        affiliate_name: commission.affiliate?.display_name || 'Affilié inconnu',
        order_amount_ht: commission.order_amount_ht,
        affiliate_commission: commission.affiliate_commission,
        created_at: commission.created_at || new Date().toISOString(),
      }));
    },
    staleTime: 30000,
  });
}

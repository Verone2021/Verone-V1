'use client';

/**
 * performance-analytics-fetchers — fonctions de récupération des données
 * pour usePerformanceAnalytics. Isolées pour faciliter les tests et
 * réduire la taille du hook principal.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@verone/types';

import type { PerformanceFilters } from './performance-analytics-types';

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

export interface RawCommission {
  id: string;
  order_id: string | null;
  affiliate_id: string;
  selection_id: string | null;
  order_number: string | null;
  order_amount_ht: number | null;
  affiliate_commission: number | null;
  affiliate_commission_ttc: number | null;
  created_at: string;
  affiliate: { id: string; display_name: string; slug: string } | null;
  selection: {
    id: string;
    name: string;
    slug: string;
    products_count: number;
  } | null;
}

export interface RawOrderItem {
  id: string;
  product_id: string | null;
  quantity: number | null;
  total_ht: number | null;
  sales_order_id: string;
  product: { id: string; name: string; sku: string } | null;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchCommissions(
  supabase: SupabaseClient<Database>,
  filters: PerformanceFilters
): Promise<RawCommission[]> {
  const startISO = filters.dateRange.startDate.toISOString();
  const endISO = filters.dateRange.endDate.toISOString();

  let query = supabase
    .from('linkme_commissions')
    .select(
      `
      id,
      order_id,
      affiliate_id,
      selection_id,
      order_number,
      order_amount_ht,
      affiliate_commission,
      affiliate_commission_ttc,
      created_at,
      affiliate:linkme_affiliates(id, display_name, slug),
      selection:linkme_selections(id, name, slug, products_count)
    `
    )
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  if (filters.affiliateId) {
    query = query.eq('affiliate_id', filters.affiliateId);
  }

  if (filters.selectionId) {
    query = query.eq('selection_id', filters.selectionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RawCommission[];
}

export async function fetchOrderItemsWithImages(
  supabase: SupabaseClient<Database>,
  orderIds: string[]
): Promise<{
  orderItemsData: RawOrderItem[];
  productImages: Map<string, string>;
}> {
  if (orderIds.length === 0) {
    return { orderItemsData: [], productImages: new Map() };
  }

  const { data: orderItemsData, error: orderItemsError } = await supabase
    .from('sales_order_items')
    .select(
      `
      id,
      product_id,
      quantity,
      total_ht,
      sales_order_id,
      product:products(id, name, sku)
    `
    )
    .in('sales_order_id', orderIds);

  if (orderItemsError) throw orderItemsError;

  const items = (orderItemsData ?? []) as RawOrderItem[];

  const productIds = [
    ...new Set(
      items
        .map(item => (item.product as { id: string } | null)?.id)
        .filter((id): id is string => !!id)
    ),
  ];

  const productImages = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: imagesData } = await supabase
      .from('product_images')
      .select('product_id, public_url')
      .in('product_id', productIds)
      .eq('is_primary', true);

    (imagesData ?? []).forEach(img => {
      if (img.public_url) {
        productImages.set(img.product_id, img.public_url);
      }
    });
  }

  return { orderItemsData: items, productImages };
}

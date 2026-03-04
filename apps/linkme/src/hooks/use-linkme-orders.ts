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
import type { Database } from '@verone/types/supabase';
import { createClient } from '@verone/utils/supabase/client';

type SalesOrderStatus = Database['public']['Enums']['sales_order_status'];

/** LinkMe channel UUID */
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Interface item de commande
 */
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number;
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  selling_price_ht: number;
  affiliate_margin: number;
}

/**
 * Interface adresse structuree (JSONB)
 */
export interface StructuredAddress {
  line1?: string;
  line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

/**
 * Interface commande LinkMe
 */
export interface LinkMeOrder {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  status: string;
  payment_status: string | null;
  total_ht: number;
  total_ttc: number;
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  total_affiliate_margin: number;
  customer_name: string;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  // Adresses structurees (depuis sales_orders)
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  // Dates de livraison (depuis sales_order_linkme_details)
  desired_delivery_date: string | null;
  confirmed_delivery_date: string | null;
  // Contact facturation (depuis sales_order_linkme_details)
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  // Requester contact (depuis sales_order_linkme_details)
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_position: string | null;
  // Delivery contact (depuis sales_order_linkme_details)
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  // Delivery address text (depuis sales_order_linkme_details)
  delivery_address_text: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  // Delivery options
  is_mall_delivery: boolean;
  delivery_notes: string | null;
  owner_type: string | null;
  // Reception contact
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
  // Affiliate info
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  selection_id: string | null;
  selection_name: string | null;
  items_count: number;
  created_at: string;
  updated_at: string;
  // Approbation
  pending_admin_validation: boolean;
  // Items charges separement
  items: OrderItem[];
}

// ============================================
// Supabase row types for the joined query
// ============================================

interface QueryOrderRow {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  payment_status_v2: string | null;
  total_ht: number;
  total_ttc: number;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  affiliate_total_ht: number | null;
  billing_address: StructuredAddress | null;
  shipping_address: StructuredAddress | null;
  pending_admin_validation: boolean | null;
  created_by_affiliate_id: string | null;
  linkme_selection_id: string | null;
  customer_id: string | null;
  customer_type: string;
  channel: { id: string; name: string; code: string } | null;
  items: QueryItemRow[];
  linkme_details: QueryLinkmeDetailsRow[];
  affiliate: {
    id: string;
    display_name: string;
    affiliate_type: string;
  } | null;
  selection: { id: string; name: string } | null;
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
  } | null;
  individual_customer: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface QueryItemRow {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number | null;
  tax_rate: number;
  retrocession_amount: number | null;
  retrocession_rate: number | null;
  base_price_ht_locked: number | null;
  selling_price_ht_locked: number | null;
  product: { id: string; name: string; sku: string | null } | null;
}

interface QueryLinkmeDetailsRow {
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  desired_delivery_date: string | null;
  confirmed_delivery_date: string | null;
  is_mall_delivery: boolean | null;
  delivery_notes: string | null;
  owner_type: string | null;
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
}

interface ProductImageRow {
  product_id: string;
  public_url: string | null;
}

// ============================================
// Pagination options
// ============================================

export interface UseLinkMeOrdersOptions {
  page: number;
  pageSize: number;
  yearFilter?: string; // 'all' | 'current' | '2025' | '2026' etc.
  statusFilter?: 'all' | SalesOrderStatus; // tab filter
}

export interface UseLinkMeOrdersResult {
  orders: LinkMeOrder[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  /** Status counts for tabs (total across all pages) */
  statusCounts: Record<string, number>;
  /** Whether status counts are still loading */
  isCountsLoading: boolean;
}

// ============================================
// Build query helper
// ============================================

const ORDER_SELECT = `
  id, order_number, linkme_display_number, created_at, updated_at, status,
  payment_status_v2, total_ht, total_ttc,
  shipping_cost_ht, handling_cost_ht, insurance_cost_ht,
  affiliate_total_ht, billing_address, shipping_address,
  pending_admin_validation, created_by_affiliate_id,
  linkme_selection_id, customer_id, customer_type,
  channel:sales_channels!left(id, name, code),
  items:sales_order_items(
    id, product_id, quantity, unit_price_ht, total_ht, tax_rate,
    retrocession_amount, retrocession_rate,
    base_price_ht_locked, selling_price_ht_locked,
    product:products!left(id, name, sku)
  ),
  linkme_details:sales_order_linkme_details!left(
    billing_name, billing_email, billing_phone,
    requester_name, requester_email, requester_phone, requester_position,
    delivery_contact_name, delivery_contact_email, delivery_contact_phone,
    delivery_address, delivery_postal_code, delivery_city,
    desired_delivery_date, confirmed_delivery_date,
    is_mall_delivery, delivery_notes, owner_type,
    reception_contact_name, reception_contact_email, reception_contact_phone
  ),
  affiliate:linkme_affiliates!sales_orders_created_by_affiliate_id_fkey(
    id, display_name, affiliate_type
  ),
  selection:linkme_selections!sales_orders_linkme_selection_id_fkey(id, name),
  organisation:organisations!sales_orders_customer_id_fkey(id, trade_name, legal_name),
  individual_customer:individual_customers!sales_orders_individual_customer_id_fkey(
    id, first_name, last_name
  )
` as const;

// ============================================
// Map row to LinkMeOrder
// ============================================

function mapRowToOrder(
  row: QueryOrderRow,
  imageMap: Map<string, string | null>
): LinkMeOrder {
  const ld = row.linkme_details?.[0] ?? null;

  // Customer name: from organisation or individual_customer, fallback to linkme_details
  let customerName = 'Client inconnu';
  if (row.customer_type === 'organization' && row.organisation) {
    customerName =
      row.organisation.trade_name ??
      row.organisation.legal_name ??
      'Client inconnu';
  } else if (row.individual_customer) {
    customerName =
      `${row.individual_customer.first_name} ${row.individual_customer.last_name}`.trim();
  } else if (ld?.billing_name) {
    customerName = ld.billing_name;
  } else if (ld?.requester_name) {
    customerName = ld.requester_name;
  }

  // Compute total affiliate margin from items retrocession
  const totalAffiliateMargin =
    Number(row.affiliate_total_ht) ||
    row.items.reduce(
      (sum, item) => sum + (Number(item.retrocession_amount) || 0),
      0
    );

  return {
    id: row.id,
    order_number: row.order_number,
    linkme_display_number: row.linkme_display_number ?? null,
    status: row.status,
    payment_status: row.payment_status_v2,
    total_ht: Number(row.total_ht) || 0,
    total_ttc: Number(row.total_ttc) || 0,
    shipping_cost_ht: Number(row.shipping_cost_ht) || 0,
    handling_cost_ht: Number(row.handling_cost_ht) || 0,
    insurance_cost_ht: Number(row.insurance_cost_ht) || 0,
    total_affiliate_margin: totalAffiliateMargin,
    // Customer
    customer_name: customerName,
    customer_type:
      (row.customer_type as 'organization' | 'individual') ?? 'organization',
    customer_id: row.customer_id ?? '',
    customer_address: ld?.delivery_address ?? null,
    customer_postal_code: ld?.delivery_postal_code ?? null,
    customer_city: ld?.delivery_city ?? null,
    customer_email: ld?.billing_email ?? ld?.requester_email ?? null,
    customer_phone: ld?.billing_phone ?? ld?.requester_phone ?? null,
    // Structured addresses
    billing_address: row.billing_address,
    shipping_address: row.shipping_address,
    // Dates
    desired_delivery_date: ld?.desired_delivery_date ?? null,
    confirmed_delivery_date: ld?.confirmed_delivery_date ?? null,
    // Billing contact
    billing_name: ld?.billing_name ?? null,
    billing_email: ld?.billing_email ?? null,
    billing_phone: ld?.billing_phone ?? null,
    // Requester
    requester_name: ld?.requester_name ?? null,
    requester_email: ld?.requester_email ?? null,
    requester_phone: ld?.requester_phone ?? null,
    requester_position: ld?.requester_position ?? null,
    // Delivery contact
    delivery_contact_name: ld?.delivery_contact_name ?? null,
    delivery_contact_email: ld?.delivery_contact_email ?? null,
    delivery_contact_phone: ld?.delivery_contact_phone ?? null,
    // Delivery address
    delivery_address_text: ld?.delivery_address ?? null,
    delivery_postal_code: ld?.delivery_postal_code ?? null,
    delivery_city: ld?.delivery_city ?? null,
    // Delivery options
    is_mall_delivery: ld?.is_mall_delivery ?? false,
    delivery_notes: ld?.delivery_notes ?? null,
    owner_type: ld?.owner_type ?? null,
    // Reception contact
    reception_contact_name: ld?.reception_contact_name ?? null,
    reception_contact_email: ld?.reception_contact_email ?? null,
    reception_contact_phone: ld?.reception_contact_phone ?? null,
    // Affiliate
    affiliate_id: row.affiliate?.id ?? row.created_by_affiliate_id ?? '',
    affiliate_name: row.affiliate?.display_name ?? null,
    affiliate_type:
      (row.affiliate?.affiliate_type as 'enseigne' | 'organisation') ?? null,
    selection_id: row.selection?.id ?? row.linkme_selection_id ?? null,
    selection_name: row.selection?.name ?? null,
    items_count: row.items?.length ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    pending_admin_validation: row.pending_admin_validation ?? false,
    // Items with images
    items: (row.items ?? []).map(
      (item): OrderItem => ({
        id: item.id,
        product_id: item.product_id ?? item.product?.id ?? '',
        product_name: item.product?.name ?? 'Produit inconnu',
        product_sku: item.product?.sku ?? '',
        product_image_url: imageMap.get(item.product_id) ?? null,
        quantity: item.quantity ?? 0,
        unit_price_ht: Number(item.unit_price_ht) || 0,
        total_ht: Number(item.total_ht) || 0,
        tax_rate: Number(item.tax_rate) || 0,
        base_price_ht: Number(item.base_price_ht_locked) || 0,
        margin_rate: 0, // Not available in direct query
        commission_rate: Number(item.retrocession_rate) || 0,
        selling_price_ht: Number(item.selling_price_ht_locked) || 0,
        affiliate_margin: Number(item.retrocession_amount) || 0,
      })
    ),
  };
}

// ============================================
// MAIN HOOK
// ============================================

/**
 * Hook: récupère les commandes LinkMe avec pagination server-side
 *
 * RLS filtre automatiquement :
 * - Affilié voit ses commandes
 * - Enseigne_admin voit toutes les commandes de son enseigne
 * - Staff back-office voit tout
 */
export function useLinkMeOrders(options: UseLinkMeOrdersOptions) {
  const { page, pageSize, yearFilter = 'all', statusFilter = 'all' } = options;

  // Main paginated query
  const ordersQuery = useQuery({
    queryKey: ['linkme-orders', page, pageSize, yearFilter, statusFilter],
    queryFn: async (): Promise<{
      orders: LinkMeOrder[];
      totalCount: number;
    }> => {
      const supabase = createClient();
      const offset = page * pageSize;

      let query = supabase
        .from('sales_orders')
        .select(ORDER_SELECT, { count: 'exact' })
        .eq('channel_id', LINKME_CHANNEL_ID)
        .order('created_at', { ascending: false });

      // Year filter
      if (yearFilter && yearFilter !== 'all') {
        const year =
          yearFilter === 'current'
            ? new Date().getFullYear()
            : Number(yearFilter);
        query = query
          .gte('created_at', `${year}-01-01`)
          .lt('created_at', `${year + 1}-01-01`);
      }

      // Status filter (tab)
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'shipped') {
          // "Shipped" tab includes shipped, partially_shipped, delivered
          query = query.in('status', [
            'shipped',
            'partially_shipped',
            'delivered',
          ]);
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

      // Fetch product images (separate query, same pattern as useSelectionItems)
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
    queryKey: ['linkme-orders-counts', yearFilter],
    queryFn: async (): Promise<Record<string, number>> => {
      const supabase = createClient();

      let query = supabase
        .from('sales_orders')
        .select('status', { count: 'exact', head: false })
        .eq('channel_id', LINKME_CHANNEL_ID);

      // Apply same year filter
      if (yearFilter && yearFilter !== 'all') {
        const year =
          yearFilter === 'current'
            ? new Date().getFullYear()
            : Number(yearFilter);
        query = query
          .gte('created_at', `${year}-01-01`)
          .lt('created_at', `${year + 1}-01-01`);
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

      // Group shipped statuses for the "shipped" tab
      counts['shipped_tab'] =
        (counts['shipped'] ?? 0) +
        (counts['partially_shipped'] ?? 0) +
        (counts['delivered'] ?? 0);

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
export interface OrderStats {
  total_orders: number;
  total_ht: number;
  total_affiliate_margins: number;
  orders_by_status: Record<string, number>;
}

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

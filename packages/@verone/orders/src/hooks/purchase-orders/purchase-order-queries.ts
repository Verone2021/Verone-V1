'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderStats,
  OrderPayment,
} from './types';

// PERFORMANCE FIX #3: Payload Optimization (+200ms gain)
// SELECT colonnes explicites au lieu de *
const PO_ITEMS_SELECT = `
  id,
  purchase_order_id,
  product_id,
  quantity,
  unit_price_ht,
  discount_percentage,
  total_ht,
  eco_tax,
  unit_cost_net,
  quantity_received,
  expected_delivery_date,
  notes,
  created_at,
  updated_at,
  sample_type,
  customer_organisation_id,
  customer_individual_id,
  customer_organisation:organisations!purchase_order_items_customer_organisation_id_fkey (
    id,
    legal_name,
    trade_name
  ),
  customer_individual:individual_customers!purchase_order_items_customer_individual_id_fkey (
    id,
    first_name,
    last_name
  ),
  products (
    id,
    name,
    sku,
    stock_quantity,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    product_images!left (
      public_url,
      is_primary
    )
  )
`;

const PO_ORG_SELECT = `
  id,
  legal_name,
  trade_name,
  email,
  phone,
  payment_terms
`;

const PO_LIST_SELECT = `
  id,
  po_number,
  supplier_id,
  status,
  payment_status_v2,
  paid_amount,
  paid_at,
  manual_payment_type,
  manual_payment_date,
  manual_payment_reference,
  manual_payment_note,
  manual_payment_by,
  currency,
  tax_rate,
  total_ht,
  total_ttc,
  order_date,
  expected_delivery_date,
  delivery_address,
  payment_terms,
  notes,
  created_by,
  validated_by,
  received_by,
  validated_at,
  received_at,
  cancelled_at,
  created_at,
  updated_at,
  organisations (${PO_ORG_SELECT}),
  purchase_order_items (${PO_ITEMS_SELECT})
`;

const PO_DETAIL_SELECT = `
  id,
  po_number,
  supplier_id,
  status,
  currency,
  tax_rate,
  total_ht,
  total_ttc,
  order_date,
  expected_delivery_date,
  delivery_address,
  payment_terms,
  payment_status_v2,
  paid_amount,
  paid_at,
  manual_payment_type,
  manual_payment_date,
  manual_payment_reference,
  manual_payment_note,
  notes,
  created_by,
  validated_by,
  received_by,
  validated_at,
  received_at,
  cancelled_at,
  created_at,
  updated_at,
  organisations (${PO_ORG_SELECT}),
  purchase_order_items (${PO_ITEMS_SELECT})
`;

function enrichItemWithImage(
  item: Record<string, unknown>
): Record<string, unknown> {
  const products = item.products as Record<string, unknown> | null;
  return {
    ...item,
    products: products
      ? {
          ...products,
          primary_image_url:
            (
              products.product_images as Array<{
                public_url: string;
              }> | null
            )?.[0]?.public_url ?? null,
        }
      : null,
  };
}

export async function fetchOrders(
  supabase: SupabaseClient,
  filters?: PurchaseOrderFilters
): Promise<PurchaseOrder[]> {
  let query = supabase
    .from('purchase_orders')
    .select(PO_LIST_SELECT)
    .order('created_at', { ascending: false });

  // Appliquer les filtres
  if (filters?.supplier_id)
    query = query.eq('supplier_id', filters.supplier_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.date_from) query = query.gte('created_at', filters.date_from);
  if (filters?.date_to) query = query.lte('created_at', filters.date_to);
  if (filters?.po_number)
    query = query.ilike('po_number', `%${filters.po_number}%`);

  const { data, error } = await query;
  if (error) throw error;

  // Cast needed: Supabase types might be stale (payment_status_v2, manual_payment_*)
  const ordersData = (data ?? []) as Array<Record<string, unknown>>;

  // 🆕 Récupérer les transactions liées (rapprochement bancaire)
  const orderIds = ordersData.map(o => o.id as string);
  const matchedOrdersMap = new Map<
    string,
    {
      transaction_id: string;
      label: string;
      amount: number;
      emitted_at: string | null;
    }
  >();

  if (orderIds.length > 0) {
    const { data: links } = await supabase
      .from('transaction_document_links')
      .select(
        `
        purchase_order_id,
        transaction_id,
        bank_transactions!inner (
          id,
          label,
          amount,
          emitted_at
        )
      `
      )
      .in('purchase_order_id', orderIds)
      .eq('link_type', 'purchase_order');

    for (const link of links ?? []) {
      if (link.purchase_order_id && link.bank_transactions) {
        const bt = link.bank_transactions as unknown as {
          id: string;
          label: string | null;
          amount: number | null;
          emitted_at: string | null;
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        matchedOrdersMap.set(link.purchase_order_id, {
          transaction_id: bt.id,
          label: bt.label ?? '',
          amount: bt.amount ?? 0,
          emitted_at: bt.emitted_at ?? null,
        });
      }
    }
  }

  // Enrichir les produits avec primary_image_url (BR-TECH-002) + rapprochement
  const enrichedOrders = ordersData.map(order => {
    const matchInfo = matchedOrdersMap.get(order.id as string);
    const poItems = (order.purchase_order_items ?? []) as Array<
      Record<string, unknown>
    >;
    return {
      ...order,
      // 🆕 Rapprochement bancaire
      is_matched: !!matchInfo,
      matched_transaction_id: matchInfo?.transaction_id ?? null,
      matched_transaction_label: matchInfo?.label ?? null,
      matched_transaction_amount: matchInfo?.amount ?? null,
      matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
      purchase_order_items: poItems.map(enrichItemWithImage),
    };
  });

  return enrichedOrders as unknown as PurchaseOrder[];
}

// Récupérer une commande spécifique (Optimisé)
export async function fetchOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<PurchaseOrder | null> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(PO_DETAIL_SELECT)
    .eq('id', orderId)
    .single();

  if (error) throw error;

  // Enrichir les produits avec primary_image_url (BR-TECH-002)
  const enrichedItems = (data.purchase_order_items ?? []).map(item => {
    const products = item.products as unknown as Record<string, unknown> | null;
    return {
      ...item,
      products: products
        ? {
            ...products,
            primary_image_url:
              (
                products.product_images as Array<{ public_url: string }> | null
              )?.[0]?.public_url ?? null,
          }
        : null,
    };
  });

  return {
    ...data,
    purchase_order_items: enrichedItems,
  } as unknown as PurchaseOrder;
}

// Récupérer les statistiques
export async function fetchStats(
  supabase: SupabaseClient,
  filters?: PurchaseOrderFilters
): Promise<PurchaseOrderStats> {
  let query = supabase
    .from('purchase_orders')
    .select('status, total_ht, eco_tax_total, total_ttc');

  if (filters?.date_from) query = query.gte('created_at', filters.date_from);
  if (filters?.date_to) query = query.lte('created_at', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;

  // Type narrowing for Supabase result (eco_tax_total may not be in generated types)
  type StatsRow = {
    status: string;
    total_ht: number | null;
    eco_tax_total?: number | null;
    total_ttc: number | null;
  };
  const typedData = (data ?? []) as unknown as StatsRow[];

  return typedData.reduce(
    (acc, order) => {
      acc.total_orders++;
      acc.total_value += order.total_ht ?? 0;
      switch (order.status) {
        case 'draft':
        case 'validated':
        case 'partially_received':
          acc.pending_orders++;
          break;
        case 'received':
          acc.received_orders++;
          break;
        case 'cancelled':
          acc.cancelled_orders++;
          break;
      }
      return acc;
    },
    {
      total_orders: 0,
      total_value: 0,
      pending_orders: 0,
      received_orders: 0,
      cancelled_orders: 0,
    }
  );
}

// Fetch payment history from order_payments table
export async function fetchOrderPayments(
  supabase: SupabaseClient,
  orderId: string
): Promise<OrderPayment[]> {
  const { data, error } = await supabase
    .from('order_payments')
    .select(
      'id, payment_type, amount, payment_date, reference, note, created_at'
    )
    .eq('purchase_order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching PO payments:', error);
    return [];
  }
  return (data ?? []) as OrderPayment[];
}

// Obtenir le stock avec prévisionnel pour les commandes fournisseurs
export async function getStockWithForecasted(
  supabase: SupabaseClient,
  productId: string
): Promise<{
  stock_real: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  stock_available: number;
  stock_future: number;
}> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('stock_real, stock_forecasted_in, stock_forecasted_out')
      .eq('id', productId)
      .single();

    if (error) throw error;

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stock_real: data?.stock_real ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stock_forecasted_in: data?.stock_forecasted_in ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stock_forecasted_out: data?.stock_forecasted_out ?? 0,
      stock_available:
        (data?.stock_real ?? 0) +
        (data?.stock_forecasted_in ?? 0) -
        (data?.stock_forecasted_out ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      stock_future: (data?.stock_real ?? 0) + (data?.stock_forecasted_in ?? 0),
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error);
    return {
      stock_real: 0,
      stock_forecasted_in: 0,
      stock_forecasted_out: 0,
      stock_available: 0,
      stock_future: 0,
    };
  }
}

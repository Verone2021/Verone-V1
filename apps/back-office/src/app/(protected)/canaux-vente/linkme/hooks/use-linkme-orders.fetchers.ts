import { createClient } from '@verone/utils/supabase/client';

import {
  LINKME_CHANNEL_ID,
  type LinkMeOrder,
  type LinkMeOrderItem,
  type SalesOrderItemWithProduct,
  type SalesOrderWithCustomer,
  type SalesOrderWithItems,
} from './use-linkme-orders.types';

/**
 * Récupère les commandes LinkMe (canal = LinkMe)
 */
export async function fetchLinkMeOrders(): Promise<LinkMeOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      order_number,
      linkme_display_number,
      channel_id,
      customer_id,
      customer_type,
      status,
      payment_status_v2,
      total_ht,
      total_ttc,
      created_at,
      updated_at
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch commandes LinkMe:', error);
    throw error;
  }

  return (data ?? []).map(
    (order: SalesOrderWithCustomer): LinkMeOrder => ({
      ...order,
      tax_rate: 0,
      shipping_cost_ht: 0,
      insurance_cost_ht: 0,
      handling_cost_ht: 0,
      notes: null,
      customer_organisation_id:
        order.customer_type === 'organization' ? order.customer_id : null,
      individual_customer_id:
        order.customer_type === 'individual' ? order.customer_id : null,
    })
  );
}

/**
 * Récupère une commande LinkMe par ID avec tous ses détails
 */
export async function fetchLinkMeOrderById(
  orderId: string
): Promise<LinkMeOrder> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      `
      id,
      order_number,
      channel_id,
      customer_id,
      customer_type,
      status,
      payment_status_v2,
      total_ht,
      total_ttc,
      tax_rate,
      shipping_cost_ht,
      insurance_cost_ht,
      handling_cost_ht,
      notes,
      created_at,
      updated_at,
      sales_order_items (
        id,
        product_id,
        quantity,
        unit_price_ht,
        total_ht,
        retrocession_rate,
        retrocession_amount,
        base_price_ht_locked,
        selling_price_ht_locked,
        linkme_selection_item_id,
        linkme_selection_items (
          base_price_ht,
          margin_rate,
          selling_price_ht
        ),
        products (
          id,
          name,
          sku
        )
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Erreur fetch commande LinkMe:', error);
    throw error;
  }

  const order = data as SalesOrderWithItems;
  return {
    ...order,
    customer_organisation_id:
      order.customer_type === 'organization' ? order.customer_id : null,
    individual_customer_id:
      order.customer_type === 'individual' ? order.customer_id : null,
    items: (order.sales_order_items ?? []).map(
      (item: SalesOrderItemWithProduct): LinkMeOrderItem => ({
        id: item.id,
        sales_order_id: orderId,
        product_id: item.product_id,
        product_name: item.products?.name ?? 'Produit inconnu',
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        total_ht: item.total_ht,
        retrocession_rate: item.retrocession_rate,
        retrocession_amount: item.retrocession_amount,
        linkme_selection_item_id: item.linkme_selection_item_id,
        base_price_ht:
          item.base_price_ht_locked ??
          item.linkme_selection_items?.base_price_ht ??
          item.unit_price_ht,
        margin_rate: item.linkme_selection_items?.margin_rate ?? 0,
        base_price_ht_locked: item.base_price_ht_locked,
        selling_price_ht_locked: item.selling_price_ht_locked,
      })
    ),
  };
}

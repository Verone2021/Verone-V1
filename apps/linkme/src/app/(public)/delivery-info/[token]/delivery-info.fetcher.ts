import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrderWithDetails, TokenValidation } from './delivery-info.types';

interface RawOrderItem {
  id: string;
  quantity: number;
  products: Array<{ name: string }> | { name: string } | null;
}

interface RawOrderData {
  id: string;
  order_number: string;
  total_ttc: number;
  status: string;
  expected_delivery_date: string | null;
  organisations: Array<{
    trade_name: string | null;
    legal_name: string;
  }> | null;
  sales_order_items: RawOrderItem[] | null;
}

function buildOrderFromData(
  orderData: RawOrderData,
  detailsData: OrderWithDetails['linkmeDetails']
): OrderWithDetails {
  return {
    id: orderData.id,
    order_number: orderData.order_number,
    total_ttc: orderData.total_ttc,
    status: orderData.status,
    expected_delivery_date: orderData.expected_delivery_date,
    organisation: orderData.organisations?.[0] ?? null,
    linkmeDetails: detailsData,
    items: (orderData.sales_order_items ?? []).map(item => ({
      id: item.id,
      quantity: item.quantity,
      // Supabase returns products as array from join, take first element
      product: Array.isArray(item.products)
        ? (item.products[0] ?? null)
        : item.products,
    })),
  };
}

const ORDER_SELECT = `
  id,
  order_number,
  total_ttc,
  status,
  expected_delivery_date,
  organisations!sales_orders_customer_id_fkey (
    trade_name,
    legal_name
  ),
  sales_order_items (
    id,
    quantity,
    products (name)
  )
`;

export async function validateToken(
  supabase: SupabaseClient,
  token: string
): Promise<TokenValidation> {
  const { data: detailsData, error: detailsError } = await supabase
    .from('sales_order_linkme_details')
    .select(
      `id, sales_order_id, requester_name, requester_email,
       desired_delivery_date, step4_token_expires_at, step4_completed_at,
       reception_contact_name, reception_contact_email,
       reception_contact_phone, confirmed_delivery_date`
    )
    .eq('step4_token', token)
    .single();

  if (detailsError ?? !detailsData) {
    return {
      valid: false,
      expired: false,
      alreadyCompleted: false,
      order: null,
      error: 'Lien invalide ou expiré',
    };
  }

  if (detailsData.step4_token_expires_at) {
    if (new Date(detailsData.step4_token_expires_at as string) < new Date()) {
      return {
        valid: false,
        expired: true,
        alreadyCompleted: false,
        order: null,
        error: 'Ce lien a expiré',
      };
    }
  }

  const linkmeDetails = detailsData as OrderWithDetails['linkmeDetails'];

  if (detailsData.step4_completed_at) {
    const { data: orderData } = await supabase
      .from('sales_orders')
      .select(ORDER_SELECT)
      .eq('id', detailsData.sales_order_id)
      .single();

    return {
      valid: false,
      expired: false,
      alreadyCompleted: true,
      order: orderData
        ? buildOrderFromData(
            orderData as unknown as RawOrderData,
            linkmeDetails
          )
        : null,
    };
  }

  const { data: orderData, error: orderError } = await supabase
    .from('sales_orders')
    .select(ORDER_SELECT)
    .eq('id', detailsData.sales_order_id)
    .single();

  if (orderError ?? !orderData) {
    return {
      valid: false,
      expired: false,
      alreadyCompleted: false,
      order: null,
      error: 'Commande non trouvée',
    };
  }

  return {
    valid: true,
    expired: false,
    alreadyCompleted: false,
    order: buildOrderFromData(
      orderData as unknown as RawOrderData,
      linkmeDetails
    ),
  };
}

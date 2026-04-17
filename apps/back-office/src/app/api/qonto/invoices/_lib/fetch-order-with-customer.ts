import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';
import type {
  ISalesOrderWithItems,
  ISalesOrderWithCustomer,
  Organisation,
  IndividualCustomer,
} from './types';

export async function fetchOrderWithCustomer(
  supabase: SupabaseClient<Database>,
  salesOrderId: string
): Promise<{
  order: ISalesOrderWithCustomer | null;
  error: NextResponse | null;
}> {
  // Récupérer la commande avec ses lignes (sans jointures polymorphiques)
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(
      `
      *,
      sales_order_items (
        *,
        products:product_id (id, name, sku)
      )
    `
    )
    .eq('id', salesOrderId)
    .single();

  if (orderError || !order) {
    console.error('[API Qonto Invoices] Order fetch error:', orderError);
    return {
      order: null,
      error: NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      ),
    };
  }

  // Cast to typed order
  const orderWithItems = order as ISalesOrderWithItems;

  // Fetch manuel du customer selon customer_type (pattern polymorphique)
  let customer: Organisation | IndividualCustomer | null = null;

  if (orderWithItems.customer_id && orderWithItems.customer_type) {
    if (orderWithItems.customer_type === 'organization') {
      const { data: org } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', orderWithItems.customer_id)
        .single();
      customer = org;
    } else if (
      orderWithItems.customer_type === 'individual' &&
      orderWithItems.individual_customer_id
    ) {
      const { data: indiv } = await supabase
        .from('individual_customers')
        .select('*')
        .eq('id', orderWithItems.individual_customer_id)
        .single();
      customer = indiv;
    }
  }

  const typedOrder: ISalesOrderWithCustomer = {
    ...orderWithItems,
    customer,
  };

  return { order: typedOrder, error: null };
}

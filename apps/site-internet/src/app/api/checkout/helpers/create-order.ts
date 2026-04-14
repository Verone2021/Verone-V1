import { createClient } from '@supabase/supabase-js';

import type { ValidatedDiscount } from './types';

const SITE_INTERNET_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

interface OrderItem {
  product_id: string;
  name: string;
  price_ttc: number;
  quantity: number;
  include_assembly: boolean;
  assembly_price: number;
  eco_participation: number;
}

export interface CreateOrderResult {
  orderId: string | null;
}

export async function createDraftOrder(
  items: OrderItem[],
  customer: CustomerData,
  userId: string | undefined,
  discount: ValidatedDiscount | undefined,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<CreateOrderResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const subtotalAmount = items.reduce(
    (sum, item) =>
      sum +
      (item.price_ttc +
        item.eco_participation +
        (item.include_assembly ? item.assembly_price : 0)) *
        item.quantity,
    0
  );

  // Find or create individual_customer (by auth_user_id first, then email)
  let customerId: string | null = null;

  if (userId) {
    const { data } = await supabase
      .from('individual_customers')
      .select('id')
      .eq('auth_user_id', userId)
      .limit(1)
      .single();
    if (data) customerId = String(data.id);
  }
  if (!customerId) {
    const { data } = await supabase
      .from('individual_customers')
      .select('id')
      .eq('email', customer.email)
      .limit(1)
      .single();
    if (data) customerId = String(data.id);
  }

  if (!customerId) {
    const { data: newCustomer } = await supabase
      .from('individual_customers')
      .insert({
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone || null,
        address_line1: customer.address,
        postal_code: customer.postalCode,
        city: customer.city,
        country: customer.country ?? 'FR',
        source_type: 'site-internet',
        is_active: true,
        ...(userId ? { auth_user_id: userId } : {}),
      })
      .select('id')
      .single();

    customerId = newCustomer ? String(newCustomer.id) : null;
  }

  // Generate order number atomically via PostgreSQL sequence
  const { data: seqData, error: seqError } = (await supabase
    .rpc('nextval_text', { seq_name: 'site_order_number_seq' })
    .single()) as { data: string | null; error: unknown };

  let orderNumber: string;
  if (seqError || !seqData) {
    orderNumber = `VER-SI-${Date.now()}`;
    console.warn('[Checkout] Sequence fallback used:', orderNumber);
  } else {
    orderNumber = `VER-SI-${seqData}`;
  }

  const shippingCountry = String(customer.country ?? 'FR');
  const shippingAddressJson = {
    line1: customer.address,
    postal_code: customer.postalCode,
    city: customer.city,
    country: shippingCountry,
  };

  const discountAmount = discount?.discount_amount ?? 0;
  const finalTtc = Math.max(subtotalAmount - discountAmount, 0);

  const { data: orderDataRaw, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      order_number: orderNumber,
      channel_id: SITE_INTERNET_CHANNEL_ID,
      customer_type: 'individual',
      individual_customer_id: customerId,
      status: 'draft',
      payment_status_v2: 'pending',
      shipping_address: shippingAddressJson,
      total_ttc: finalTtc,
      total_ht: Math.round((finalTtc / 1.2) * 100) / 100,
      ...(discount
        ? {
            applied_discount_id: discount.discount_id,
            applied_discount_code: discount.code,
            applied_discount_amount: discountAmount,
          }
        : {}),
    })
    .select('id')
    .single();

  if (orderError) {
    console.error('[Checkout] Pre-create order failed:', orderError);
    return { orderId: null };
  }

  const orderData = orderDataRaw as { id: string } | null;
  const orderId = orderData ? String(orderData.id) : null;

  if (orderId) {
    const orderItems = items.map(item => ({
      sales_order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_ht: Math.round((item.price_ttc / 1.2) * 100) / 100,
      tax_rate: 0.2,
    }));

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[Checkout] Order items creation failed:', itemsError);
    }

    console.warn('[Checkout] Pre-created draft order:', orderNumber);
  }

  return { orderId };
}

export async function createAmbassadorAttribution(
  orderId: string,
  discountCode: string,
  finalTtc: number,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: ambassadorCode } = await supabase
    .from('ambassador_codes')
    .select('id, ambassador_id, code')
    .eq('code', discountCode.toUpperCase())
    .eq('is_active', true)
    .single();

  if (!ambassadorCode) return;

  const ambCode = ambassadorCode as {
    id: string;
    ambassador_id: string;
    code: string;
  };

  const { data: ambassador } = await supabase
    .from('site_ambassadors')
    .select('id, commission_rate')
    .eq('id', ambCode.ambassador_id)
    .eq('is_active', true)
    .single();

  if (!ambassador) return;

  const amb = ambassador as { id: string; commission_rate: number };
  const orderHt = Math.round((finalTtc / 1.2) * 100) / 100;
  const primeAmount =
    Math.round(orderHt * (Number(amb.commission_rate) / 100) * 100) / 100;
  const validationDate = new Date();
  validationDate.setDate(validationDate.getDate() + 30);

  const { error: attrError } = await supabase
    .from('ambassador_attributions')
    .insert({
      order_id: orderId,
      ambassador_id: amb.id,
      code_id: ambCode.id,
      order_total_ht: orderHt,
      commission_rate: Number(ambassador.commission_rate),
      prime_amount: primeAmount,
      status: 'pending',
      validation_date: validationDate.toISOString(),
      attribution_method: 'coupon_code',
    });

  if (attrError) {
    // Non-blocking: log but don't fail the checkout
    console.error('[Checkout] Ambassador attribution failed:', attrError);
  } else {
    console.warn(
      `[Checkout] Ambassador attribution created: ${ambCode.code} → ${primeAmount} EUR`
    );
  }
}

export async function fetchMaxProductShippingCents(
  productIds: string[],
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<number> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: productsData } = await supabase
    .from('products')
    .select('id, shipping_cost_estimate')
    .in('id', productIds);

  if (!productsData) return 0;

  const estimates = (
    productsData as Array<{
      id: string;
      shipping_cost_estimate: number | null;
    }>
  )
    .filter(p => p.shipping_cost_estimate != null)
    .map(p => Math.round((p.shipping_cost_estimate ?? 0) * 100));

  return estimates.length > 0 ? Math.max(...estimates) : 0;
}

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CheckoutItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  price_ttc: z.number().min(0),
  quantity: z.number().int().min(1),
  include_assembly: z.boolean(),
  assembly_price: z.number().min(0),
  eco_participation: z.number().min(0),
});

const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default('FR'),
  }),
});

interface ShippingConfig {
  standard_enabled: boolean;
  standard_label: string;
  standard_price_cents: number;
  standard_min_days: number;
  standard_max_days: number;
  express_enabled: boolean;
  express_label: string;
  express_price_cents: number;
  express_min_days: number;
  express_max_days: number;
  free_shipping_enabled: boolean;
  free_shipping_threshold_cents: number;
  free_shipping_applies_to: 'standard' | 'all';
  allowed_countries: string[];
  shipping_info_message?: string;
}

const DEFAULT_SHIPPING: ShippingConfig = {
  standard_enabled: true,
  standard_label: 'Livraison standard',
  standard_price_cents: 1290,
  standard_min_days: 5,
  standard_max_days: 7,
  express_enabled: false,
  express_label: 'Livraison express',
  express_price_cents: 1990,
  express_min_days: 2,
  express_max_days: 3,
  free_shipping_enabled: true,
  free_shipping_threshold_cents: 15000,
  free_shipping_applies_to: 'standard',
  allowed_countries: ['FR'],
};

async function getShippingConfig(): Promise<ShippingConfig> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Checkout] Supabase not configured - using default shipping');
    return DEFAULT_SHIPPING;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from('sales_channels')
    .select('config')
    .eq('code', 'site_internet')
    .single();

  if (error || !data) {
    console.warn('[Checkout] Failed to fetch shipping config:', error?.message);
    return DEFAULT_SHIPPING;
  }

  const config = data.config as Record<string, unknown> | null;
  const shipping = config?.shipping as ShippingConfig | undefined;

  return shipping ?? DEFAULT_SHIPPING;
}

interface ShippingRateData {
  shipping_rate_data: {
    type: 'fixed_amount';
    fixed_amount: { amount: number; currency: string };
    display_name: string;
    delivery_estimate: {
      minimum: { unit: 'business_day'; value: number };
      maximum: { unit: 'business_day'; value: number };
    };
  };
}

function buildShippingOptions(
  shipping: ShippingConfig,
  subtotalCents: number
): ShippingRateData[] {
  const options: ShippingRateData[] = [];

  if (shipping.standard_enabled) {
    const isFree =
      shipping.free_shipping_enabled &&
      subtotalCents >= shipping.free_shipping_threshold_cents &&
      ['standard', 'all'].includes(shipping.free_shipping_applies_to);

    options.push({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: isFree ? 0 : shipping.standard_price_cents,
          currency: 'eur',
        },
        display_name: isFree
          ? `${shipping.standard_label} (offerte)`
          : shipping.standard_label,
        delivery_estimate: {
          minimum: { unit: 'business_day', value: shipping.standard_min_days },
          maximum: { unit: 'business_day', value: shipping.standard_max_days },
        },
      },
    });
  }

  if (shipping.express_enabled) {
    const isFree =
      shipping.free_shipping_enabled &&
      shipping.free_shipping_applies_to === 'all' &&
      subtotalCents >= shipping.free_shipping_threshold_cents;

    options.push({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: isFree ? 0 : shipping.express_price_cents,
          currency: 'eur',
        },
        display_name: isFree
          ? `${shipping.express_label} (offerte)`
          : shipping.express_label,
        delivery_estimate: {
          minimum: { unit: 'business_day', value: shipping.express_min_days },
          maximum: { unit: 'business_day', value: shipping.express_max_days },
        },
      },
    });
  }

  return options;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validated = CheckoutSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { items, customer } = validated.data;

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.warn(
        '[Checkout] STRIPE_SECRET_KEY not configured - using dev mode'
      );
      return NextResponse.json({
        url: `/checkout/success?session_id=dev_${Date.now()}`,
      });
    }

    // Fetch shipping config from DB
    const shipping = await getShippingConfig();

    // Pre-create order in sales_orders as draft
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let orderId: string | null = null;

    if (supabaseUrl && supabaseServiceKey) {
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

      // Find or create individual_customer
      const { data: existingCustomer } = await supabase
        .from('individual_customers')
        .select('id')
        .eq('email', customer.email)
        .limit(1)
        .single();

      let customerId: string | null = existingCustomer
        ? String(existingCustomer.id)
        : null;

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
            country: (customer.country as string | undefined) ?? 'FR',
            source_type: 'site-internet',
            is_active: true,
          })
          .select('id')
          .single();

        customerId = newCustomer ? String(newCustomer.id) : null;
      }

      // Generate order number
      const year = new Date().getFullYear();
      const prefix = `SO-${year}-`;
      const { data: lastOrderRaw } = await supabase
        .from('sales_orders')
        .select('order_number')
        .like('order_number', `${prefix}%`)
        .order('order_number', { ascending: false })
        .limit(1)
        .single();

      const lastOrder = lastOrderRaw as { order_number?: string } | null;
      const lastNum = lastOrder?.order_number
        ? parseInt(lastOrder.order_number.replace(prefix, ''), 10)
        : 0;
      const orderNumber = `${prefix}${String(lastNum + 1).padStart(5, '0')}`;

      // Shipping address as JSONB
      const shippingCountry = String(customer.country ?? 'FR');
      const shippingAddressJson = {
        line1: customer.address,
        postal_code: customer.postalCode,
        city: customer.city,
        country: shippingCountry,
      };

      const { data: orderDataRaw, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          order_number: orderNumber,
          channel_id: '0c2639e9-df80-41fa-84d0-9da96a128f7f',
          customer_type: 'individual',
          individual_customer_id: customerId,
          status: 'draft',
          payment_status_v2: 'pending',
          shipping_address: shippingAddressJson,
          total_ttc: subtotalAmount,
          total_ht: Math.round((subtotalAmount / 1.2) * 100) / 100,
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('[Checkout] Pre-create order failed:', orderError);
      } else {
        const orderData = orderDataRaw as { id: string } | null;
        orderId = orderData ? String(orderData.id) : null;

        // Create sales_order_items
        const orderItems = items.map(item => ({
          sales_order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: Math.round((item.price_ttc / 1.2) * 100) / 100,
          tax_rate: 20,
          total_ht: Math.round(
            ((item.price_ttc / 1.2) * item.quantity * 100) / 100
          ),
        }));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('[Checkout] Order items creation failed:', itemsError);
        }

        console.warn('[Checkout] Pre-created draft order:', orderNumber);
      }
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    });

    const lineItems = items.map(item => {
      const unitAmount = Math.round(
        (item.price_ttc +
          item.eco_participation +
          (item.include_assembly ? item.assembly_price : 0)) *
          100
      );

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            ...(item.include_assembly
              ? { description: 'Avec service de montage' }
              : {}),
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Calculate subtotal in cents for shipping threshold
    const subtotalCents = items.reduce(
      (sum, item) =>
        sum +
        Math.round(
          (item.price_ttc +
            item.eco_participation +
            (item.include_assembly ? item.assembly_price : 0)) *
            100
        ) *
          item.quantity,
      0
    );

    const shippingOptions = buildShippingOptions(shipping, subtotalCents);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      line_items: lineItems,
      mode: 'payment',
      invoice_creation: { enabled: true },
      shipping_options: shippingOptions,
      shipping_address_collection: {
        allowed_countries:
          shipping.allowed_countries.length > 0
            ? (shipping.allowed_countries as ['FR'])
            : (['FR'] as const),
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      customer_email: customer.email,
      metadata: {
        customer_name: `${customer.firstName} ${customer.lastName}`,
        customer_phone: customer.phone,
        shipping_address: `${customer.address}, ${customer.postalCode} ${customer.city}`,
        ...(orderId ? { order_id: orderId } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
}

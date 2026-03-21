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

const BillingSchema = z.object({
  address: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().default('FR'),
});

const DiscountSchema = z.object({
  code: z.string().min(1),
  amount: z.number().min(0),
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
  userId: z.string().uuid().optional(),
  billing: BillingSchema.optional(),
  discount: DiscountSchema.optional(),
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
  standard_min_days: 10,
  standard_max_days: 14,
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

    const { items, customer, billing, discount, userId } = validated.data;

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

    // Pre-create pending order with full items data
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

      const shippingAddr = `${customer.address}, ${customer.postalCode} ${customer.city}`;
      const billingAddr = billing
        ? `${billing.address}, ${billing.postalCode} ${billing.city}`
        : shippingAddr;

      const { data: orderData, error: orderError } = await supabase
        .from('site_orders')
        .insert({
          status: 'pending',
          user_id: userId ?? null,
          customer_name: `${customer.firstName} ${customer.lastName}`,
          customer_email: customer.email,
          customer_phone: customer.phone,
          shipping_address: shippingAddr,
          billing_address: billingAddr,
          items: items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            price_ttc: item.price_ttc,
            quantity: item.quantity,
            include_assembly: item.include_assembly,
            assembly_price: item.assembly_price,
            eco_participation: item.eco_participation,
          })),
          subtotal: subtotalAmount,
          total: subtotalAmount, // Shipping added after Stripe session
          currency: 'EUR',
          discount_code: discount?.code ?? null,
          discount_amount: discount?.amount ?? 0,
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('[Checkout] Failed to pre-create order:', orderError);
      } else {
        orderId = orderData.id as string;
        console.warn('[Checkout] Pre-created pending order:', orderId);
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

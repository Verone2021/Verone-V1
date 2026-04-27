import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  createAmbassadorAttribution,
  createDraftOrder,
  fetchMaxProductShippingCents,
} from './helpers/create-order';
import { buildShippingOptions, getShippingConfig } from './helpers/shipping';
import { CheckoutSchema } from './helpers/types';
import { validatePromoServerSide } from './helpers/validate-promo';
import type { ValidatedDiscount } from './helpers/types';

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

    const {
      items,
      customer,
      userId,
      discount: frontendDiscount,
    } = validated.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Server-side promo revalidation — NEVER trust frontend discount_amount
    let discount: ValidatedDiscount | undefined;
    if (frontendDiscount?.code && supabaseUrl && supabaseServiceKey) {
      const subtotalForPromo = items.reduce(
        (sum, item) =>
          sum +
          (item.price_ttc +
            item.eco_participation +
            (item.include_assembly ? item.assembly_price : 0)) *
            item.quantity,
        0
      );

      const promoResult = await validatePromoServerSide(
        frontendDiscount,
        subtotalForPromo,
        supabaseUrl,
        supabaseServiceKey
      );

      if ('error' in promoResult) {
        return NextResponse.json({ error: promoResult.error }, { status: 400 });
      }

      discount = promoResult;
    }

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

    // Pre-create draft order
    let orderId: string | null = null;
    let finalTtc = 0;

    if (supabaseUrl && supabaseServiceKey) {
      const subtotalAmount = items.reduce(
        (sum, item) =>
          sum +
          (item.price_ttc +
            item.eco_participation +
            (item.include_assembly ? item.assembly_price : 0)) *
            item.quantity,
        0
      );
      const discountAmount = discount?.discount_amount ?? 0;
      finalTtc = Math.max(subtotalAmount - discountAmount, 0);

      const result = await createDraftOrder(
        items,
        customer,
        userId,
        discount,
        supabaseUrl,
        supabaseServiceKey
      );
      orderId = result.orderId;

      // ADR-021 D3 + D4 : ambassador attribution (non-blocking)
      // Priority: explicit promo code wins over referral cookie (D11).
      // If no code but referral cookie present, attribute via 'referral_link'
      // without applying any discount to the customer (D4).
      const cookieStore = await cookies();
      const referralCookieCode = cookieStore.get('verone_ref')?.value;
      const ambassadorCode = discount?.code ?? referralCookieCode;
      const attributionMethod: 'coupon_code' | 'referral_link' = discount?.code
        ? 'coupon_code'
        : 'referral_link';

      if (orderId && ambassadorCode) {
        await createAmbassadorAttribution(
          orderId,
          ambassadorCode,
          finalTtc,
          supabaseUrl,
          supabaseServiceKey,
          attributionMethod
        );
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

    // Fetch product shipping estimates
    let maxProductShippingCents = 0;
    if (supabaseUrl && supabaseServiceKey) {
      maxProductShippingCents = await fetchMaxProductShippingCents(
        items.map(item => item.product_id),
        supabaseUrl,
        supabaseServiceKey
      );
    }

    const shippingOptions = buildShippingOptions(
      shipping,
      subtotalCents,
      maxProductShippingCents
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

    // Create Stripe coupon if discount applied
    let stripeCouponId: string | undefined;
    if (discount && discount.discount_amount > 0) {
      if (discount.discount_type === 'free_shipping') {
        // Free shipping handled by shipping_options — no Stripe coupon needed
      } else if (discount.discount_type === 'percentage') {
        const coupon = await stripe.coupons.create(
          {
            percent_off: discount.discount_value,
            duration: 'once',
            name: discount.code ?? 'Promotion',
          },
          { idempotencyKey: `coupon_pct_${discount.discount_id}` }
        );
        stripeCouponId = coupon.id;
      } else {
        const coupon = await stripe.coupons.create(
          {
            amount_off: Math.round(discount.discount_amount * 100),
            currency: 'eur',
            duration: 'once',
            name: discount.code ?? 'Promotion',
          },
          { idempotencyKey: `coupon_amt_${discount.discount_id}` }
        );
        stripeCouponId = coupon.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      line_items: lineItems,
      mode: 'payment',
      invoice_creation: { enabled: true },
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
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
        ...(discount
          ? {
              discount_id: discount.discount_id,
              discount_code: discount.code ?? '',
              discount_amount: String(discount.discount_amount),
            }
          : {}),
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

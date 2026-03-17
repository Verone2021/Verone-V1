import { NextResponse } from 'next/server';

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
  }),
});

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
      // Stripe not configured - return mock success for development
      console.warn(
        '[Checkout] STRIPE_SECRET_KEY not configured - using dev mode'
      );
      return NextResponse.json({
        url: `/checkout/success?session_id=dev_${Date.now()}`,
      });
    }

    // Dynamic import to avoid error when stripe is not installed
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

    // Calculate shipping
    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        (item.price_ttc +
          item.eco_participation +
          (item.include_assembly ? item.assembly_price : 0)) *
          item.quantity,
      0
    );
    const shippingCost = subtotal >= 500 ? 0 : 49;

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Livraison standard',
          },
          unit_amount: shippingCost * 100,
        },
        quantity: 1,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      customer_email: customer.email,
      metadata: {
        customer_name: `${customer.firstName} ${customer.lastName}`,
        customer_phone: customer.phone,
        shipping_address: `${customer.address}, ${customer.postalCode} ${customer.city}`,
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

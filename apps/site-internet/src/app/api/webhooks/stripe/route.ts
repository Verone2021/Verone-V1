import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.warn('[Stripe Webhook] Not configured - skipping');
    return NextResponse.json({ received: true });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    });

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata ?? {};

        // Create order in database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const orderId = crypto.randomUUID();
          const totalAmount = (session.amount_total ?? 0) / 100;
          const { error: orderError } = await supabase
            .from('site_orders')
            .insert({
              id: orderId,
              user_id: null,
              stripe_session_id: session.id,
              customer_name: metadata.customer_name ?? 'Client',
              customer_email: session.customer_email ?? '',
              customer_phone: metadata.customer_phone ?? '',
              shipping_address: metadata.shipping_address ?? '',
              status: 'paid',
              subtotal: totalAmount,
              shipping_cost: 0,
              total: totalAmount,
              currency: 'EUR',
              items: {},
            });

          if (orderError) {
            console.error(
              '[Stripe Webhook] Order creation failed:',
              orderError
            );
          } else {
            console.warn('[Stripe Webhook] Order created:', orderId);

            // Send confirmation email to customer (non-blocking)
            const siteUrl =
              process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
            void fetch(`${siteUrl}/api/emails/order-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.customer_email,
                customerName: metadata.customer_name ?? 'Client',
                orderId,
                items: [],
                subtotal: (session.amount_total ?? 0) / 100,
                shipping: 0,
                total: (session.amount_total ?? 0) / 100,
                shippingAddress: metadata.shipping_address ?? '',
              }),
            }).catch(emailError => {
              console.error(
                '[Stripe Webhook] Customer email failed:',
                emailError
              );
            });

            // Send notification email to admin team (non-blocking)
            void fetch(`${siteUrl}/api/emails/admin-order-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                customerName: metadata.customer_name ?? 'Client',
                customerEmail: session.customer_email ?? '',
                total: totalAmount,
                itemCount: 0,
                shippingAddress: metadata.shipping_address ?? '',
              }),
            }).catch(emailError => {
              console.error(
                '[Stripe Webhook] Admin notification failed:',
                emailError
              );
            });
          }
        }

        break;
      }
      case 'checkout.session.expired': {
        console.warn('[Stripe Webhook] Session expired:', event.data.object.id);
        break;
      }
      default:
        console.warn('[Stripe Webhook] Unhandled event:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

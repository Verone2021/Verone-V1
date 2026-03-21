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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const totalAmount = (session.amount_total ?? 0) / 100;
          const shippingCost = session.shipping_cost?.amount_total
            ? session.shipping_cost.amount_total / 100
            : 0;
          const subtotalAmount = totalAmount - shippingCost;
          const existingOrderId = metadata.order_id;

          // Extract payment method from Stripe session
          const paymentMethod = session.payment_method_types?.[0] ?? 'card';

          // Extract shipping method chosen by customer
          const shippingMethod = (
            session.shipping_cost as Record<string, unknown> | null | undefined
          )?.shipping_rate
            ? 'standard'
            : null;

          const orderId = existingOrderId ?? crypto.randomUUID();
          let orderError: { message: string } | null = null;

          if (existingOrderId) {
            // Update pre-created pending order to paid
            const { error } = await supabase
              .from('site_orders')
              .update({
                stripe_session_id: session.id,
                status: 'paid',
                subtotal: subtotalAmount,
                shipping_cost: shippingCost,
                total: totalAmount,
                payment_method: paymentMethod,
                shipping_method: shippingMethod,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingOrderId)
              .eq('status', 'pending');

            orderError = error;
            if (!error) {
              console.warn(
                '[Stripe Webhook] Order updated to paid:',
                existingOrderId
              );
            }
          } else {
            // Fallback: insert new order (legacy checkout without pre-creation)
            const { error } = await supabase.from('site_orders').insert({
              id: orderId,
              user_id: null,
              stripe_session_id: session.id,
              customer_name: metadata.customer_name ?? 'Client',
              customer_email: session.customer_email ?? '',
              customer_phone: metadata.customer_phone ?? '',
              shipping_address: metadata.shipping_address ?? '',
              billing_address: metadata.shipping_address ?? '',
              status: 'paid',
              subtotal: subtotalAmount,
              shipping_cost: shippingCost,
              total: totalAmount,
              currency: 'EUR',
              items: {},
              payment_method: paymentMethod,
              shipping_method: shippingMethod,
            });

            orderError = error;
            if (!error) {
              console.warn(
                '[Stripe Webhook] Order created (fallback):',
                orderId
              );
            }
          }

          if (orderError) {
            console.error('[Stripe Webhook] Order save failed:', orderError);
          } else {
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
                subtotal: subtotalAmount,
                shipping: shippingCost,
                total: totalAmount,
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
        const expiredSession = event.data.object;
        const expiredMetadata = expiredSession.metadata ?? {};
        const expiredOrderId = expiredMetadata.order_id;

        // Cancel the pending order if it exists
        if (expiredOrderId) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            await supabase
              .from('site_orders')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString(),
              })
              .eq('id', expiredOrderId)
              .eq('status', 'pending');

            console.warn(
              '[Stripe Webhook] Pending order cancelled:',
              expiredOrderId
            );
          }
        } else {
          console.warn('[Stripe Webhook] Session expired:', expiredSession.id);
        }
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

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const SITE_INTERNET_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Stripe Webhook] Supabase not configured');
      return NextResponse.json({ received: true });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata ?? {};
        const existingOrderId = metadata.order_id;

        const totalAmount = (session.amount_total ?? 0) / 100;
        const shippingCost = session.shipping_cost?.amount_total
          ? session.shipping_cost.amount_total / 100
          : 0;
        const subtotalAmount = totalAmount - shippingCost;
        const _paymentMethod = session.payment_method_types?.[0] ?? 'card';

        if (existingOrderId) {
          // Pre-created order: update to validated + paid
          const { error } = await supabase
            .from('sales_orders')
            .update({
              status: 'validated',
              payment_status_v2: 'paid',
              stripe_session_id: session.id,
              total_ttc: totalAmount,
              total_ht: Math.round((totalAmount / 1.2) * 100) / 100,
              shipping_cost_ht: Math.round((shippingCost / 1.2) * 100) / 100,
              confirmed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingOrderId)
            .eq('status', 'draft');

          if (error) {
            console.error('[Stripe Webhook] Order update failed:', error);
          } else {
            console.warn('[Stripe Webhook] Order validated:', existingOrderId);
          }
        } else {
          // Fallback: create order directly (legacy or no pre-creation)
          const customerName = metadata.customer_name ?? 'Client';
          const customerEmail = session.customer_email ?? '';
          const customerPhone = metadata.customer_phone ?? '';
          const shippingAddress = metadata.shipping_address ?? '';

          // Find or create individual_customer (inline)
          let customerId: string | null = null;
          const { data: existingCust } = await supabase
            .from('individual_customers')
            .select('id')
            .eq('email', customerEmail)
            .limit(1)
            .single();

          if (existingCust) {
            customerId = String(existingCust.id);
          } else {
            const nameParts = customerName.split(' ');
            const { data: newCust } = await supabase
              .from('individual_customers')
              .insert({
                first_name: nameParts[0] ?? 'Client',
                last_name: nameParts.slice(1).join(' ') || '',
                email: customerEmail,
                phone: customerPhone || null,
                source_type: 'site-internet',
                is_active: true,
              })
              .select('id')
              .single();
            customerId = newCust ? String(newCust.id) : null;
          }

          // Generate order number (inline)
          const year = new Date().getFullYear();
          const prefix = `SO-${year}-`;
          const { data: lastOrd } = await supabase
            .from('sales_orders')
            .select('order_number')
            .like('order_number', `${prefix}%`)
            .order('order_number', { ascending: false })
            .limit(1)
            .single();
          const lastN = lastOrd?.order_number
            ? parseInt(String(lastOrd.order_number).replace(prefix, ''), 10)
            : 0;
          const orderNumber = `${prefix}${String(lastN + 1).padStart(5, '0')}`;

          // Parse shipping address into JSONB
          const addressParts = shippingAddress.split(',').map(s => s.trim());
          const shippingAddressJson = {
            line1: addressParts[0] ?? '',
            city: addressParts[1] ?? '',
            country: 'FR',
          };

          const { error } = await supabase.from('sales_orders').insert({
            order_number: orderNumber,
            channel_id: SITE_INTERNET_CHANNEL_ID,
            customer_type: 'individual',
            individual_customer_id: customerId,
            status: 'validated',
            payment_status_v2: 'paid',
            stripe_session_id: session.id,
            shipping_address: shippingAddressJson,
            total_ttc: totalAmount,
            total_ht: Math.round((totalAmount / 1.2) * 100) / 100,
            shipping_cost_ht: Math.round((shippingCost / 1.2) * 100) / 100,
            confirmed_at: new Date().toISOString(),
          });

          if (error) {
            console.error(
              '[Stripe Webhook] Fallback order creation failed:',
              error
            );
          } else {
            console.warn(
              '[Stripe Webhook] Fallback order created:',
              orderNumber
            );
          }
        }

        // Send confirmation email (non-blocking)
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
        void fetch(`${siteUrl}/api/emails/order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.customer_email,
            customerName: metadata.customer_name ?? 'Client',
            orderId: existingOrderId ?? '',
            items: [],
            subtotal: subtotalAmount,
            shipping: shippingCost,
            total: totalAmount,
            shippingAddress: metadata.shipping_address ?? '',
          }),
        }).catch(err => {
          console.error('[Stripe Webhook] Email failed:', err);
        });

        break;
      }

      case 'checkout.session.expired': {
        const expiredSession = event.data.object;
        const expiredOrderId = expiredSession.metadata?.order_id;

        if (expiredOrderId) {
          await supabase
            .from('sales_orders')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', expiredOrderId)
            .eq('status', 'draft');

          console.warn(
            '[Stripe Webhook] Draft order cancelled:',
            expiredOrderId
          );
        }
        break;
      }

      case 'charge.refunded': {
        // Handle refund — find order by payment_intent
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : (charge.payment_intent as unknown as { id?: string } | null)?.id;

        if (paymentIntentId) {
          const { error } = await supabase
            .from('sales_orders')
            .update({
              status: 'cancelled',
              payment_status_v2: 'pending',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId);

          if (!error) {
            console.warn('[Stripe Webhook] Order refunded:', paymentIntentId);
          }
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

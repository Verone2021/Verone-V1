import { NextResponse } from 'next/server';

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
        console.warn(
          '[Stripe Webhook] Payment succeeded:',
          session.id,
          session.metadata
        );
        // TODO: Create order in database, send confirmation email
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

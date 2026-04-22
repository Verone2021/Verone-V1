/**
 * API Route: POST /api/emails/send-shipping-tracking
 * Sends shipping tracking notification email to customer(s) via Resend.
 * Protected: requires authenticated session.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';

import type { Database } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildTrackingEmailHtml } from '../_shared/shipping-tracking-template';

// ── Clients ───────────────────────────────────────────────────────────

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Validation ────────────────────────────────────────────────────────

const SendShippingTrackingSchema = z.object({
  salesOrderId: z.string().uuid(),
  shipmentId: z.string().uuid(),
  to: z.array(z.string().email()).min(1).max(10),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

// ── Order + Shipment fetch ────────────────────────────────────────────

interface ShipmentInfo {
  customerName: string;
  orderNumber: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrierName: string | null;
  shippedAt: string | null;
}

async function fetchShipmentInfo(
  supabase: ReturnType<typeof getAdminClient>,
  salesOrderId: string,
  shipmentId: string
): Promise<ShipmentInfo | null> {
  const [orderResult, shipmentResult] = await Promise.all([
    supabase
      .from('sales_orders')
      .select(
        `
        id, order_number,
        organisations!sales_orders_customer_id_fkey(trade_name, legal_name),
        individual_customers!sales_orders_individual_customer_id_fkey(first_name, last_name)
      `
      )
      .eq('id', salesOrderId)
      .single(),
    supabase
      .from('sales_order_shipments')
      .select('tracking_number, tracking_url, carrier_name, shipped_at')
      .eq('sales_order_id', salesOrderId)
      .eq('id', shipmentId)
      .limit(1)
      .single(),
  ]);

  if (orderResult.error || !orderResult.data) return null;
  if (shipmentResult.error || !shipmentResult.data) return null;

  const order = orderResult.data;
  const shipment = shipmentResult.data;

  const org = (order as Record<string, unknown>).organisations as {
    trade_name: string | null;
    legal_name: string | null;
  } | null;

  const indiv = (order as Record<string, unknown>).individual_customers as {
    first_name: string | null;
    last_name: string | null;
  } | null;

  let customerName = 'Client';
  if (org?.trade_name) {
    customerName = org.trade_name;
  } else if (org?.legal_name) {
    customerName = org.legal_name;
  } else if (indiv?.first_name ?? indiv?.last_name) {
    customerName =
      `${indiv?.first_name ?? ''} ${indiv?.last_name ?? ''}`.trim();
  }

  return {
    customerName,
    orderNumber: order.order_number,
    trackingNumber: shipment.tracking_number,
    trackingUrl: shipment.tracking_url,
    carrierName: shipment.carrier_name,
    shippedAt: shipment.shipped_at,
  };
}

// ── Route ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check
  const authClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only in Route Handler
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError ?? !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = SendShippingTrackingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { salesOrderId, shipmentId, to, subject, message } = parsed.data;
    const supabase = getAdminClient();

    const shipmentInfo = await fetchShipmentInfo(
      supabase,
      salesOrderId,
      shipmentId
    );
    if (!shipmentInfo) {
      return NextResponse.json(
        { success: false, error: 'Order or shipment not found' },
        { status: 404 }
      );
    }

    if (!shipmentInfo.trackingNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tracking number available for this shipment',
        },
        { status: 422 }
      );
    }

    const html = buildTrackingEmailHtml({
      customerName: shipmentInfo.customerName,
      orderNumber: shipmentInfo.orderNumber,
      trackingNumber: shipmentInfo.trackingNumber,
      trackingUrl: shipmentInfo.trackingUrl,
      carrierName: shipmentInfo.carrierName,
      shippedAt: shipmentInfo.shippedAt,
      customMessage: message,
    });

    const resend = getResendClient();
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to,
      subject,
      html,
      attachments: getLogoAttachments(),
    });

    if (emailError) {
      console.error('[send-shipping-tracking] Resend error:', emailError);
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 500 }
      );
    }

    // Log to timeline (non-blocking)
    void supabase
      .from('sales_order_events')
      .insert({
        sales_order_id: salesOrderId,
        event_type: 'email_tracking_sent',
        metadata: {
          recipients: to,
          shipment_id: shipmentId,
          tracking_number: shipmentInfo.trackingNumber,
          resend_id: emailData?.id,
        },
        created_by: user.id,
      })
      .then(({ error: logError }) => {
        if (logError) {
          console.error(
            '[send-shipping-tracking] Timeline log failed:',
            logError
          );
        }
      });

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (error) {
    console.error('[send-shipping-tracking] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

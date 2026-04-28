/**
 * API Route: POST /api/emails/send-shipping-tracking
 * Sends shipping tracking notification email to customer(s) via Resend.
 * Protected: requires authenticated session.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';
import { z } from 'zod';

import type { Database } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import {
  fetchShipmentsInfo,
  getAdminClient,
} from '../_shared/shipping-tracking-data';
import { buildTrackingEmailHtml } from '../_shared/shipping-tracking-template';

// ── Clients ───────────────────────────────────────────────────────────

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

// ── Validation ────────────────────────────────────────────────────────

// Multi-shipments par défaut. shipmentId (singulier) reste accepté pour
// rétro-compat avec les éventuels appels externes pendant la transition.
const SendShippingTrackingSchema = z
  .object({
    salesOrderId: z.string().uuid(),
    shipmentId: z.string().uuid().optional(),
    shipmentIds: z.array(z.string().uuid()).max(10).optional(),
    to: z.array(z.string().email()).min(1).max(10),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
  })
  .refine(
    data => Boolean(data.shipmentId) || (data.shipmentIds?.length ?? 0) > 0,
    { message: 'Provide at least shipmentId or shipmentIds' }
  );

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

    const { salesOrderId, shipmentId, shipmentIds, to, subject, message } =
      parsed.data;
    const supabase = getAdminClient();

    // Normalise : on travaille toujours sur un array (rétro-compat avec
    // l'ancien `shipmentId` singulier).
    const ids = shipmentIds ?? (shipmentId ? [shipmentId] : []);

    const info = await fetchShipmentsInfo(supabase, salesOrderId, ids);
    if (!info) {
      return NextResponse.json(
        { success: false, error: 'Order or shipments not found' },
        { status: 404 }
      );
    }

    if (info.trackings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tracking number available for the selected shipments',
        },
        { status: 422 }
      );
    }

    const html = buildTrackingEmailHtml({
      customerName: info.customerName,
      orderNumber: info.orderNumber,
      trackings: info.trackings.map(t => ({
        trackingNumber: t.trackingNumber,
        trackingUrl: t.trackingUrl,
        carrierName: t.carrierName,
        shippedAt: t.shippedAt,
      })),
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
          shipment_ids: info.trackings.map(t => t.shipmentId),
          tracking_numbers: info.trackings.map(t => t.trackingNumber),
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

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      shipmentsCount: info.trackings.length,
    });
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

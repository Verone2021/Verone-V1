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

import { getPacklinkClient } from '@verone/common/lib/packlink/client';
import type { Database } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import {
  buildTrackingEmailHtml,
  type TrackingInfo,
} from '../_shared/shipping-tracking-template';

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

// ── Order + Shipment fetch ────────────────────────────────────────────

interface OrderTrackingsInfo {
  customerName: string;
  orderNumber: string;
  trackings: Array<TrackingInfo & { shipmentId: string }>;
}

interface RawShipment {
  id: string;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  shipped_at: string | null;
  packlink_shipment_id: string | null;
}

/**
 * Récupère depuis Packlink la date de prise en charge réelle + l'URL
 * de tracking si elle manque, et persiste les valeurs en DB.
 *
 * Stratégie :
 *  1. Si `tracking_url` manquant → GET /shipments/{ref} pour le récupérer
 *  2. GET /shipments/{ref}/tracking → premier event = pickup carrier réel.
 *     On utilise ce timestamp comme date d'expédition.
 *  3. Si aucun event encore (colis créé mais pas encore pris en charge)
 *     → fallback sur la date du jour (pas la date de création du wizard
 *     qui était trompeuse pour le client).
 */
async function enrichFromPacklink(
  supabase: ReturnType<typeof getAdminClient>,
  shipment: RawShipment
): Promise<{ trackingUrl: string | null; shippedAt: string }> {
  if (!shipment.packlink_shipment_id) {
    return {
      trackingUrl: shipment.tracking_url,
      shippedAt: shipment.shipped_at ?? new Date().toISOString(),
    };
  }

  const client = getPacklinkClient();
  const updates: Record<string, unknown> = {};
  let trackingUrl = shipment.tracking_url;
  let pickupAt: string | null = null;

  // 1. Récupérer tracking_url si manquant
  if (!shipment.tracking_url) {
    try {
      const details = await client.getShipment(shipment.packlink_shipment_id);
      if (details.tracking_url) {
        trackingUrl = details.tracking_url;
        updates.tracking_url = details.tracking_url;
      }
    } catch (err) {
      console.error(
        '[send-shipping-tracking] Packlink getShipment failed for',
        shipment.packlink_shipment_id,
        err
      );
    }
  }

  // 2. Récupérer la date réelle de prise en charge via les events
  try {
    const events = await client.getTracking(shipment.packlink_shipment_id);
    if (events.length > 0) {
      const sorted = [...events].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      pickupAt = sorted[0].timestamp;
      updates.shipped_at = pickupAt;
    }
  } catch (err) {
    console.error(
      '[send-shipping-tracking] Packlink getTracking failed for',
      shipment.packlink_shipment_id,
      err
    );
  }

  // 3. Fallback : date du jour (pas date de création du wizard)
  const shippedAt = pickupAt ?? new Date().toISOString();

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    await supabase
      .from('sales_order_shipments')
      .update(updates)
      .eq('id', shipment.id);
  }

  return { trackingUrl, shippedAt };
}

async function fetchShipmentsInfo(
  supabase: ReturnType<typeof getAdminClient>,
  salesOrderId: string,
  shipmentIds: string[]
): Promise<OrderTrackingsInfo | null> {
  const [orderResult, shipmentsResult] = await Promise.all([
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
      .select(
        'id, tracking_number, tracking_url, carrier_name, shipped_at, packlink_shipment_id'
      )
      .eq('sales_order_id', salesOrderId)
      .in('id', shipmentIds)
      .order('shipped_at', { ascending: true }),
  ]);

  if (orderResult.error || !orderResult.data) return null;
  if (shipmentsResult.error || !shipmentsResult.data) return null;

  const order = orderResult.data;

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

  // Filtre les shipments sans tracking_number (envoi tracking inutile).
  const validShipments = shipmentsResult.data.filter(s =>
    Boolean(s.tracking_number)
  ) as RawShipment[];

  // Enrichissement Packlink en parallèle (récupère date pickup + URL)
  const enriched = await Promise.all(
    validShipments.map(async s => {
      const { trackingUrl, shippedAt } = await enrichFromPacklink(supabase, s);
      return {
        shipmentId: s.id,
        trackingNumber: s.tracking_number as string,
        trackingUrl,
        carrierName: s.carrier_name,
        shippedAt,
      };
    })
  );

  return {
    customerName,
    orderNumber: order.order_number,
    trackings: enriched,
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

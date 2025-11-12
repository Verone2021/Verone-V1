/**
 * Packlink Webhooks Handler
 * POST /api/webhooks/packlink
 * Receives Packlink webhook events and updates shipments
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import type { PacklinkWebhookEvent } from '@/lib/packlink/types';

// Service role client (bypasses RLS for webhooks)
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload: PacklinkWebhookEvent = await request.json();

    console.log(`[Packlink Webhook] Received event: ${payload.name}`, {
      shipment_ref: payload.data.shipment_reference,
      timestamp: payload.created_at,
    });

    // Find shipment by packlink_shipment_id
    const { data: shipment, error: findError } = await supabaseServiceRole
      .from('shipments')
      .select('id, sales_order_id')
      .eq('packlink_shipment_id', payload.data.shipment_reference)
      .single();

    if (findError || !shipment) {
      console.warn(
        `[Packlink Webhook] Shipment not found: ${payload.data.shipment_reference}`
      );
      // Return 200 to avoid webhook retry
      return NextResponse.json({
        received: true,
        warning: 'Shipment not found',
      });
    }

    // Insert tracking event
    await supabaseServiceRole.from('shipment_tracking_events').insert({
      shipment_id: shipment.id,
      event_name: payload.name,
      event_timestamp: new Date(payload.created_at),
      city: payload.data.city || null,
      description: payload.data.status || payload.name,
      raw_payload: payload as unknown as Record<string, unknown>,
    });

    // Handle specific events
    switch (payload.name) {
      case 'shipment.label.ready':
        await handleLabelReady(shipment.id, payload);
        break;

      case 'shipment.tracking.update':
        await handleTrackingUpdate(shipment.id, payload);
        break;

      case 'shipment.delivered':
        await handleDelivered(shipment.id, payload);
        break;

      case 'shipment.carrier.success':
        await handleCarrierSuccess(shipment.id, payload);
        break;

      case 'shipment.carrier.fail':
      case 'shipment.label.fail':
        await handleFailure(shipment.id, payload);
        break;

      default:
        console.log(`[Packlink Webhook] Unhandled event: ${payload.name}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Packlink Webhook] Error processing webhook:', error);

    // Always return 200 to prevent Packlink retry loop
    return NextResponse.json(
      { received: true, error: 'Processing failed' },
      { status: 200 }
    );
  }
}

/**
 * Handler: Label ready
 */
async function handleLabelReady(
  shipmentId: string,
  payload: PacklinkWebhookEvent
) {
  const labelUrl = payload.data.label_url || payload.data.packlink_label_url;

  await supabaseServiceRole
    .from('shipments')
    .update({
      status: 'READY_FOR_SHIPPING',
      packlink_label_url: labelUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shipmentId);

  console.log(`[Packlink Webhook] Label ready for shipment ${shipmentId}`);
}

/**
 * Handler: Tracking update
 */
async function handleTrackingUpdate(
  shipmentId: string,
  payload: PacklinkWebhookEvent
) {
  const statusMapping: Record<string, string> = {
    TRACKING: 'TRACKING',
    IN_TRANSIT: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    INCIDENT: 'INCIDENT',
    RETURNED_TO_SENDER: 'RETURNED_TO_SENDER',
  };

  const newStatus = payload.data.status
    ? statusMapping[payload.data.status] || 'TRACKING'
    : 'TRACKING';

  await supabaseServiceRole
    .from('shipments')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shipmentId);

  console.log(
    `[Packlink Webhook] Tracking update for shipment ${shipmentId}: ${newStatus}`
  );
}

/**
 * Handler: Delivered
 */
async function handleDelivered(
  shipmentId: string,
  payload: PacklinkWebhookEvent
) {
  await supabaseServiceRole
    .from('shipments')
    .update({
      status: 'DELIVERED',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', shipmentId);

  console.log(`[Packlink Webhook] Shipment delivered: ${shipmentId}`);

  // TODO: Send email notification to customer
  // await sendDeliveryNotification(shipmentId);
}

/**
 * Handler: Carrier success
 */
async function handleCarrierSuccess(
  shipmentId: string,
  payload: PacklinkWebhookEvent
) {
  await supabaseServiceRole
    .from('shipments')
    .update({
      status: 'PROCESSING',
      updated_at: new Date().toISOString(),
    })
    .eq('id', shipmentId);

  console.log(`[Packlink Webhook] Carrier registered shipment ${shipmentId}`);
}

/**
 * Handler: Failure events
 */
async function handleFailure(
  shipmentId: string,
  payload: PacklinkWebhookEvent
) {
  await supabaseServiceRole
    .from('shipments')
    .update({
      status: 'INCIDENT',
      updated_at: new Date().toISOString(),
      notes: `Packlink error: ${payload.data.error_message || 'Unknown error'}`,
    })
    .eq('id', shipmentId);

  console.error(
    `[Packlink Webhook] Failure for shipment ${shipmentId}:`,
    payload.data
  );

  // TODO: Send alert notification to admin
}

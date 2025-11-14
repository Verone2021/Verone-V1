/**
 * PackLink Webhook Handler
 * POST /api/webhooks/packlink
 *
 * Receives PackLink webhook events for tracking updates, delivery, etc.
 * Documentation: https://github.com/wout/packlink.cr
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@verone/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    console.log('[PackLink Webhook] 📥 Event received:', {
      event: body.event || body.name,
      shipment_ref: body.shipment_reference || body.data?.shipment_reference,
    });

    // Extract event name (format peut varier)
    const eventName = body.event || body.name || '';
    const eventData = body.data || body;

    // Extract shipment reference
    const shipmentRef = eventData.shipment_reference || body.shipment_reference;

    if (!shipmentRef) {
      console.error('[PackLink Webhook] ⚠️ No shipment_reference in payload');
      return NextResponse.json(
        { error: 'Missing shipment_reference' },
        { status: 400 }
      );
    }

    // Événement : Tracking disponible ou paiement confirmé
    if (
      eventName.includes('tracking') ||
      eventName.includes('paid') ||
      eventName.includes('ready')
    ) {
      const trackingCode = eventData.tracking_code || eventData.tracking_number;
      const carrier = eventData.carrier?.name || eventData.carrier;

      if (trackingCode) {
        await supabase
          .from('shipments')
          .update({
            tracking_number: trackingCode,
            tracking_url: `https://track.packlink.com/${trackingCode}`,
            carrier_name: carrier || 'Packlink',
            status: 'READY',
          })
          .eq('packlink_shipment_id', shipmentRef);

        console.log(
          `[PackLink Webhook] ✅ Tracking ${trackingCode} mis à jour (${carrier})`
        );
      } else {
        console.warn('[PackLink Webhook] ⚠️ No tracking_code in payload');
      }
    }

    // Événement : En transit
    if (eventName.includes('transit') || eventName.includes('collected')) {
      await supabase
        .from('shipments')
        .update({ status: 'IN_TRANSIT' } as any)
        .eq('packlink_shipment_id', shipmentRef);

      console.log('[PackLink Webhook] ✅ Shipment en transit');
    }

    // Événement : En livraison
    if (eventName.includes('delivery') && !eventName.includes('delivered')) {
      await supabase
        .from('shipments')
        .update({ status: 'OUT_FOR_DELIVERY' } as any)
        .eq('packlink_shipment_id', shipmentRef);

      console.log('[PackLink Webhook] ✅ Shipment en livraison');
    }

    // Événement : Livraison confirmée
    if (eventName.includes('delivered')) {
      await supabase
        .from('shipments')
        .update({
          delivered_at: new Date().toISOString(),
          metadata: {
            ...eventData,
            status: 'DELIVERED',
            webhook_event: eventName,
          },
        } as any)
        .eq('packlink_shipment_id', shipmentRef);

      console.log('[PackLink Webhook] ✅ Shipment livré');
    }

    // Événement : Incident
    if (eventName.includes('incident') || eventName.includes('exception')) {
      await supabase
        .from('shipments')
        .update({
          metadata: {
            ...eventData,
            status: 'INCIDENT',
            webhook_event: eventName,
          },
        } as any)
        .eq('packlink_shipment_id', shipmentRef);

      console.log('[PackLink Webhook] ⚠️ Incident signalé');
    }

    return NextResponse.json({ success: true, event: eventName });
  } catch (error) {
    console.error('[PackLink Webhook] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

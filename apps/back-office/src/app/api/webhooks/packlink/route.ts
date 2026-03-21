/**
 * Webhook: Packlink shipment status updates
 * POST /api/webhooks/packlink
 *
 * Events:
 * - shipment.carrier.success: registered with carrier
 * - shipment.label.ready: labels available for download
 * - shipment.tracking.update: tracking status changed (in_transit, out_for_delivery)
 * - shipment.delivered: shipment delivered
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event: string;
      shipment_reference: string;
      data?: Record<string, unknown>;
    };

    const { event, shipment_reference: reference } = body;

    if (!event || !reference) {
      return NextResponse.json(
        { error: 'Missing event or reference' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ received: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.warn(`[Packlink Webhook] ${event}: ${reference}`);

    switch (event) {
      case 'shipment.label.ready': {
        // Fetch label URL from Packlink
        const apiKey = process.env.PACKLINK_API_KEY;
        if (apiKey) {
          const baseUrl =
            process.env.NODE_ENV === 'production'
              ? 'https://api.packlink.com/v1'
              : 'https://apisandbox.packlink.com/v1';

          const labelRes = await fetch(
            `${baseUrl}/shipments/${reference}/labels`,
            { headers: { Authorization: apiKey } }
          );

          if (labelRes.ok) {
            const labels = (await labelRes.json()) as string[];
            if (labels.length > 0) {
              await supabase
                .from('sales_order_shipments')
                .update({
                  packlink_label_url: labels[0],
                  label_url: labels[0],
                  updated_at: new Date().toISOString(),
                })
                .eq('packlink_shipment_id', reference);
            }
          }
        }
        break;
      }

      case 'shipment.tracking.update': {
        // Update tracking info
        const trackingData = body.data as
          | {
              tracking_code?: string;
              tracking_url?: string;
              status?: string;
            }
          | undefined;

        if (trackingData) {
          const updateFields: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (trackingData.tracking_code) {
            updateFields.tracking_number = trackingData.tracking_code;
          }
          if (trackingData.tracking_url) {
            updateFields.tracking_url = trackingData.tracking_url;
          }

          await supabase
            .from('sales_order_shipments')
            .update(updateFields)
            .eq('packlink_shipment_id', reference);
        }
        break;
      }

      case 'shipment.delivered': {
        // Find the sales_order via shipment and update status to delivered
        const { data: shipment } = await supabase
          .from('sales_order_shipments')
          .select('sales_order_id')
          .eq('packlink_shipment_id', reference)
          .limit(1)
          .single();

        if (shipment) {
          await supabase
            .from('sales_orders')
            .update({
              status: 'delivered',
              delivered_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', String(shipment.sales_order_id))
            .in('status', ['shipped', 'partially_shipped']);

          console.warn(
            '[Packlink Webhook] Order delivered:',
            shipment.sales_order_id
          );
        }
        break;
      }

      default:
        console.warn('[Packlink Webhook] Unhandled event:', event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Packlink Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

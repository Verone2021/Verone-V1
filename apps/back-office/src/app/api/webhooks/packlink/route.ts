/**
 * Webhook: Packlink shipment status updates
 * POST /api/webhooks/packlink
 *
 * Events:
 * - shipment.carrier.success: registered with carrier (tracking number assigned)
 * - shipment.carrier.fail: carrier registration failed
 * - shipment.label.ready: labels available for download
 * - shipment.label.fail: label generation failed
 * - shipment.tracking.update: tracking status changed (in_transit, out_for_delivery)
 * - shipment.delivered: shipment delivered
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

export async function POST(request: Request) {
  try {
    // Sécurité : vérifier le secret webhook si configuré
    // Configurer PACKLINK_WEBHOOK_SECRET dans .env pour activer
    const webhookSecret = process.env.PACKLINK_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader =
        request.headers.get('x-packlink-secret') ??
        request.headers.get('authorization');
      if (authHeader !== webhookSecret) {
        console.error('[Packlink Webhook] Invalid secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

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
    const client = getPacklinkClient();

    console.warn(`[Packlink Webhook] ${event}: ${reference}`);

    switch (event) {
      case 'shipment.carrier.success': {
        // Carrier accepted the shipment — fetch tracking details from Packlink
        try {
          const detailsRaw = await client.getShipment(reference);
          // The Packlink GET /shipments/{ref} response exposes the real tracking
          // number under packages[0].carrier_tracking_number, not at top-level
          // tracking_code as the legacy code assumed.
          const details = detailsRaw as unknown as {
            packages?: Array<{ carrier_tracking_number?: string }>;
            tracking_url?: string;
            carrier?: string;
            state?: string;
          };
          const trackingNumber =
            details.packages?.[0]?.carrier_tracking_number ?? null;

          // packlink_status: a_payer → paye
          // Ce changement déclenche le trigger confirm_packlink_shipment_stock()
          // qui décrémente le stock et met à jour le statut commande
          const updateFields: Record<string, unknown> = {
            packlink_status: 'paye',
            updated_at: new Date().toISOString(),
          };

          if (trackingNumber) {
            updateFields.tracking_number = trackingNumber;
          }
          if (details.tracking_url) {
            updateFields.tracking_url = details.tracking_url;
          }

          await supabase
            .from('sales_order_shipments')
            .update(updateFields)
            .eq('packlink_shipment_id', reference);

          console.warn(
            '[Packlink Webhook] Transport payé par Verone, stock décrémenté:',
            reference
          );

          // Envoyer email tracking au client
          // Récupérer l'email client depuis la commande
          try {
            const { data: shipRow } = await supabase
              .from('sales_order_shipments')
              .select('sales_order_id')
              .eq('packlink_shipment_id', reference)
              .limit(1)
              .single();

            if (shipRow) {
              const { data: so } = await supabase
                .from('sales_orders')
                .select(
                  `order_number, individual_customer_id,
                   individual_customers(email, first_name, last_name),
                   organisations(email, trade_name)`
                )
                .eq('id', shipRow.sales_order_id)
                .single();

              const soData = so as Record<string, unknown> | null;
              const indiv = soData?.individual_customers as {
                email: string | null;
                first_name: string;
                last_name: string;
              } | null;
              const org = soData?.organisations as {
                email: string | null;
                trade_name: string;
              } | null;

              const customerEmail = indiv?.email ?? org?.email;
              const customerName = indiv
                ? `${indiv.first_name} ${indiv.last_name}`
                : (org?.trade_name ?? 'Client');

              if (customerEmail) {
                // Appeler le endpoint email shipping-notification du site-internet
                // Note: en production, utiliser l'URL Vercel du site-internet
                const siteUrl =
                  process.env.SITE_INTERNET_URL ??
                  'https://www.veronecollections.fr';

                await fetch(`${siteUrl}/api/emails/shipping-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: customerEmail,
                    customerName,
                    orderId:
                      (soData?.order_number as string) ??
                      shipRow.sales_order_id,
                    trackingNumber: trackingNumber ?? undefined,
                    carrierName: details.carrier,
                  }),
                }).catch(emailErr => {
                  console.error(
                    '[Packlink Webhook] Email notification failed:',
                    emailErr
                  );
                });

                console.warn(
                  '[Packlink Webhook] Tracking email sent to:',
                  customerEmail
                );
              }
            }
          } catch (emailErr) {
            console.error('[Packlink Webhook] Email lookup failed:', emailErr);
          }
        } catch (err) {
          console.error(
            '[Packlink Webhook] Failed to fetch shipment details:',
            err
          );
        }
        break;
      }

      case 'shipment.carrier.fail': {
        // Transporteur a rejeté l'expédition — marquer comme incident
        await supabase
          .from('sales_order_shipments')
          .update({
            packlink_status: 'incident',
            updated_at: new Date().toISOString(),
          })
          .eq('packlink_shipment_id', reference);

        console.error(
          '[Packlink Webhook] CARRIER FAIL — packlink_status → incident:',
          reference,
          body.data
        );
        break;
      }

      case 'shipment.label.ready': {
        // Fetch label URLs from Packlink
        try {
          const labels = await client.getLabels(reference);
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
        } catch (err) {
          console.error('[Packlink Webhook] Failed to fetch labels:', err);
        }
        break;
      }

      case 'shipment.label.fail': {
        // Label generation failed — log for manual action
        console.error('[Packlink Webhook] LABEL FAIL:', reference, body.data);
        break;
      }

      case 'shipment.tracking.update': {
        // Update tracking info from webhook data
        const trackingData = body.data as
          | {
              tracking_code?: string;
              tracking_url?: string;
              status?: string;
            }
          | undefined;

        if (trackingData) {
          const updateFields: Record<string, unknown> = {
            packlink_status: 'in_transit',
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
        // Update packlink_status + mark sales order as delivered
        await supabase
          .from('sales_order_shipments')
          .update({
            packlink_status: 'delivered',
            updated_at: new Date().toISOString(),
          })
          .eq('packlink_shipment_id', reference);

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

/**
 * Shared data layer for shipping-tracking email routes (send + preview).
 *
 * Centralise :
 *  - Enrichissement Packlink (récup tracking_url + date pickup réelle,
 *    persistance en DB)
 *  - Fetch order + shipments + customer name
 *
 * Utilisé par :
 *  - POST /api/emails/send-shipping-tracking (envoi réel via Resend)
 *  - POST /api/emails/preview-shipping-tracking (génère le HTML pour
 *    l'aperçu côté UI ; pas d'envoi)
 */

import { createClient } from '@supabase/supabase-js';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';
import type { Database } from '@verone/types';

import type { TrackingInfo } from './shipping-tracking-template';

export interface OrderTrackingsInfo {
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

export function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Récupère depuis Packlink la date de prise en charge réelle + l'URL de
 * tracking si elle manque, et persiste les valeurs en DB.
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

  if (!shipment.tracking_url) {
    try {
      const details = await client.getShipment(shipment.packlink_shipment_id);
      if (details.tracking_url) {
        trackingUrl = details.tracking_url;
        updates.tracking_url = details.tracking_url;
      }
    } catch (err) {
      console.error(
        '[shipping-tracking-data] Packlink getShipment failed for',
        shipment.packlink_shipment_id,
        err
      );
    }
  }

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
      '[shipping-tracking-data] Packlink getTracking failed for',
      shipment.packlink_shipment_id,
      err
    );
  }

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

export async function fetchShipmentsInfo(
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

  const validShipments = shipmentsResult.data.filter(s =>
    Boolean(s.tracking_number)
  ) as RawShipment[];

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

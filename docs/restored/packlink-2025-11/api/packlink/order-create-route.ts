/**
 * API Route: Create Packlink Order (Paiement + PDF)
 * POST /api/packlink/order/create
 *
 * Finalise un draft Packlink : paiement → récupération PDF label
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { shipment_id } = body;

    if (!shipment_id) {
      return NextResponse.json(
        { error: true, code: 400, message: 'shipment_id est obligatoire' },
        { status: 400 }
      );
    }

    // 2. Récupérer shipment depuis notre DB
    const supabase = await createServerClient();

    const { data: shipment, error: dbError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipment_id)
      .single();

    if (dbError || !shipment) {
      return NextResponse.json(
        { error: true, code: 404, message: 'Shipment non trouvé' },
        { status: 404 }
      );
    }

    const metadata = shipment.metadata as Record<string, any>;

    // 3. Créer order Packlink (paiement)
    const { getPacklinkClient } = await import('@/lib/packlink/client');
    const packlinkClient = getPacklinkClient();

    const orderResponse = await packlinkClient.createOrder({
      order_custom_reference: `VERONE-${shipment.id.slice(0, 8)}`,
      shipments: [
        {
          from: metadata.from,
          to: metadata.to,
          packages: metadata.packages,
          service_id: shipment.packlink_service_id,
          content: metadata.content || 'Produits',
          contentvalue: metadata.content_value || 0,
          shipment_custom_reference:
            metadata.shipment_custom_reference ||
            `SHIP-${shipment.id.slice(0, 8)}`,
          ...(metadata.dropoff_point_id && {
            dropoff_point_id: metadata.dropoff_point_id,
          }),
          ...(metadata.customs && { customs: metadata.customs }),
        },
      ],
    });

    const shipmentLine = orderResponse.shipments[0];
    const shipmentReference = shipmentLine.shipment_reference;

    // 4. Récupérer PDF label
    let labelUrl: string | null = null;

    try {
      const labels = await packlinkClient.getLabels(shipmentReference);
      if (labels && labels.length > 0) {
        labelUrl = labels[0].url;
      }
    } catch (error) {
      console.warn('[API] Failed to fetch label:', error);
    }

    // 5. Récupérer tracking details
    let trackingNumber: string | null = null;
    let carrierName: string | null = null;
    let serviceName: string | null = null;

    try {
      const shipmentDetails =
        await packlinkClient.getShipment(shipmentReference);
      trackingNumber = shipmentDetails.tracking_code || null;
      carrierName = shipmentDetails.carrier;
      serviceName = shipmentDetails.service_name;
    } catch (error) {
      console.warn('[API] Failed to fetch shipment details:', error);
    }

    // 6. Mettre à jour notre DB
    const { data: updatedShipment, error: updateError } = await supabase
      .from('shipments')
      .update({
        packlink_shipment_id: shipmentReference,
        packlink_label_url: labelUrl,
        tracking_number: trackingNumber,
        carrier_name: carrierName,
        service_name: serviceName,
        cost_paid_eur: shipmentLine.total_price,
        shipped_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          status: 'PAID',
          order_reference: orderResponse.order_reference,
          shipment_reference: shipmentReference,
        },
      })
      .eq('id', shipment_id)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Failed to update shipment:', updateError);
      return NextResponse.json(
        {
          error: true,
          code: 500,
          message: 'Order créé mais erreur mise à jour DB',
          details: [
            {
              field: 'database',
              type: 'update_error',
              message: updateError.message,
            },
          ],
        },
        { status: 500 }
      );
    }

    // 7. Retour succès
    return NextResponse.json({
      success: true,
      order: {
        id: updatedShipment.id,
        packlink_order_reference: orderResponse.order_reference,
        packlink_shipment_reference: shipmentReference,
        tracking_number: trackingNumber,
        carrier_name: carrierName,
        service_name: serviceName,
        label_url: labelUrl,
        total_price: shipmentLine.total_price,
        shipped_at: updatedShipment.shipped_at,
      },
    });
  } catch (error) {
    console.error('[API] Create order error:', error);

    // Gestion erreurs Packlink
    const { PacklinkError } = await import('@/lib/packlink/errors');
    if (error instanceof PacklinkError) {
      return NextResponse.json(
        {
          error: true,
          code: error.statusCode || 500,
          message: error.message,
          details: error.response?.errors,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: true, code: 500, message: 'Erreur création order' },
      { status: 500 }
    );
  }
}

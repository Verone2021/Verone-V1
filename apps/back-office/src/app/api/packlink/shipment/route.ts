/**
 * API Route: Create Packlink Shipment
 * POST /api/packlink/shipment
 *
 * Creates a shipment on Packlink PRO.
 * The admin then pays on Packlink PRO website.
 * After payment, webhook updates our DB with tracking + label.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import {
  getPacklinkClient,
  VERONE_SOURCE_ADDRESS,
} from '@verone/common/lib/packlink/client';

const CreateShipmentSchema = z.object({
  serviceId: z.number(),
  // Display names from GET /services — required by /v1/shipments to land
  // the shipment in "Prêts pour le paiement" instead of "AWAITING_COMPLETION".
  serviceName: z.string().min(1),
  carrierName: z.string().min(1),
  destination: z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    street1: z.string().min(1),
    city: z.string().min(1),
    zip_code: z.string().min(1),
    country: z.string().default('FR'),
  }),
  packages: z
    .array(
      z.object({
        weight: z.number().min(0.1),
        width: z.number().min(1),
        height: z.number().min(1),
        length: z.number().min(1),
      })
    )
    .min(1),
  content: z.string().default('Produits decoration et mobilier'),
  contentValue: z.number().min(0).default(0),
  contentSecondHand: z.boolean().optional(),
  orderReference: z.string().min(1),
  dropoffPointId: z.string().optional(),
  collectionDate: z.string().optional(),
  collectionTime: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validated = CreateShipmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const {
      serviceId,
      serviceName,
      carrierName,
      destination,
      packages: pkgs,
      content,
      contentValue,
      contentSecondHand,
      orderReference,
      dropoffPointId,
      collectionDate,
      collectionTime,
    } = validated.data;

    const client = getPacklinkClient();

    const shipment = await client.createShipment({
      from: VERONE_SOURCE_ADDRESS,
      to: {
        ...destination,
        company: undefined,
      },
      packages: pkgs,
      service_id: serviceId,
      service_name: serviceName,
      carrier_name: carrierName,
      content,
      contentvalue: contentValue,
      content_second_hand: contentSecondHand ?? false,
      shipment_custom_reference: orderReference.slice(0, 50),
      source: 'verone-backoffice',
      dropoff_point_id: dropoffPointId,
      collection_date: collectionDate,
      collection_time: collectionTime,
    });

    return NextResponse.json({
      success: true,
      shipmentReference: shipment.reference,
    });
  } catch (error) {
    console.error('[Packlink Shipment] Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur creation expedition Packlink';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

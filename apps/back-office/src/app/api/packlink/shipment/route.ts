/**
 * API Route: Create Packlink Shipment
 * POST /api/packlink/shipment
 *
 * Creates a shipment via POST /v1/shipments with enriched additional_data
 * (warehouse + postal zone IDs) so it lands in READY_TO_PURCHASE on Packlink PRO.
 * Insurance is explicitly set to 0 / insurance_selected=false.
 * The user pays from the Packlink PRO web interface.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import {
  getPacklinkClient,
  VERONE_SOURCE_ADDRESS,
} from '@verone/common/lib/packlink/client';

const CreateShipmentSchema = z.object({
  serviceId: z.number(),
  serviceName: z.string().optional(),
  carrierName: z.string().optional(),
  destination: z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    // Champ facultatif Packlink (to.company) — utile pour Verone B2B
    // (commandes pour des enseignes type Pokawa). Quand renseigne, il
    // apparait sur l'etiquette de transport.
    company: z.string().optional(),
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
      orderReference,
      dropoffPointId,
      collectionDate,
      collectionTime,
    } = validated.data;

    const client = getPacklinkClient();

    const shipment = await client.createShipment({
      from: VERONE_SOURCE_ADDRESS,
      to: destination,
      packages: pkgs,
      service_id: serviceId,
      service_name: serviceName,
      carrier_name: carrierName,
      content,
      // Packlink rejects contentvalue=0 — use declared value or minimum 1
      contentvalue: contentValue > 0 ? contentValue : 1,
      source: 'PRO',
      shipment_custom_reference: orderReference.slice(0, 50),
      ...(dropoffPointId ? { dropoff_point_id: dropoffPointId } : {}),
      ...(collectionDate ? { collection_date: collectionDate } : {}),
      ...(collectionTime ? { collection_time: collectionTime } : {}),
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

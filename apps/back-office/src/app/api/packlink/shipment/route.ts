/**
 * API Route: Create Packlink Draft Shipment
 * POST /api/packlink/shipment
 *
 * Creates a brouillon on Packlink PRO via POST /v1/drafts.
 * No auto-insurance: the user pays from the Packlink PRO web interface
 * and chooses insurance there if desired.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import {
  getPacklinkClient,
  VERONE_SOURCE_ADDRESS,
} from '@verone/common/lib/packlink/client';

const CreateDraftSchema = z.object({
  serviceId: z.number(),
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
  orderReference: z.string().min(1),
  dropoffPointId: z.string().optional(),
  collectionDate: z.string().optional(),
  collectionTime: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validated = CreateDraftSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const {
      serviceId,
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

    const draft = await client.createDraft({
      from: VERONE_SOURCE_ADDRESS,
      to: {
        ...destination,
        company: undefined,
      },
      packages: pkgs,
      service_id: serviceId,
      content,
      contentvalue: contentValue,
      shipment_custom_reference: orderReference.slice(0, 50),
      ...(dropoffPointId ? { dropoff_point_id: dropoffPointId } : {}),
      ...(collectionDate ? { collection_date: collectionDate } : {}),
      ...(collectionTime ? { collection_time: collectionTime } : {}),
    });

    return NextResponse.json({
      success: true,
      shipmentReference: draft.shipment_reference,
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

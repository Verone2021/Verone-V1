/**
 * API Route: Create Packlink Shipment
 * POST /api/packlink/shipment
 *
 * Creates a shipment on Packlink, retrieves label and tracking info.
 * Called after admin selects a Packlink service in the shipment form.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

const PACKLINK_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.packlink.com/v1'
    : 'https://apisandbox.packlink.com/v1';

const SOURCE_ADDRESS = {
  name: 'Verone',
  surname: 'Collections',
  email: 'contact@veronecollections.fr',
  phone: '+33600000000',
  street1: '4 rue du Perou',
  city: 'Massy',
  zip_code: '91300',
  country: 'FR',
  company: 'Verone',
};

const CreateShipmentSchema = z.object({
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

    const apiKey = process.env.PACKLINK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PACKLINK_API_KEY non configuree' },
        { status: 500 }
      );
    }

    const {
      serviceId,
      destination,
      packages: pkgs,
      content,
      contentValue,
      orderReference,
    } = validated.data;

    // Step 1: Create shipment on Packlink
    const shipmentPayload = {
      from: SOURCE_ADDRESS,
      to: destination,
      packages: pkgs,
      service_id: serviceId,
      content,
      contentvalue: contentValue,
      shipment_custom_reference: orderReference,
      source: 'verone-backoffice',
    };

    const createResponse = await fetch(`${PACKLINK_BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentPayload),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(
        '[Packlink] Shipment creation failed:',
        createResponse.status,
        errorText
      );
      return NextResponse.json(
        {
          error: `Packlink erreur ${createResponse.status}`,
          details: errorText,
        },
        { status: 502 }
      );
    }

    const shipmentResult = (await createResponse.json()) as {
      reference: string;
      tracking_url?: string;
    };
    const shipmentReference = shipmentResult.reference;

    // Step 2: Try to get label URL
    let labelUrl: string | null = null;
    try {
      const labelResponse = await fetch(
        `${PACKLINK_BASE_URL}/shipments/${shipmentReference}/labels`,
        { headers: { Authorization: apiKey } }
      );
      if (labelResponse.ok) {
        const labels = (await labelResponse.json()) as string[];
        if (labels.length > 0) {
          labelUrl = labels[0] ?? null;
        }
      }
    } catch {
      console.warn('[Packlink] Labels not yet available');
    }

    // Step 3: Get shipment details (tracking, carrier)
    let trackingNumber: string | null = null;
    let carrierName: string | null = null;
    let serviceName: string | null = null;

    try {
      const detailResponse = await fetch(
        `${PACKLINK_BASE_URL}/shipments/${shipmentReference}`,
        { headers: { Authorization: apiKey } }
      );
      if (detailResponse.ok) {
        const details = (await detailResponse.json()) as {
          tracking_code?: string;
          carrier?: string;
          service_name?: string;
        };
        trackingNumber = details.tracking_code ?? null;
        carrierName = details.carrier ?? null;
        serviceName = details.service_name ?? null;
      }
    } catch {
      console.warn('[Packlink] Shipment details not yet available');
    }

    return NextResponse.json({
      success: true,
      shipmentReference,
      trackingNumber,
      trackingUrl: shipmentResult.tracking_url ?? null,
      labelUrl,
      carrierName,
      serviceName,
    });
  } catch (error) {
    console.error('[Packlink Shipment] Error:', error);
    return NextResponse.json(
      { error: 'Erreur creation expedition Packlink' },
      { status: 500 }
    );
  }
}

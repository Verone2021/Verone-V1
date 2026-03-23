/**
 * API Route: Get or Delete a Packlink Shipment
 * GET /api/packlink/shipment/[ref] — Get shipment details + status
 * DELETE /api/packlink/shipment/[ref] — Delete a draft shipment
 */

import { NextResponse } from 'next/server';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;

    if (!ref) {
      return NextResponse.json(
        { error: 'Reference manquante' },
        { status: 400 }
      );
    }

    const client = getPacklinkClient();
    const shipment = await client.getShipment(ref);

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error('[Packlink Shipment GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    const status = message.includes('404') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;

    if (!ref) {
      return NextResponse.json(
        { error: 'Reference manquante' },
        { status: 400 }
      );
    }

    const client = getPacklinkClient();
    await client.deleteShipment(ref);

    return NextResponse.json({ success: true, deleted: ref });
  } catch (error) {
    console.error('[Packlink Shipment DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    const status = message.includes('404') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

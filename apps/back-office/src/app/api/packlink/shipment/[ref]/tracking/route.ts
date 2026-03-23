/**
 * API Route: Get Packlink Shipment Tracking
 * GET /api/packlink/shipment/[ref]/tracking — Returns tracking history
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
    const tracking = await client.getTracking(ref);

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('[Packlink Tracking] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    const status = message.includes('404') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * API Route: Get Packlink Shipment Labels
 * GET /api/packlink/shipment/[ref]/labels — Returns PDF label URLs
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
    const labels = await client.getLabels(ref);

    return NextResponse.json({ labels });
  } catch (error) {
    console.error('[Packlink Labels] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    const status = message.includes('404') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

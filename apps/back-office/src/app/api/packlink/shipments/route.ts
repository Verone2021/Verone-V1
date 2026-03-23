/**
 * API Route: List Packlink Shipments
 * GET /api/packlink/shipments?status=IN_TRANSIT&offset=0&limit=20
 *
 * Statuses: DRAFT, PENDING, READY_TO_PURCHASE, PROCESSING, READY_FOR_SHIPPING,
 *           TRACKING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, INCIDENT,
 *           RETURNED_TO_SENDER, ARCHIVED
 */

import { NextResponse } from 'next/server';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const offset = searchParams.get('offset');
    const limit = searchParams.get('limit');

    const client = getPacklinkClient();
    const shipments = await client.listShipments({
      status,
      offset: offset ? Number(offset) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error('[Packlink Shipments] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

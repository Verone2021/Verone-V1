/**
 * API Route: Get Packlink Dropoff Points
 * GET /api/packlink/dropoffs?service_id=123&country=FR&zip=75008
 *
 * Returns available pickup/dropoff points for a given service and location.
 */

import { NextResponse } from 'next/server';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const country = searchParams.get('country');
    const zip = searchParams.get('zip');

    if (!serviceId || !country || !zip) {
      return NextResponse.json(
        { error: 'Missing required params: service_id, country, zip' },
        { status: 400 }
      );
    }

    const client = getPacklinkClient();
    const dropoffs = await client.getDropoffs({
      serviceId: Number(serviceId),
      country,
      zip,
    });

    return NextResponse.json({ dropoffs });
  } catch (error) {
    console.error('[Packlink Dropoffs] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

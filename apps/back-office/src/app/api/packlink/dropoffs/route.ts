import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPacklinkClient } from '@/lib/packlink';

/**
 * GET /api/packlink/dropoffs
 *
 * Récupère les points de dépôt/retrait (relais, lockers) PackLink
 *
 * Query params:
 * - service_id: ID du service PackLink (requis)
 * - country: Code pays ISO (requis, ex: FR)
 * - zip: Code postal (requis)
 *
 * @example
 * GET /api/packlink/dropoffs?service_id=21369&country=FR&zip=75001
 *
 * @returns {
 *   success: boolean,
 *   dropoffs: PacklinkDropoff[],
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const service_id = searchParams.get('service_id');
    const country = searchParams.get('country');
    const zip = searchParams.get('zip');

    // Validation paramètres requis
    if (!service_id || !country || !zip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: service_id, country, zip',
        },
        { status: 400 }
      );
    }

    // ✅ Utiliser la vraie API PackLink
    console.log('[Dropoffs API] 🚀 Fetching from PackLink API...', {
      service_id,
      country,
      zip,
    });

    const packlinkClient = getPacklinkClient();
    const dropoffs = await packlinkClient.getDropoffs({
      service_id: parseInt(service_id, 10),
      country,
      zip,
    });

    console.log(
      `[Dropoffs API] ✅ ${dropoffs.length} points returned from PackLink API`
    );

    return NextResponse.json({
      success: true,
      dropoffs,
      count: dropoffs.length,
    });
  } catch (error) {
    console.error('[Dropoffs API] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

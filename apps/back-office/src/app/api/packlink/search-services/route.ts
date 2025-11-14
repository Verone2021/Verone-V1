/**
 * API Route: Search Packlink Services
 * POST /api/packlink/search-services
 *
 * Recherche les services de transport disponibles avec leurs prix
 * pour un itinéraire et des colis donnés
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPacklinkClient } from '@/lib/packlink/client';
import { PacklinkError } from '@/lib/packlink/errors';
import type { PacklinkService } from '@/lib/packlink/types';
import {
  searchServicesSchema,
  validateData,
  formatZodErrors,
} from '@/lib/packlink/validation';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate avec Zod
    const validation = validateData(searchServicesSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: true,
          code: 422,
          ...formatZodErrors(validation.errors),
        },
        { status: 422 }
      );
    }

    const { from, to, packages } = validation.data;

    // 3. Mapper zip_code → zip pour Packlink API
    const fromAddress = { ...from, zip: from.zip_code };
    const toAddress = { ...to, zip: to.zip_code };

    // 4. Appel API Packlink
    const client = getPacklinkClient();
    const services: PacklinkService[] = await client.searchServices({
      from: fromAddress,
      to: toAddress,
      packages,
    });

    // 5. Trier par prix croissant
    services.sort((a, b) => a.price.total_price - b.price.total_price);

    // 6. Retour succès
    return NextResponse.json({
      success: true,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error('[API] Packlink search services error:', error);

    // Gestion erreurs Packlink
    if (error instanceof PacklinkError) {
      return NextResponse.json(
        {
          error: true,
          code: error.statusCode || 500,
          message: error.message,
          details: error.response?.errors,
        },
        { status: error.statusCode || 500 }
      );
    }

    // Erreur inconnue
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: 'Erreur lors de la recherche des services de transport',
      },
      { status: 500 }
    );
  }
}

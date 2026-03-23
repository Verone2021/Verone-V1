/**
 * API Route: Get Packlink Shipping Services
 * POST /api/packlink/services
 *
 * Returns available shipping services for a given route and package dimensions.
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

const ServiceRequestSchema = z.object({
  toCountry: z.string().default('FR'),
  toZip: z.string().min(1),
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
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validated = ServiceRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { toCountry, toZip, packages: pkgs } = validated.data;

    const client = getPacklinkClient();
    const services = await client.getServices({
      fromCountry: 'FR',
      fromZip: '91300',
      toCountry,
      toZip,
      packages: pkgs,
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('[Packlink Services] Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

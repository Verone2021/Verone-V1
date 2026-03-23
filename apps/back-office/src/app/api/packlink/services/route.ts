import { NextResponse } from 'next/server';

import { z } from 'zod';

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

    const apiKey = process.env.PACKLINK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PACKLINK_API_KEY non configuree' },
        { status: 500 }
      );
    }

    const { toCountry, toZip, packages: pkgs } = validated.data;

    // Build query params for Packlink API
    const params = new URLSearchParams();
    params.set('from[country]', 'FR');
    params.set('from[zip]', '91300'); // Massy
    params.set('to[country]', toCountry);
    params.set('to[zip]', toZip);

    pkgs.forEach((pkg, i) => {
      params.set(`packages[${i}][weight]`, String(pkg.weight));
      params.set(`packages[${i}][width]`, String(pkg.width));
      params.set(`packages[${i}][height]`, String(pkg.height));
      params.set(`packages[${i}][length]`, String(pkg.length));
    });

    // Always use production API (API key is production)
    const baseUrl = 'https://api.packlink.com/v1';

    const response = await fetch(`${baseUrl}/services?${params.toString()}`, {
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Packlink API] Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Packlink API error: ${response.status}` },
        { status: 502 }
      );
    }

    const services: unknown = await response.json();
    return NextResponse.json({ services });
  } catch (error) {
    console.error('[Packlink Services] Error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

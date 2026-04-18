/**
 * PATCH /api/organisations/[id]/shipping-address
 * Met à jour l'adresse de livraison d'une organisation.
 * Utilisé depuis QuoteShippingSection quand saveToOrg = true.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createAdminClient } from '@verone/utils/supabase/server';

const ShippingAddressSchema = z.object({
  address_line1: z.string().min(1),
  postal_code: z.string().min(1),
  city: z.string().min(1),
  country: z.string().length(2).default('FR'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Organisation ID manquant' },
        { status: 400 }
      );
    }

    const rawBody: unknown = await request.json();
    const parsed = ShippingAddressSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { address_line1, postal_code, city, country, latitude, longitude } =
      parsed.data;

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      shipping_address_line1: address_line1,
      shipping_postal_code: postal_code,
      shipping_city: city,
      shipping_country: country,
      has_different_shipping_address: true,
    };

    if (latitude !== undefined) updateData.shipping_latitude = latitude;
    if (longitude !== undefined) updateData.shipping_longitude = longitude;

    const { error } = await supabase
      .from('organisations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[PATCH org shipping-address] DB error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH org shipping-address] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

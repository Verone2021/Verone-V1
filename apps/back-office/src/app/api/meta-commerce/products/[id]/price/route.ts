/**
 * API Route: PUT /api/meta-commerce/products/[id]/price
 *
 * Met à jour le prix HT custom d'un produit synchronisé sur Meta Commerce.
 * Wrap RPC `update_meta_commerce_price(p_product_id uuid, p_custom_price_ht numeric)`.
 *
 * Body: { customPriceHt: number }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

const UpdatePriceSchema = z.object({
  customPriceHt: z.number().min(0),
});

interface UpdatePriceResponse {
  success: boolean;
  data?: { productId: string; customPriceHt: number };
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdatePriceResponse>> {
  try {
    const { id: productId } = await params;

    if (!productId || !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const validation = UpdatePriceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validation.error.issues.map(e => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { customPriceHt } = validation.data;
    const supabase = await createServerClient();

    const { error } = await supabase.rpc(
      'update_meta_commerce_price' as never,
      {
        p_product_id: productId,
        p_custom_price_ht: customPriceHt,
      } as never
    );

    if (error) {
      const message = (error as { message: string }).message;
      console.error('[API] update_meta_commerce_price failed:', message);
      return NextResponse.json(
        { success: false, error: `Database error: ${message}` },
        { status: 500 }
      );
    }

    console.warn(
      `[API] Meta price updated for ${productId}: ${customPriceHt} HT`
    );

    return NextResponse.json({
      success: true,
      data: { productId, customPriceHt },
    });
  } catch (error) {
    console.error('[API] Meta update price failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

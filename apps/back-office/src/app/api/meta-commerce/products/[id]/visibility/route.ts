/**
 * API Route: PATCH /api/meta-commerce/products/[id]/visibility
 *
 * Toggle visibilité produit sur Meta Commerce (Facebook + Instagram Shopping).
 * Symétrique de PATCH /api/google-merchant/products/[id]/visibility.
 *
 * Guard cascade : refuse 422 si visible=true et products.is_published_online=false
 * (Meta dépend du Site Internet — voir docs/current/canaux-vente-publication-rules.md).
 *
 * Body: { visible: boolean }
 * Response: { success, data?, error? }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

const ToggleVisibilitySchema = z.object({
  visible: z.boolean(),
});

interface ToggleVisibilityResponse {
  success: boolean;
  data?: {
    productId: string;
    visible: boolean;
  };
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ToggleVisibilityResponse>> {
  try {
    const { id: productId } = await params;

    if (!productId || !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const validation = ToggleVisibilitySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validation.error.issues.map(e => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { visible } = validation.data;
    const supabase = await createServerClient();

    if (visible) {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('is_published_online')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error(
          '[API] Fetch product is_published_online failed:',
          fetchError
        );
        return NextResponse.json(
          { success: false, error: `Database error: ${fetchError.message}` },
          { status: 500 }
        );
      }

      if (!product.is_published_online) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Le produit doit être publié sur le Site Internet avant de pouvoir être activé sur Meta Commerce.',
          },
          { status: 422 }
        );
      }
    }

    const { error: rpcError } = await supabase.rpc(
      'toggle_meta_commerce_visibility' as never,
      { p_product_id: productId, p_visible: visible } as never
    );

    if (rpcError) {
      const message = (rpcError as { message: string }).message;
      console.error('[API] toggle_meta_commerce_visibility failed:', message);
      return NextResponse.json(
        { success: false, error: `Database error: ${message}` },
        { status: 500 }
      );
    }

    console.warn(
      `[API] Meta visibility toggled for ${productId}: ${visible ? 'VISIBLE' : 'HIDDEN'}`
    );

    return NextResponse.json({
      success: true,
      data: { productId, visible },
    });
  } catch (error) {
    console.error('[API] Toggle Meta visibility failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

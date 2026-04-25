/**
 * API Route: DELETE /api/meta-commerce/products/[id]
 *
 * Retire un produit de Meta Commerce (soft delete via RPC remove_from_meta_commerce).
 * Symétrique de DELETE /api/google-merchant/products/[id].
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface RemoveProductResponse {
  success: boolean;
  data?: {
    productId: string;
    removed: boolean;
  };
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RemoveProductResponse>> {
  try {
    const { id: productId } = await params;

    if (!productId || !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { error: rpcError } = await supabase.rpc(
      'remove_from_meta_commerce' as never,
      { p_product_id: productId } as never
    );

    if (rpcError) {
      const message = (rpcError as { message: string }).message;
      console.error('[API] remove_from_meta_commerce failed:', message);
      return NextResponse.json(
        { success: false, error: `Database error: ${message}` },
        { status: 500 }
      );
    }

    console.warn(`[API] Product removed from Meta Commerce: ${productId}`);

    return NextResponse.json({
      success: true,
      data: { productId, removed: true },
    });
  } catch (error) {
    console.error('[API] Remove from Meta failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

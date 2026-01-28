/**
 * API Route: DELETE /api/google-merchant/products/[id]
 *
 * Retire un produit de Google Merchant (soft delete avec historique préservé)
 * Utilise RPC remove_from_google_merchant()
 *
 * Params:
 * - id: UUID du produit
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { productId, removed: true },
 *   error?: string
 * }
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

/**
 * DELETE - Retirer produit de Google Merchant (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RemoveProductResponse>> {
  try {
    const { id: productId } = await params;

    // 1. Valider UUID
    if (
      !productId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        productId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product ID format',
        },
        { status: 400 }
      );
    }

    console.warn(`[API] Remove product from Google Merchant: ${productId}`);

    // 2. Initialisation Supabase
    const supabase = await createServerClient();

    // 3. Appeler RPC remove_from_google_merchant
    const { data, error } = await (supabase as any).rpc(
      'remove_from_google_merchant',
      {
        p_product_id: productId,
      }
    );

    if (error) {
      console.error('[API] RPC remove_from_google_merchant failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 4. Vérifier résultat RPC
    const result = data as Array<{ success: boolean; error: string | null }>;
    if (!result || result.length === 0 || !result[0].success) {
      const errorMsg = result?.[0]?.error || 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    console.warn(
      `[API] Product removed successfully (soft delete): ${productId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        removed: true,
      },
    });
  } catch (error: any) {
    console.error('[API] Remove product failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

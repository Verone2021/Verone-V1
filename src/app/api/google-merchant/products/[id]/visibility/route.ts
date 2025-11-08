/**
 * API Route: PATCH /api/google-merchant/products/[id]/visibility
 *
 * Masque ou affiche un produit sur Google Merchant (toggle)
 * Utilise RPC toggle_google_merchant_visibility()
 *
 * Params:
 * - id: UUID du produit
 *
 * Body:
 * {
 *   visible: boolean // true = afficher, false = masquer
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { productId, visible },
 *   error?: string
 * }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

// Validation schema
const ToggleVisibilitySchema = z.object({
  visible: z.boolean(),
});

type ToggleVisibilityRequest = z.infer<typeof ToggleVisibilitySchema>;

interface ToggleVisibilityResponse {
  success: boolean;
  data?: {
    productId: string;
    visible: boolean;
  };
  error?: string;
}

/**
 * PATCH - Toggle visibilité produit Google Merchant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ToggleVisibilityResponse>> {
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

    // 2. Parse et valider body
    const body = await request.json();

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

    const { visible }: ToggleVisibilityRequest = validation.data;

    console.log(
      `[API] Toggle visibility for product ${productId}: ${visible ? 'SHOW' : 'HIDE'}`
    );

    // 3. Initialisation Supabase
    const supabase = await createServerClient();

    // 4. Appeler RPC toggle_google_merchant_visibility
    const { data, error } = await (supabase as any).rpc(
      'toggle_google_merchant_visibility',
      {
        p_product_id: productId,
        p_visible: visible,
      }
    );

    if (error) {
      console.error(
        '[API] RPC toggle_google_merchant_visibility failed:',
        error
      );
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 5. Vérifier résultat RPC
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

    console.log(
      `[API] Visibility toggled successfully: ${visible ? 'VISIBLE' : 'HIDDEN'}`
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        visible,
      },
    });
  } catch (error: any) {
    console.error('[API] Toggle visibility failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

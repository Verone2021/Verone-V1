/**
 * API Route: PATCH /api/google-merchant/products/[id]/metadata
 *
 * Met à jour les métadonnées custom (titre, description) pour un produit Google Merchant
 * Utilise RPC update_google_merchant_metadata()
 *
 * Params:
 * - id: UUID du produit
 *
 * Body:
 * {
 *   customTitle?: string, // Titre optimisé (max 150 chars Google)
 *   customDescription?: string // Description optimisée (max 5000 chars Google)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { productId, customTitle, customDescription },
 *   error?: string
 * }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

// Validation schema
const UpdateMetadataSchema = z
  .object({
    customTitle: z.string().max(150).optional(),
    customDescription: z.string().max(5000).optional(),
  })
  .refine(
    data =>
      data.customTitle !== undefined || data.customDescription !== undefined,
    {
      message:
        'At least one field (customTitle or customDescription) must be provided',
    }
  );

type UpdateMetadataRequest = z.infer<typeof UpdateMetadataSchema>;

interface UpdateMetadataResponse {
  success: boolean;
  data?: {
    productId: string;
    customTitle?: string;
    customDescription?: string;
  };
  error?: string;
}

/**
 * PATCH - Mettre à jour métadonnées custom Google Merchant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateMetadataResponse>> {
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

    const validation = UpdateMetadataSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validation.error.issues.map(e => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { customTitle, customDescription }: UpdateMetadataRequest =
      validation.data;

    console.warn(`[API] Update metadata for product ${productId}:`, {
      customTitle: customTitle?.substring(0, 50),
      customDescription: customDescription?.substring(0, 50),
    });

    // 3. Initialisation Supabase
    const supabase = await createServerClient();

    // 4. Appeler RPC update_google_merchant_metadata
    const { data, error } = await (supabase as any).rpc(
      'update_google_merchant_metadata',
      {
        p_product_id: productId,
        p_custom_title: customTitle ?? null,
        p_custom_description: customDescription ?? null,
      }
    );

    if (error) {
      console.error('[API] RPC update_google_merchant_metadata failed:', error);
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

    console.warn(
      `[API] Metadata updated successfully for product ${productId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        ...(customTitle && { customTitle }),
        ...(customDescription && { customDescription }),
      },
    });
  } catch (error: any) {
    console.error('[API] Update metadata failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

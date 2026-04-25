/**
 * API Route: PATCH /api/meta-commerce/products/[id]/metadata
 *
 * Met à jour le titre et/ou la description custom d'un produit Meta Commerce.
 * Wrap RPC `update_meta_commerce_metadata(p_product_id, p_custom_title, p_custom_description)`.
 *
 * Body: { customTitle?: string|null; customDescription?: string|null }
 * (au moins un des deux requis)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

const UpdateMetadataSchema = z
  .object({
    customTitle: z.string().nullable().optional(),
    customDescription: z.string().nullable().optional(),
  })
  .refine(
    data =>
      data.customTitle !== undefined || data.customDescription !== undefined,
    { message: 'At least one of customTitle / customDescription is required' }
  );

interface UpdateMetadataResponse {
  success: boolean;
  data?: {
    productId: string;
    customTitle: string | null;
    customDescription: string | null;
  };
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateMetadataResponse>> {
  try {
    const { id: productId } = await params;

    if (!productId || !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
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

    const { customTitle = null, customDescription = null } = validation.data;
    const supabase = await createServerClient();

    const { error } = await supabase.rpc(
      'update_meta_commerce_metadata' as never,
      {
        p_product_id: productId,
        p_custom_title: customTitle,
        p_custom_description: customDescription,
      } as never
    );

    if (error) {
      const message = (error as { message: string }).message;
      console.error('[API] update_meta_commerce_metadata failed:', message);
      return NextResponse.json(
        { success: false, error: `Database error: ${message}` },
        { status: 500 }
      );
    }

    console.warn(`[API] Meta metadata updated for ${productId}`);

    return NextResponse.json({
      success: true,
      data: { productId, customTitle, customDescription },
    });
  } catch (error) {
    console.error('[API] Meta update metadata failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

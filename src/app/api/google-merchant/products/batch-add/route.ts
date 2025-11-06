/**
 * API Route: POST /api/google-merchant/products/batch-add
 *
 * Ajoute batch de produits au canal Google Merchant
 * Utilise RPC batch_add_google_merchant_products()
 *
 * Body:
 * {
 *   productIds: string[], // UUIDs des produits à ajouter
 *   merchantId: string // Account ID Google Merchant
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { totalProcessed, successCount, errorCount, errors? },
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const BatchAddSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
  merchantId: z.string().min(1),
});

type BatchAddRequest = z.infer<typeof BatchAddSchema>;

interface BatchAddResponse {
  success: boolean;
  data?: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors?: Array<{
      productId: string;
      error: string;
    }>;
  };
  error?: string;
}

/**
 * POST - Ajouter batch de produits à Google Merchant
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<BatchAddResponse>> {
  try {
    // 1. Parse et valider body
    const body = await request.json();

    const validation = BatchAddSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validation.error.issues.map(e => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { productIds, merchantId }: BatchAddRequest = validation.data;

    console.log(
      `[API] Batch add request: ${productIds.length} products, merchant ${merchantId}`
    );

    // 2. Initialisation Supabase
    const supabase = await createServerClient();

    // 3. Appeler RPC batch_add_google_merchant_products
    const { data, error } = await (supabase as any).rpc(
      'batch_add_google_merchant_products',
      {
        product_ids: productIds,
        merchant_id: merchantId,
      }
    );

    if (error) {
      console.error(
        '[API] RPC batch_add_google_merchant_products failed:',
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

    // 4. Agréger résultats
    const results = data as Array<{
      success: boolean;
      product_id: string;
      google_product_id: string | null;
      error: string | null;
    }>;

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const errors = results
      .filter(r => !r.success)
      .map(r => ({
        productId: r.product_id,
        error: r.error || 'Unknown error',
      }));

    console.log(
      `[API] Batch add completed: ${successCount} success, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: productIds.length,
        successCount,
        errorCount,
        ...(errors.length > 0 && { errors }),
      },
    });
  } catch (error: any) {
    console.error('[API] Batch add failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

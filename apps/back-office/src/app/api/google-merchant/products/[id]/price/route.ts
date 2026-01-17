/**
 * API Route: PUT /api/google-merchant/products/[id]/price
 *
 * Met à jour le prix HT custom pour un produit Google Merchant
 * Utilise RPC update_google_merchant_price()
 *
 * Params:
 * - id: UUID du produit
 *
 * Body:
 * {
 *   priceHtCents: number, // Prix HT en centimes
 *   tvaRate?: number // Taux TVA (défaut 20.00)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { productId, priceHtCents, priceTtcCents },
 *   error?: string
 * }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

// Validation schema
const UpdatePriceSchema = z.object({
  priceHtCents: z.number().int().min(0),
  tvaRate: z.number().min(0).max(100).optional().default(20.0),
});

type UpdatePriceRequest = z.infer<typeof UpdatePriceSchema>;

interface UpdatePriceResponse {
  success: boolean;
  data?: {
    productId: string;
    priceHtCents: number;
    priceTtcCents: number;
  };
  error?: string;
}

/**
 * PUT - Mettre à jour prix custom Google Merchant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdatePriceResponse>> {
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

    const { priceHtCents, tvaRate }: UpdatePriceRequest = validation.data;

    console.log(
      `[API] Update price for product ${productId}: ${priceHtCents}¢ HT (TVA ${tvaRate}%)`
    );

    // 3. Initialisation Supabase
    const supabase = await createServerClient();

    // 4. Appeler RPC update_google_merchant_price
    const { data, error } = await (supabase as any).rpc(
      'update_google_merchant_price',
      {
        p_product_id: productId,
        p_price_ht_cents: priceHtCents,
        p_tva_rate: tvaRate,
      }
    );

    if (error) {
      console.error('[API] RPC update_google_merchant_price failed:', error);
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

    // 6. Calculer prix TTC
    const priceTtcCents = Math.round(priceHtCents * (1 + tvaRate / 100));

    console.log(
      `[API] Price updated successfully: ${priceHtCents}¢ HT → ${priceTtcCents}¢ TTC`
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        priceHtCents,
        priceTtcCents,
      },
    });
  } catch (error: any) {
    console.error('[API] Update price failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

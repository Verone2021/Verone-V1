/**
 * API Route: POST /api/google-merchant/poll-statuses
 *
 * Met à jour les statuts Google réels pour un batch de produits
 * Utilise RPC poll_google_merchant_statuses()
 *
 * Cette route sera appelée par:
 * 1. Cron job automatique (toutes les 4h)
 * 2. Action manuelle utilisateur (bouton "Actualiser statuts")
 *
 * Body:
 * {
 *   statusesData: Array<{
 *     productId: string, // UUID produit
 *     googleStatus: 'approved' | 'pending' | 'rejected' | 'not_synced',
 *     googleStatusDetail?: object // Détails erreurs Google
 *   }>
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { updatedCount },
 *   error?: string
 * }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

// Validation schema
const StatusItemSchema = z.object({
  productId: z.string().uuid(),
  googleStatus: z.enum(['approved', 'pending', 'rejected', 'not_synced']),
  googleStatusDetail: z.record(z.string(), z.any()).optional(),
});

const PollStatusesSchema = z.object({
  statusesData: z.array(StatusItemSchema).min(1).max(1000),
});

type PollStatusesRequest = z.infer<typeof PollStatusesSchema>;

interface PollStatusesResponse {
  success: boolean;
  data?: {
    updatedCount: number;
  };
  error?: string;
}

/**
 * POST - Polling statuts Google Merchant
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<PollStatusesResponse>> {
  try {
    // 1. Parse et valider body
    const body = await request.json();

    const validation = PollStatusesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validation.error.issues.map((e: any) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { statusesData }: PollStatusesRequest = validation.data;

    console.warn(
      `[API] Poll statuses request: ${statusesData.length} products`
    );

    // 2. Initialisation Supabase
    const supabase = await createServerClient();

    // 3. Transformer données pour RPC (format JSONB attendu)
    const productIds = statusesData.map(s => s.productId);
    const statusesJsonb = statusesData.map(s => ({
      product_id: s.productId,
      google_status: s.googleStatus,
      google_status_detail: s.googleStatusDetail ?? null,
    }));

    // 4. Appeler RPC poll_google_merchant_statuses
    const { data, error } = await (supabase as any).rpc(
      'poll_google_merchant_statuses',
      {
        product_ids: productIds,
        statuses_data: statusesJsonb,
      }
    );

    if (error) {
      console.error('[API] RPC poll_google_merchant_statuses failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // 5. Extraire résultats RPC
    const result = data as Array<{
      success: boolean;
      updated_count: number;
      error: string | null;
    }>;

    if (!result || result.length === 0 || !result[0].success) {
      const errorMsg = result?.[0]?.error ?? 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
        },
        { status: 500 }
      );
    }

    const updatedCount = result[0].updated_count;

    console.warn(
      `[API] Poll statuses completed: ${updatedCount} products updated`
    );

    return NextResponse.json({
      success: true,
      data: {
        updatedCount,
      },
    });
  } catch (error: any) {
    console.error('[API] Poll statuses failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

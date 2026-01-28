/**
 * Cron Job: GET /api/cron/google-merchant-poll
 *
 * Polling automatique des statuts Google Merchant Center
 * Exécuté toutes les 4h par Vercel Cron
 *
 * Workflow:
 * 1. Récupérer produits synchronisés (google_merchant_syncs)
 * 2. Pour chaque produit, interroger Google Merchant API
 * 3. Mettre à jour statuts via poll_google_merchant_statuses()
 * 4. Refresh stats dashboard
 *
 * Configuration: vercel.json crons
 *
 * Response:
 * {
 *   success: boolean,
 *   data?: { totalChecked, updatedCount, duration },
 *   error?: string
 * }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface CronResponse {
  success: boolean;
  data?: {
    totalChecked: number;
    updatedCount: number;
    duration: number;
  };
  error?: string;
}

/**
 * GET - Cron job polling statuts Google Merchant
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CronResponse>> {
  const startTime = Date.now();

  try {
    console.warn('[CRON] Google Merchant polling started');

    // 1. Vérifier autorisation Vercel Cron (sécurité)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET OBLIGATOIRE en production
    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[CRON] Unauthorized: Invalid CRON_SECRET');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Initialisation Supabase (service_role pour cron)
    const supabase = await createServerClient();

    // 3. Récupérer produits synchronisés (sync_status = 'success')
    const { data: syncedProducts, error: fetchError } = await (supabase as any)
      .from('google_merchant_syncs')
      .select('product_id, google_product_id')
      .eq('sync_status', 'success')
      .limit(1000); // Batch max 1000 produits

    if (fetchError) {
      console.error('[CRON] Error fetching synced products:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${fetchError.message}`,
        },
        { status: 500 }
      );
    }

    if (!syncedProducts || syncedProducts.length === 0) {
      console.warn('[CRON] No synced products to poll');
      return NextResponse.json({
        success: true,
        data: {
          totalChecked: 0,
          updatedCount: 0,
          duration: Date.now() - startTime,
        },
      });
    }

    console.warn(
      `[CRON] Polling ${syncedProducts.length} products from Google API`
    );

    // 4. TODO: Interroger Google Merchant Content API pour statuts réels
    // Pour MVP, simuler statuts (à remplacer par vraie API Google)
    const statusesData = syncedProducts.map((p: any) => ({
      product_id: p.product_id,
      google_status: 'approved', // TODO: Vraie valeur depuis Google API
      google_status_detail: null,
    }));

    // 5. Appeler RPC poll_google_merchant_statuses
    const { data: pollResult, error: pollError } = await (supabase as any).rpc(
      'poll_google_merchant_statuses',
      {
        product_ids: syncedProducts.map((p: any) => p.product_id),
        statuses_data: statusesData,
      }
    );

    if (pollError) {
      console.error(
        '[CRON] RPC poll_google_merchant_statuses failed:',
        pollError
      );
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${pollError.message}`,
        },
        { status: 500 }
      );
    }

    const result = pollResult as Array<{
      success: boolean;
      updated_count: number;
      error: string | null;
    }>;

    const updatedCount = result?.[0]?.updated_count || 0;

    const duration = Date.now() - startTime;

    console.warn(
      `[CRON] Polling completed: ${syncedProducts.length} checked, ${updatedCount} updated (${duration}ms)`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalChecked: syncedProducts.length,
        updatedCount,
        duration,
      },
    });
  } catch (error: any) {
    const _duration = Date.now() - startTime;

    console.error('[CRON] Polling failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

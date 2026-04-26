/**
 * API Route: POST /api/meta-commerce/products/batch-add
 *
 * Ajoute un batch de produits au canal Meta Commerce.
 * Wrap RPC `batch_add_meta_commerce_products(p_product_ids uuid[], p_catalog_id text)`.
 *
 * Body:
 * {
 *   productIds: string[], // UUIDs des produits à ajouter
 *   catalogId?: string    // optionnel, défaut = catalog_id Verone (1223749196006844)
 * }
 *
 * Note : la route NE PUSH PAS vers l'API Meta — elle insère seulement les
 * lignes meta_commerce_syncs avec status=pending. Le cron poll-statuses
 * (à créer) ou un appel manuel envoie ensuite à l'API Meta Graph.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

const BatchAddSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
  catalogId: z.string().min(1).optional(),
});

interface BatchAddResponse {
  success: boolean;
  data?: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  };
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<BatchAddResponse>> {
  try {
    const body: unknown = await request.json();
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

    const { productIds, catalogId } = validation.data;

    console.warn(
      `[API] Meta batch add: ${productIds.length} products${catalogId ? ` to catalog ${catalogId}` : ''}`
    );

    const supabase = await createServerClient();

    // Guard cascade : Meta Commerce dépend du Site Internet.
    // Refuser tout productId dont products.is_published_online = false.
    // Voir docs/current/canaux-vente-publication-rules.md
    const { data: validProducts, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds)
      .eq('is_published_online', true);

    if (fetchError) {
      console.error('[API] Fetch is_published_online failed:', fetchError);
      return NextResponse.json(
        { success: false, error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const publishedIds = new Set((validProducts ?? []).map(p => p.id));
    const unpublishedIds = productIds.filter(id => !publishedIds.has(id));

    if (unpublishedIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${unpublishedIds.length} produit(s) non publié(s) sur le Site Internet ne peuvent pas être ajoutés à Meta Commerce. Publiez-les d'abord sur le Site Internet.`,
        },
        { status: 422 }
      );
    }

    const rpcArgs: { p_product_ids: string[]; p_catalog_id?: string } = {
      p_product_ids: productIds,
    };
    if (catalogId) rpcArgs.p_catalog_id = catalogId;

    const { data, error } = await supabase.rpc(
      'batch_add_meta_commerce_products' as never,
      rpcArgs as never
    );

    if (error) {
      const message = (error as { message: string }).message;
      console.error('[API] batch_add_meta_commerce_products failed:', message);
      return NextResponse.json(
        { success: false, error: `Database error: ${message}` },
        { status: 500 }
      );
    }

    const rows = data as Array<{
      total_processed: number;
      success_count: number;
      error_count: number;
    }>;
    const row = rows?.[0] ?? {
      total_processed: productIds.length,
      success_count: 0,
      error_count: productIds.length,
    };

    console.warn(
      `[API] Meta batch add done: ${row.success_count}/${row.total_processed} ok, ${row.error_count} err`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: row.total_processed,
        successCount: row.success_count,
        errorCount: row.error_count,
      },
    });
  } catch (error) {
    console.error('[API] Meta batch-add failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

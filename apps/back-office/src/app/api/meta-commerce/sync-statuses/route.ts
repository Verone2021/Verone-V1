import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface MetaProduct {
  id: string;
  retailer_id: string;
  name: string;
  review_status: string;
  image_url: string;
}

interface MetaApiResponse {
  data: MetaProduct[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

interface SyncRecord {
  sync_id: string;
  product_id: string;
  sku: string;
}

/**
 * POST /api/meta-commerce/sync-statuses
 *
 * Fetches product statuses from Meta Graph API and updates meta_commerce_syncs.
 * Maps retailer_id (SKU) to our products and stores meta_product_id + review_status.
 */
export async function POST() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const catalogId = process.env.META_CATALOG_ID;

  if (!accessToken || !catalogId) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN ou META_CATALOG_ID manquant' },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch all products from Meta catalog
    const metaProducts: MetaProduct[] = [];
    let nextUrl: string | null =
      `https://graph.facebook.com/v21.0/${catalogId}/products?fields=id,retailer_id,name,review_status,image_url&limit=100&access_token=${accessToken}`;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      if (!response.ok) {
        const errorData = (await response.json()) as Record<string, unknown>;
        return NextResponse.json(
          { error: 'Erreur API Meta', details: errorData },
          { status: 502 }
        );
      }
      const data = (await response.json()) as MetaApiResponse;
      metaProducts.push(...data.data);
      nextUrl = data.paging?.next ?? null;
    }

    // 2. Get synced products via raw SQL (meta_commerce_syncs not in generated types)
    const { data: syncedProducts, error: fetchError } = (await supabase.rpc(
      'get_meta_sync_records_for_status_update' as never
    )) as unknown as {
      data: SyncRecord[] | null;
      error: { message: string } | null;
    };

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erreur DB', details: fetchError.message },
        { status: 500 }
      );
    }

    // 3. Build SKU -> sync record mapping
    const skuToSync = new Map<string, { syncId: string; productId: string }>();
    for (const record of syncedProducts ?? []) {
      skuToSync.set(record.sku, {
        syncId: record.sync_id,
        productId: record.product_id,
      });
    }

    // 4. Match and update via RPC
    let updated = 0;
    let notFound = 0;

    for (const metaProduct of metaProducts) {
      const syncRecord = skuToSync.get(metaProduct.retailer_id);
      if (!syncRecord) {
        notFound++;
        continue;
      }

      const metaStatus = mapReviewStatus(metaProduct.review_status);

      const { error: updateError } = await supabase.rpc(
        'update_meta_sync_status' as never,
        {
          p_sync_id: syncRecord.syncId,
          p_meta_product_id: metaProduct.id,
          p_meta_status: metaStatus,
        } as never
      );

      if (!updateError) {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      meta_products_found: metaProducts.length,
      updated,
      not_found: notFound,
    });
  } catch (err) {
    console.error('[sync-statuses] Error:', err);
    return NextResponse.json(
      { error: 'Erreur interne', details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Maps Meta's review_status to our meta_status enum.
 * See: https://developers.facebook.com/docs/marketing-api/reference/product-item/
 *
 * Meta review_status values: approved, pending, rejected, ""
 *
 * In Europe (redirect-to-website mode), review_status is always ""
 * because Meta does not review products when checkout is off-site.
 * An empty review_status with a valid meta_product_id means the
 * product IS published in the catalog and visible in the shop.
 */
function mapReviewStatus(
  reviewStatus: string
): 'active' | 'pending' | 'rejected' {
  switch (reviewStatus) {
    case 'approved':
      return 'active';
    case 'rejected':
      return 'rejected';
    case 'pending':
      return 'pending';
    case '':
      // Empty = product exists in catalog, visible in shop (redirect mode)
      return 'active';
    default:
      return 'pending';
  }
}

/**
 * 🔄 API Route: Synchronisation Batch Google Merchant Center
 *
 * POST /api/google-merchant/batch-sync
 * Synchronise tous les produits éligibles avec Google Merchant Center
 *
 * SÉCURITÉ: Hard gate + lazy import - Si NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED !== 'true'
 * la route retourne 503 sans charger les modules Google Merchant
 *
 * Query params:
 * - deleteExisting: boolean - Si true, supprime tous les produits existants avant sync
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface BatchSyncResponse {
  success: boolean;
  disabled?: boolean;
  message?: string;
  data?: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors?: Array<{
      productId: string;
      sku: string;
      error: string;
    }>;
  };
  error?: string;
}

/**
 * POST - Synchronise tous les produits éligibles
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<BatchSyncResponse>> {
  // 🔒 HARD GATE: Si flag désactivé ou absent, skip silencieux
  if (process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED !== 'true') {
    return NextResponse.json(
      {
        success: false,
        disabled: true,
        message: 'Intégration Google Merchant désactivée',
      },
      { status: 503 }
    );
  }

  // ✅ LAZY IMPORT: Chargé seulement si flag explicitement 'true'
  const { getGoogleMerchantClient } = await import(
    '@verone/integrations/google-merchant/client'
  );

  try {
    const searchParams = request.nextUrl.searchParams;
    const deleteExisting = searchParams.get('deleteExisting') === 'true';

    console.warn(
      `[API] Batch sync request - deleteExisting: ${deleteExisting}`
    );

    // 1. Initialisation Supabase
    const supabase = await createServerClient();

    // 2. Récupération des produits éligibles (product_status = 'active', avec prix et images)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(
        `
        id,
        sku,
        name,
        description,
        technical_description,
        product_status,
        stock_status,
        condition,
        brand,
        gtin,
        supplier_reference,
        variant_attributes,
        selling_points,
        weight,
        dimensions,
        created_at,
        updated_at,
        subcategory:subcategories(id, name),
        images:product_images(public_url, is_primary, alt_text, display_order)
      `
      )
      .eq('product_status', 'active')
      .not('stock_status', 'is', null)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('[API] Error fetching products:', productsError);
      return NextResponse.json(
        {
          success: false,
          error: `Erreur récupération produits: ${productsError.message}`,
        },
        { status: 500 }
      );
    }

    console.warn(`[API] Found ${products?.length ?? 0} eligible products`);

    // 3. Filtrer les produits avec images et prix
    const eligibleProducts = (products ?? []).filter(product => {
      const hasImages = product.images && product.images.length > 0;
      // Le prix sera récupéré par le transformer via price_list_items
      return hasImages;
    });

    console.warn(
      `[API] ${eligibleProducts.length} products have required data (images)`
    );

    if (eligibleProducts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalProcessed: 0,
          successCount: 0,
          errorCount: 0,
        },
      });
    }

    // 4. Synchronisation batch
    const googleClient = getGoogleMerchantClient();
    const results = await googleClient.batchSyncProducts(
      eligibleProducts as unknown as Parameters<
        typeof googleClient.batchSyncProducts
      >[0]
    );

    // 5. Agrégation des résultats
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const errors = results
      .filter(r => !r.success)
      .map((r, index) => ({
        productId: eligibleProducts[index].id,
        sku: eligibleProducts[index].sku,
        error: r.error ?? 'Unknown error',
      }));

    console.warn(
      `[API] Batch sync completed: ${successCount} success, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: eligibleProducts.length,
        successCount,
        errorCount,
        ...(errors.length > 0 && { errors }),
      },
    });
  } catch (error: unknown) {
    console.error('[API] Batch sync failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

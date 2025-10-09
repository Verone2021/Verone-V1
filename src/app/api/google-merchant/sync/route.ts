/**
 * API Route: Google Merchant Sync
 *
 * POST /api/google-merchant/sync
 * Synchronise des produits Supabase vers Google Merchant Center
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { GoogleMerchantSyncClient } from '@/lib/google-merchant/sync-client'
import { mapProductsBatch, canProductBeSynced } from '@/lib/google-merchant/product-mapper'
import type { ProductWithRelations } from '@/lib/google-merchant/product-mapper'

/**
 * Request body schema
 */
interface SyncRequest {
  productIds: string[]
  action: 'insert' | 'update' | 'delete'
}

/**
 * Response schema
 */
interface SyncResponse {
  success: boolean
  total: number
  synced: number
  failed: number
  skipped: number
  duration: number
  results: Array<{
    productId: string
    sku: string
    success: boolean
    operation: 'insert' | 'update' | 'delete' | 'skipped'
    error?: string
  }>
}

/**
 * Charge les produits avec leurs relations (images + subcategory)
 */
async function loadProductsWithRelations(
  productIds: string[]
): Promise<ProductWithRelations[]> {
  const supabase = await createServerClient()

  // Charger produits
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productsError) {
    throw new Error(`Failed to load products: ${productsError.message}`)
  }

  if (!products || products.length === 0) {
    return []
  }

  // Charger images pour tous les produits
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds)
    .order('display_order', { ascending: true })

  if (imagesError) {
    logger.warn('Failed to load images', {
      operation: 'load_images',
      error: imagesError.message
    })
  }

  // Charger subcategories (avec category parent)
  const subcategoryIds = products
    .map(p => p.subcategory_id)
    .filter((id): id is string => id !== null)

  let subcategories: any[] = []
  if (subcategoryIds.length > 0) {
    const { data: subcategoriesData, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select(`
        *,
        category:categories(name)
      `)
      .in('id', subcategoryIds)

    if (subcategoriesError) {
      logger.warn('Failed to load subcategories', {
        operation: 'load_subcategories',
        error: subcategoriesError.message
      })
    } else {
      subcategories = subcategoriesData || []
    }
  }

  // Mapper les produits avec leurs relations
  const productsWithRelations: ProductWithRelations[] = products.map(product => {
    const productImages = images?.filter(img => img.product_id === product.id) || []
    const subcategory = subcategories.find(sub => sub.id === product.subcategory_id) || null

    return {
      product,
      images: productImages,
      subcategory
    }
  })

  return productsWithRelations
}

/**
 * POST /api/google-merchant/sync
 * Synchronise des produits vers Google Merchant Center
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse request body
    const body: SyncRequest = await request.json()

    logger.info('Google Merchant sync requested', {
      operation: 'sync_request',
      action: body.action,
      productCount: body.productIds.length
    })

    // Validation
    if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array required' },
        { status: 400 }
      )
    }

    if (!['insert', 'update', 'delete'].includes(body.action)) {
      return NextResponse.json(
        { error: 'action must be insert, update, or delete' },
        { status: 400 }
      )
    }

    // Action DELETE: pas besoin de charger les produits, juste les SKUs
    if (body.action === 'delete') {
      const supabase = await createServerClient()
      const { data: products } = await supabase
        .from('products')
        .select('id, sku')
        .in('id', body.productIds)

      if (!products || products.length === 0) {
        return NextResponse.json({
          success: true,
          total: 0,
          synced: 0,
          failed: 0,
          skipped: 0,
          duration: Date.now() - startTime,
          results: []
        })
      }

      // Supprimer via sync client
      const syncClient = new GoogleMerchantSyncClient()
      const offerIds = products.map(p => p.sku)
      const batchResult = await syncClient.deleteProductsBatch(offerIds)

      const response: SyncResponse = {
        success: batchResult.failed === 0,
        total: batchResult.total,
        synced: batchResult.success,
        failed: batchResult.failed,
        skipped: 0,
        duration: batchResult.duration,
        results: batchResult.results.map(r => ({
          productId: products.find(p => p.sku === r.offerId)?.id || '',
          sku: r.offerId,
          success: r.success,
          operation: 'delete',
          error: r.error
        }))
      }

      return NextResponse.json(response)
    }

    // Actions INSERT/UPDATE: charger produits avec relations
    const productsWithRelations = await loadProductsWithRelations(body.productIds)

    if (productsWithRelations.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        synced: 0,
        failed: 0,
        skipped: 0,
        duration: Date.now() - startTime,
        results: []
      })
    }

    // Filtrer produits qui peuvent être synchronisés
    const syncableProducts: ProductWithRelations[] = []
    const skippedProducts: Array<{ productId: string; sku: string; reasons: string[] }> = []

    for (const productData of productsWithRelations) {
      const validation = canProductBeSynced(productData.product)
      if (validation.canSync) {
        syncableProducts.push(productData)
      } else {
        skippedProducts.push({
          productId: productData.product.id,
          sku: productData.product.sku || 'UNKNOWN',
          reasons: validation.reasons
        })
      }
    }

    logger.info('Product validation complete', {
      operation: 'sync_validation',
      total: productsWithRelations.length,
      syncable: syncableProducts.length,
      skipped: skippedProducts.length
    })

    // Mapper produits vers Google Merchant format
    const { success: mappedProducts, errors: mappingErrors } = mapProductsBatch(syncableProducts)

    logger.info('Product mapping complete', {
      operation: 'sync_mapping',
      total: syncableProducts.length,
      mapped: mappedProducts.length,
      errors: mappingErrors.length
    })

    // Synchroniser via Google Merchant API
    const syncClient = new GoogleMerchantSyncClient()
    const batchResult = body.action === 'insert'
      ? await syncClient.insertProductsBatch(mappedProducts)
      : await syncClient.updateProductsBatch(mappedProducts)

    // Construire réponse
    const response: SyncResponse = {
      success: batchResult.failed === 0 && mappingErrors.length === 0,
      total: body.productIds.length,
      synced: batchResult.success,
      failed: batchResult.failed + mappingErrors.length,
      skipped: skippedProducts.length,
      duration: Date.now() - startTime,
      results: [
        // Produits synchronisés
        ...batchResult.results.map(r => ({
          productId: syncableProducts.find(p => p.product.sku === r.offerId)?.product.id || '',
          sku: r.offerId,
          success: r.success,
          operation: body.action,
          error: r.error
        })),
        // Produits avec erreur mapping
        ...mappingErrors.map(e => ({
          productId: e.productId,
          sku: e.sku,
          success: false,
          operation: body.action as 'insert' | 'update',
          error: e.error
        })),
        // Produits skipped
        ...skippedProducts.map(s => ({
          productId: s.productId,
          sku: s.sku,
          success: false,
          operation: 'skipped' as const,
          error: `Skipped: ${s.reasons.join(', ')}`
        }))
      ]
    }

    logger.info('Google Merchant sync completed', {
      operation: 'sync_complete',
      action: body.action,
      total: response.total,
      synced: response.synced,
      failed: response.failed,
      skipped: response.skipped,
      duration: response.duration
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Google Merchant sync failed', {
      operation: 'sync_error',
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * API Route temporaire: DELETE /api/google-merchant/delete-all
 * Supprime TOUS les produits de Google Merchant Center
 */

import { NextResponse } from 'next/server'
import { getGoogleMerchantClient } from '@/lib/google-merchant/client'
import { createServerClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const client = getGoogleMerchantClient()

    console.log('🔥 Listing all products from Google Merchant...')

    // 1. Lister tous les produits
    const listResult = await client.listProducts(1000)

    if (!listResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to list products: ${listResult.error}`
      }, { status: 500 })
    }

    const products = listResult.data?.products || []
    console.log(`📦 Found ${products.length} products to delete`)

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products to delete',
        deleted: 0
      })
    }

    // 2. LOG structure pour debugging
    console.log('📋 First product structure:', JSON.stringify(products[0], null, 2))

    // 3. Extract SKUs from offerId field (pas name)
    const results = []
    for (const product of products) {
      // Le SKU est dans product.offerId, pas dans product.name
      const sku = product.offerId

      if (!sku) {
        console.log(`⚠️  Product missing offerId - name: ${product.name}`)
        results.push({
          sku: 'unknown',
          productName: product.name,
          success: false,
          error: 'Missing offerId'
        })
        continue
      }

      console.log(`🗑️  Deleting product: ${sku}`)

      const deleteResult = await client.deleteProduct(sku)
      results.push({
        sku,
        productName: product.name,
        success: deleteResult.success,
        error: deleteResult.error
      })

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`\n✅ Deleted ${successCount} products`)
    console.log(`❌ Failed ${errorCount} products\n`)

    // 3. Nettoyer la DB
    const supabase = await createServerClient()
    const { error: dbError } = await supabase
      .from('google_merchant_syncs')
      .delete()
      .neq('sync_status', 'deleted')

    if (dbError) {
      console.error('⚠️  Failed to clean DB:', dbError.message)
    } else {
      console.log('🧹 Database cleaned')
    }

    return NextResponse.json({
      success: true,
      totalProducts: products.length,
      deleted: successCount,
      failed: errorCount,
      results: results.filter(r => !r.success) // Only return failures
    })

  } catch (error: any) {
    console.error('💥 Delete all failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

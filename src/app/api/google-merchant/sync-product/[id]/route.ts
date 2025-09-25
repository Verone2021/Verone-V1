/**
 * 🔄 API Route: Synchronisation Produit Google Merchant Center
 *
 * POST /api/google-merchant/sync-product/[id]
 * Synchronise un produit individuel avec Google Merchant Center
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleMerchantClient } from '@/lib/google-merchant/client'
import { createClient } from '@/lib/supabase/server'

interface SyncResponse {
  success: boolean
  data?: any
  error?: string
  details?: any
}

/**
 * Récupère un produit complet depuis Supabase avec ses relations
 */
async function getProductWithRelations(supabase: any, productId: string) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      supplier:organisations(id, name),
      subcategory:subcategories(id, name),
      images:product_images(
        public_url,
        is_primary,
        alt_text,
        display_order
      )
    `)
    .eq('id', productId)
    .single()

  if (productError) {
    throw new Error(`Erreur récupération produit: ${productError.message}`)
  }

  if (!product) {
    throw new Error('Produit non trouvé')
  }

  return product
}

/**
 * Valide les prérequis pour la synchronisation
 */
function validateProductForSync(product: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Champs obligatoires
  if (!product.sku) {
    errors.push('SKU manquant')
  }

  if (!product.name) {
    errors.push('Nom du produit manquant')
  }

  if (!product.price_ht || product.price_ht <= 0) {
    errors.push('Prix HT invalide')
  }

  if (!product.status) {
    errors.push('Statut du produit manquant')
  }

  // Vérifications optionnelles mais recommandées
  if (!product.description) {
    console.warn(`[Sync Product] Description manquante pour ${product.sku}`)
  }

  if (!product.images || product.images.length === 0) {
    console.warn(`[Sync Product] Aucune image pour ${product.sku}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * POST - Synchronise un produit avec Google Merchant Center
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SyncResponse>> {
  try {
    const productId = params.id

    console.log(`[API] Sync product request for ID: ${productId}`)

    // 1. Validation des paramètres
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'ID produit manquant'
      }, { status: 400 })
    }

    // 2. Initialisation Supabase
    const supabase = createClient()

    // 3. Récupération du produit avec relations
    let product
    try {
      product = await getProductWithRelations(supabase, productId)
    } catch (error: any) {
      console.error('[API] Erreur récupération produit:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 404 })
    }

    // 4. Validation des données produit
    const validation = validateProductForSync(product)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Données produit invalides',
        details: { errors: validation.errors }
      }, { status: 400 })
    }

    // 5. Synchronisation avec Google Merchant Center
    const googleClient = getGoogleMerchantClient()
    const syncResult = await googleClient.insertProduct(product)

    if (!syncResult.success) {
      console.error('[API] Erreur synchronisation Google:', syncResult)
      return NextResponse.json({
        success: false,
        error: `Erreur synchronisation Google: ${syncResult.error}`,
        details: syncResult.details
      }, { status: 500 })
    }

    // 6. Log de succès
    console.log(`[API] Product ${product.sku} synchronized successfully with Google Merchant Center`)

    // 7. Réponse de succès
    return NextResponse.json({
      success: true,
      data: {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        googleResponse: syncResult.data,
        syncedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('[API] Sync product failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET - Récupère le statut de synchronisation d'un produit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SyncResponse>> {
  try {
    const productId = params.id

    console.log(`[API] Get sync status for product ID: ${productId}`)

    // 1. Initialisation Supabase
    const supabase = createClient()

    // 2. Récupération du produit
    const { data: product, error } = await supabase
      .from('products')
      .select('id, sku, name, status, updated_at')
      .eq('id', productId)
      .single()

    if (error || !product) {
      return NextResponse.json({
        success: false,
        error: 'Produit non trouvé'
      }, { status: 404 })
    }

    // 3. Vérification du statut Google Merchant
    const googleClient = getGoogleMerchantClient()
    const googleStatus = await googleClient.getProduct(product.sku)

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          status: product.status,
          lastUpdated: product.updated_at
        },
        googleMerchant: {
          exists: googleStatus.success,
          data: googleStatus.data,
          error: googleStatus.error
        }
      }
    })

  } catch (error: any) {
    console.error('[API] Get sync status failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    }, { status: 500 })
  }
}
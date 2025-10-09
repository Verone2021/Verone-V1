/**
 * API Route: Calcul Pricing Intelligent - V2
 *
 * POST /api/pricing/calculate
 * GET /api/pricing/calculate?productId=...
 *
 * Calcul prix avec waterfall priorités (Price Lists V2):
 * 1. Prix contrat client spécifique → PRIORITÉ MAX
 * 2. Prix groupe client (B2B Gold, VIP) → HAUTE PRIORITÉ
 * 3. Prix canal de vente (Retail, Wholesale) → PRIORITÉ NORMALE
 * 4. Prix catalogue base → FALLBACK
 *
 * Features:
 * - Batch pricing support (plusieurs produits)
 * - Support paliers quantités natifs
 * - Validation params stricte
 * - Error handling complet
 * - Logging structuré
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// =====================================================================
// TYPES - Version 2.0 (Price Lists System)
// =====================================================================

interface PricingRequestItem {
  productId: string
  customerId?: string
  customerType?: 'organization' | 'individual'
  channelId?: string
  quantity?: number
  date?: string  // YYYY-MM-DD format
}

interface PricingRequest {
  items: PricingRequestItem[]
}

interface PricingResultV2 {
  price_ht: number
  original_price: number
  discount_rate: number | null
  price_list_id: string
  price_list_name: string
  price_source: 'customer_specific' | 'customer_group' | 'channel' | 'base_catalog'
  min_quantity: number
  max_quantity: number | null
  currency: string
  margin_rate: number | null
  notes: string | null
}

// Type legacy pour compatibilité
interface PricingResult {
  final_price_ht: number
  pricing_source: 'customer_specific' | 'customer_group' | 'channel' | 'base_catalog'
  discount_applied: number
  original_price_ht: number
}

interface PricingResponseItem {
  productId: string
  pricing: PricingResult | null
  error?: string
}

// =====================================================================
// VALIDATION
// =====================================================================

function validatePricingRequest(body: unknown): body is PricingRequest {
  if (!body || typeof body !== 'object') {
    return false
  }

  const request = body as Record<string, unknown>

  if (!Array.isArray(request.items) || request.items.length === 0) {
    return false
  }

  return request.items.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false

    const i = item as Record<string, unknown>

    // productId obligatoire et string
    if (typeof i.productId !== 'string' || i.productId.length === 0) {
      return false
    }

    // customerId optionnel mais si présent doit être string
    if (i.customerId !== undefined && typeof i.customerId !== 'string') {
      return false
    }

    // customerType optionnel mais si présent doit être valide
    if (i.customerType !== undefined &&
        i.customerType !== 'organization' &&
        i.customerType !== 'individual') {
      return false
    }

    // channelId optionnel mais si présent doit être string
    if (i.channelId !== undefined && typeof i.channelId !== 'string') {
      return false
    }

    // quantity optionnel mais si présent doit être number positif
    if (i.quantity !== undefined &&
        (typeof i.quantity !== 'number' || i.quantity <= 0)) {
      return false
    }

    // date optionnel mais si présent doit être format YYYY-MM-DD
    if (i.date !== undefined &&
        (typeof i.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(i.date))) {
      return false
    }

    return true
  })
}

// =====================================================================
// POST /api/pricing/calculate
// =====================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Parser body
    const body = await request.json()

    // 2. Validation
    if (!validatePricingRequest(body)) {
      logger.warn('Invalid pricing request', {
        operation: 'pricing_calculate',
        body
      })

      return NextResponse.json(
        {
          error: 'Invalid request format',
          message: 'Request must have "items" array with valid productId for each item'
        },
        { status: 400 }
      )
    }

    const { items } = body

    logger.info('Pricing calculation request received', {
      operation: 'pricing_calculate',
      itemsCount: items.length
    })

    // 3. Authentification Supabase
    const supabase = await createClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      logger.warn('Unauthorized pricing request', {
        operation: 'pricing_calculate',
        error: authError?.message
      })

      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // 4. Calcul pricing pour chaque item (parallèle) - UTILISER V2
    const results = await Promise.all(
      items.map(async (item: PricingRequestItem): Promise<PricingResponseItem> => {
        try {
          // IMPORTANT: Utiliser calculate_product_price_v2 (nouvelle architecture)
          const { data, error } = await supabase.rpc('calculate_product_price_v2', {
            p_product_id: item.productId,
            p_quantity: item.quantity || 1,
            p_channel_id: item.channelId || null,
            p_customer_id: item.customerId || null,
            p_customer_type: item.customerType || null,
            p_date: item.date || new Date().toISOString().split('T')[0]
          })

          if (error) {
            logger.error('Failed to calculate price for product (V2)', {
              operation: 'pricing_calculate',
              productId: item.productId,
              error: error.message
            })

            return {
              productId: item.productId,
              pricing: null,
              error: error.message
            }
          }

          if (!data || data.length === 0) {
            return {
              productId: item.productId,
              pricing: null,
              error: 'Product not found or not available'
            }
          }

          // Mapper résultat V2 vers format legacy
          const resultV2 = data[0] as PricingResultV2
          const pricing: PricingResult = {
            final_price_ht: resultV2.price_ht,
            pricing_source: resultV2.price_source,
            discount_applied: resultV2.discount_rate || 0,
            original_price_ht: resultV2.original_price
          }

          logger.info('Price calculated successfully (V2)', {
            operation: 'pricing_calculate',
            productId: item.productId,
            finalPrice: pricing.final_price_ht,
            source: pricing.pricing_source,
            priceList: resultV2.price_list_name
          })

          return {
            productId: item.productId,
            pricing
          }
        } catch (err) {
          logger.error('Exception calculating price for product', {
            operation: 'pricing_calculate',
            productId: item.productId,
            error: err instanceof Error ? err.message : String(err)
          })

          return {
            productId: item.productId,
            pricing: null,
            error: err instanceof Error ? err.message : 'Unknown error'
          }
        }
      })
    )

    // 5. Statistiques
    const successCount = results.filter(r => r.pricing !== null).length
    const failureCount = results.filter(r => r.error).length
    const duration = Date.now() - startTime

    logger.info('Pricing calculation completed', {
      operation: 'pricing_calculate',
      total: results.length,
      success: successCount,
      failed: failureCount,
      duration
    })

    // 6. Réponse
    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failureCount,
        duration
      }
    })
  } catch (error) {
    logger.error('Exception in pricing calculation API', {
      operation: 'pricing_calculate',
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// =====================================================================
// GET /api/pricing/calculate (Query Params)
// =====================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Parser query params
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const customerId = searchParams.get('customerId') || undefined
    const customerType = searchParams.get('customerType') as 'organization' | 'individual' | undefined
    const channelId = searchParams.get('channelId') || undefined
    const quantityStr = searchParams.get('quantity')
    const date = searchParams.get('date') || undefined

    // 2. Validation productId obligatoire
    if (!productId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter',
          message: 'productId is required'
        },
        { status: 400 }
      )
    }

    // 3. Validation quantity
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 1
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid parameter',
          message: 'quantity must be a positive number'
        },
        { status: 400 }
      )
    }

    // 4. Validation customerType
    if (customerType && customerType !== 'organization' && customerType !== 'individual') {
      return NextResponse.json(
        {
          error: 'Invalid parameter',
          message: 'customerType must be "organization" or "individual"'
        },
        { status: 400 }
      )
    }

    logger.info('Pricing calculation GET request', {
      operation: 'pricing_calculate_get',
      productId,
      customerId,
      channelId,
      quantity
    })

    // 5. Authentification Supabase
    const supabase = await createClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      logger.warn('Unauthorized pricing request', {
        operation: 'pricing_calculate_get',
        error: authError?.message
      })

      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // 6. Calcul pricing - UTILISER V2
    const { data, error } = await supabase.rpc('calculate_product_price_v2', {
      p_product_id: productId,
      p_quantity: quantity,
      p_channel_id: channelId || null,
      p_customer_id: customerId || null,
      p_customer_type: customerType || null,
      p_date: date || new Date().toISOString().split('T')[0]
    })

    if (error) {
      logger.error('Failed to calculate price (V2)', {
        operation: 'pricing_calculate_get',
        productId,
        error: error.message
      })

      return NextResponse.json(
        {
          error: 'Pricing calculation failed',
          message: error.message
        },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          error: 'Product not found',
          message: 'Product not found or not available'
        },
        { status: 404 }
      )
    }

    // Mapper résultat V2 vers format legacy
    const resultV2 = data[0] as PricingResultV2
    const pricing: PricingResult = {
      final_price_ht: resultV2.price_ht,
      pricing_source: resultV2.price_source,
      discount_applied: resultV2.discount_rate || 0,
      original_price_ht: resultV2.original_price
    }
    const duration = Date.now() - startTime

    logger.info('Price calculated successfully (V2)', {
      operation: 'pricing_calculate_get',
      productId,
      finalPrice: pricing.final_price_ht,
      source: pricing.pricing_source,
      priceList: resultV2.price_list_name,
      duration
    })

    // 7. Réponse
    return NextResponse.json({
      success: true,
      productId,
      pricing,
      duration
    })
  } catch (error) {
    logger.error('Exception in pricing calculation GET API', {
      operation: 'pricing_calculate_get',
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

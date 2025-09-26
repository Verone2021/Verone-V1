/**
 * 🔗 API Route: Product Variants Lookup (Bidirectional)
 *
 * GET /api/products/[productId]/variants - Get all variants for a specific product
 * This route enables the bidirectional variant system: if A, B, C are variants,
 * then GET /products/A/variants returns B, C
 * and GET /products/B/variants returns A, C
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface ProductVariant {
  variant_id: string
  variant_sku: string
  variant_name: string
  variant_price: number
  is_primary_variant: boolean
  group_name: string
  item_group_id: string
}

/**
 * GET - Get all variants for a specific product (bidirectional lookup)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const includeImages = searchParams.get('includeImages') === 'true'
    const includeDetails = searchParams.get('includeDetails') === 'true'

    const supabase = createAdminClient()

    // First verify the product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, sku, name')
      .eq('id', productId as any)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Product not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to verify product',
        details: productError.message
      }, { status: 500 })
    }

    // Use the database function to get variants (bidirectional lookup)
    const { data: variants, error: variantsError } = await supabase
      .rpc('get_product_variants', { input_product_id: productId })

    if (variantsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch product variants',
        details: variantsError.message
      }, { status: 500 })
    }

    // If no variants found, return empty result
    if (!variants || (variants as any).length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          product: {
            id: (product as any).id,
            sku: (product as any).sku,
            name: (product as any).name
          },
          variants: [],
          group: null,
          total_variants: 0
        },
        message: 'Product has no variants'
      })
    }

    // Enhance variants with additional data if requested
    let enhancedVariants = variants
    if (includeImages || includeDetails) {
      const variantIds = (variants as any).map((v: any) => v.variant_id)

      const selectClause = [
        'id',
        'sku',
        'name',
        'price_ht',
        'status',
        ...(includeDetails ? ['description', 'variant_attributes', 'dimensions'] : []),
        ...(includeImages ? ['images:product_images(id, public_url, is_primary, display_order)'] : [])
      ].join(', ')

      const { data: detailedVariants, error: detailsError } = await supabase
        .from('products')
        .select(selectClause)
        .in('id', variantIds)

      if (!detailsError && detailedVariants) {
        // Merge the detailed data with the variant data
        enhancedVariants = (variants as any).map((variant: any) => {
          const detailed = detailedVariants.find((d: any) => d.id === variant.variant_id) as any
          return {
            ...variant,
            ...(detailed && {
              variant_details: {
                status: detailed.status,
                ...(includeDetails && {
                  description: detailed.description,
                  variant_attributes: detailed.variant_attributes,
                  dimensions: detailed.dimensions
                }),
                ...(includeImages && {
                  images: detailed.images || []
                })
              }
            })
          }
        })
      }
    }

    // Get group information
    const groupInfo = variants[0] ? {
      name: variants[0].group_name,
      item_group_id: variants[0].item_group_id,
      primary_variant_id: variants.find(v => v.is_primary_variant)?.variant_id || null
    } : null

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name
        },
        variants: enhancedVariants,
        group: groupInfo,
        total_variants: variants.length
      }
    })

  } catch (error: any) {
    console.error('[API] Error fetching product variants:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * POST - Create variant relationship for this product
 * Creates a new variant group if the product isn't already in one
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    const { productId } = await params
    const body = await request.json()
    const { variant_product_ids, group_name, group_description } = body

    if (!variant_product_ids || variant_product_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Variant product IDs are required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if product is already in a variant group
    const { data: existingMembership, error: membershipError } = await supabase
      .from('product_group_members')
      .select(`
        id,
        group:product_groups(id, name, item_group_id)
      `)
      .eq('product_id', productId)
      .single()

    if (membershipError && membershipError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing variant membership',
        details: membershipError.message
      }, { status: 500 })
    }

    if (existingMembership) {
      return NextResponse.json({
        success: false,
        error: 'Product is already part of a variant group',
        data: {
          existing_group: existingMembership.group
        }
      }, { status: 409 })
    }

    // Create new variant group via the main variants API
    const createGroupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: group_name || `Variants of ${productId}`,
        description: group_description,
        group_type: 'variant',
        primary_product_id: productId,
        product_ids: [productId, ...variant_product_ids]
      })
    })

    if (!createGroupResponse.ok) {
      const errorData = await createGroupResponse.json()
      return NextResponse.json({
        success: false,
        error: 'Failed to create variant group',
        details: errorData.error
      }, { status: createGroupResponse.status })
    }

    const groupData = await createGroupResponse.json()

    return NextResponse.json({
      success: true,
      data: groupData.data,
      message: `Variant group created with ${variant_product_ids.length + 1} products`
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API] Error creating product variant group:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
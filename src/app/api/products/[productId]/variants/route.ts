/**
 * 🔗 API Route: Product Variants Lookup (Nouveau système variant_groups)
 *
 * GET /api/products/[productId]/variants - Get all variants for a specific product
 * Utilise le nouveau système avec variant_groups et products.variant_group_id
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
  variant_details?: {
    status: string
    description?: string
    variant_attributes?: Record<string, any>
    dimensions?: any
    images?: Array<{
      id: string
      public_url: string
      is_primary: boolean
    }>
  }
}

/**
 * GET - Get all variants for a specific product (variant_groups system)
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

    // 1. Récupérer le produit et son variant_group_id
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, sku, name, variant_group_id')
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

    // 2. Si le produit n'a pas de variant_group_id, retourner vide
    if (!product.variant_group_id) {
      return NextResponse.json({
        success: true,
        data: {
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name
          },
          variants: [],
          group: null,
          total_variants: 0
        },
        message: 'Product has no variant group'
      })
    }

    // 3. Récupérer les informations du groupe de variantes
    const { data: variantGroup, error: groupError } = await supabase
      .from('variant_groups')
      .select('id, name, variant_type, product_count')
      .eq('id', product.variant_group_id)
      .single()

    if (groupError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch variant group',
        details: groupError.message
      }, { status: 500 })
    }

    // 4. Si le produit est seul dans son groupe, retourner vide
    if (!variantGroup || variantGroup.product_count <= 1) {
      return NextResponse.json({
        success: true,
        data: {
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name
          },
          variants: [],
          group: {
            name: variantGroup?.name || '',
            item_group_id: variantGroup?.id || '',
            primary_variant_id: null
          },
          total_variants: 0
        },
        message: 'Product is alone in its variant group'
      })
    }

    // 5. Récupérer tous les autres produits du même groupe (siblings)
    const selectClause = [
      'id',
      'sku',
      'name',
      'cost_price',
      'status',
      'variant_position',
      'variant_attributes',
      ...(includeDetails ? ['description', 'dimensions', 'weight'] : []),
      ...(includeImages ? ['images:product_images(id, public_url, is_primary, display_order)'] : [])
    ].join(', ')

    const { data: siblings, error: siblingsError } = await supabase
      .from('products')
      .select(selectClause)
      .eq('variant_group_id', product.variant_group_id)
      .neq('id', productId)
      .order('variant_position', { ascending: true })

    if (siblingsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch product siblings',
        details: siblingsError.message
      }, { status: 500 })
    }

    // 6. Mapper les siblings au format ProductVariant compatible
    const variants: ProductVariant[] = (siblings || []).map((sibling: any) => ({
      variant_id: sibling.id,
      variant_sku: sibling.sku,
      variant_name: sibling.name,
      variant_price: typeof sibling.cost_price === 'string'
        ? parseFloat(sibling.cost_price)
        : (sibling.cost_price || 0),
      is_primary_variant: sibling.variant_position === 1,
      group_name: variantGroup.name,
      item_group_id: variantGroup.id,
      variant_details: {
        status: sibling.status,
        ...(includeDetails && {
          description: sibling.description,
          variant_attributes: sibling.variant_attributes,
          dimensions: sibling.dimensions
        }),
        ...(includeImages && {
          images: sibling.images || []
        })
      }
    }))

    // 7. Informations du groupe
    const groupInfo = {
      name: variantGroup.name,
      item_group_id: variantGroup.id,
      primary_variant_id: variants.find(v => v.is_primary_variant)?.variant_id || null
    }

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name
        },
        variants,
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
 * Note: Cette route pourrait être dépréciée au profit de l'ajout direct via variant_groups
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    const { productId } = await params
    const body = await request.json()
    const { variant_product_ids, group_name } = body

    if (!variant_product_ids || variant_product_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Variant product IDs are required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Vérifier que le produit n'est pas déjà dans un groupe
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, variant_group_id')
      .eq('id', productId)
      .single()

    if (checkError || !existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }

    if (existingProduct.variant_group_id) {
      return NextResponse.json({
        success: false,
        error: 'Product is already part of a variant group'
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: 'POST endpoint deprecated - use /catalogue/variantes for variant group management'
    }, { status: 501 })

  } catch (error: any) {
    console.error('[API] Error creating product variant group:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
/**
 * 🔗 API Routes: Variant Group Members Management
 *
 * POST /api/variants/[groupId]/members - Add product(s) to group
 * GET /api/variants/[groupId]/members - List group members
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface AddMemberRequest {
  product_ids: string[]
  set_as_primary?: string // Product ID to set as primary
}

/**
 * GET - List all members of a variant group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params
    const supabase = createAdminClient()

    const { data: members, error } = await supabase
      .from('product_group_members')
      .select(`
        *,
        product:products(
          id,
          sku,
          name,
          price_ht,
          status,
          variant_attributes,
          images:product_images(
            id,
            public_url,
            is_primary,
            display_order
          )
        )
      `)
      .eq('group_id', groupId)
      .order('sort_order')

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch group members',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: members || [],
      total: members?.length || 0
    })

  } catch (error: any) {
    console.error('[API] Error fetching group members:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * POST - Add product(s) to variant group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params
    const body: AddMemberRequest = await request.json()
    const { product_ids, set_as_primary } = body

    if (!product_ids || product_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Product IDs are required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify group exists
    const { data: group, error: groupError } = await supabase
      .from('product_groups')
      .select('id, name, is_active')
      .eq('id', groupId)
      .single()

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Variant group not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to verify group',
        details: groupError.message
      }, { status: 500 })
    }

    if (!group.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Cannot add products to inactive group'
      }, { status: 400 })
    }

    // Verify products exist
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sku, name')
      .in('id', product_ids)

    if (productsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to verify products',
        details: productsError.message
      }, { status: 500 })
    }

    if (!products || products.length !== product_ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Some product IDs are invalid'
      }, { status: 400 })
    }

    // Check for existing memberships
    const { data: existingMembers, error: existingError } = await supabase
      .from('product_group_members')
      .select('product_id')
      .eq('group_id', groupId)
      .in('product_id', product_ids)

    if (existingError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing memberships',
        details: existingError.message
      }, { status: 500 })
    }

    const existingProductIds = existingMembers?.map(m => m.product_id) || []
    const newProductIds = product_ids.filter(id => !existingProductIds.includes(id))

    if (newProductIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All products are already members of this group'
      }, { status: 400 })
    }

    // Get current max sort order
    const { data: maxSortData, error: sortError } = await supabase
      .from('product_group_members')
      .select('sort_order')
      .eq('group_id', groupId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSort = maxSortData?.[0]?.sort_order || 0

    // Prepare member inserts
    const memberInserts = newProductIds.map((productId, index) => ({
      product_id: productId,
      group_id: groupId,
      is_primary: productId === set_as_primary,
      sort_order: maxSort + index + 1
    }))

    // Insert new members
    const { data: newMembers, error: insertError } = await supabase
      .from('product_group_members')
      .insert(memberInserts)
      .select()

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to add products to group',
        details: insertError.message
      }, { status: 500 })
    }

    // If setting a new primary, ensure only one primary exists
    if (set_as_primary) {
      await supabase
        .from('product_group_members')
        .update({ is_primary: false })
        .eq('group_id', groupId)
        .neq('product_id', set_as_primary)

      // Update group's primary_product_id
      await supabase
        .from('product_groups')
        .update({
          primary_product_id: set_as_primary,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
    }

    return NextResponse.json({
      success: true,
      data: newMembers,
      message: `${newProductIds.length} product(s) added to variant group "${group.name}"`,
      skipped: existingProductIds.length > 0 ? {
        count: existingProductIds.length,
        reason: 'Already members'
      } : undefined
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API] Error adding group members:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
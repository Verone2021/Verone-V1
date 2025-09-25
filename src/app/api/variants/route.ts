/**
 * 🔗 API Routes: Product Variants Management
 *
 * GET /api/variants - List all variant groups
 * POST /api/variants - Create new variant group
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface CreateVariantGroupRequest {
  name: string
  description?: string
  group_type?: 'variant' | 'bundle' | 'related'
  primary_product_id?: string
  product_ids: string[] // Products to add to the group
}

interface VariantGroupResponse {
  id: string
  name: string
  description?: string
  item_group_id: string
  group_type: string
  primary_product_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  member_count: number
  members?: any[]
}

/**
 * GET - List all variant groups with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const includeMembers = searchParams.get('includeMembers') === 'true'
    const groupType = searchParams.get('type')
    const isActive = searchParams.get('active')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const supabase = createAdminClient()

    // Build query
    let query = supabase
      .from('product_groups')
      .select(`
        *,
        member_count:product_group_members(count)
        ${includeMembers ? ',members:product_group_members(*, product:products(*))' : ''}
      `)

    // Apply filters
    if (groupType) {
      query = query.eq('group_type', groupType)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    query = query
      .order('updated_at', { ascending: false })
      .limit(limit)

    const { data: groups, error } = await query

    if (error) {
      console.error('[API] Error fetching variant groups:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch variant groups',
        details: error.message
      }, { status: 500 })
    }

    // Format response
    const formattedGroups: VariantGroupResponse[] = groups?.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      item_group_id: group.item_group_id,
      group_type: group.group_type,
      primary_product_id: group.primary_product_id,
      is_active: group.is_active,
      created_at: group.created_at,
      updated_at: group.updated_at,
      member_count: group.member_count?.[0]?.count || 0,
      ...(includeMembers && { members: group.members || [] })
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedGroups,
      total: formattedGroups.length
    })

  } catch (error: any) {
    console.error('[API] Variant groups listing failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * POST - Create new variant group
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateVariantGroupRequest = await request.json()
    const { name, description, group_type = 'variant', primary_product_id, product_ids } = body

    // Validation
    if (!name || !product_ids || product_ids.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Name and at least 2 product IDs are required'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify all products exist
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

    // Generate unique item_group_id
    const { data: itemGroupIdResult, error: itemGroupIdError } = await supabase
      .rpc('generate_item_group_id')

    if (itemGroupIdError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate item group ID',
        details: itemGroupIdError.message
      }, { status: 500 })
    }

    const item_group_id = itemGroupIdResult

    // Create variant group
    const { data: newGroup, error: groupError } = await supabase
      .from('product_groups')
      .insert({
        name,
        description,
        item_group_id,
        group_type,
        primary_product_id: primary_product_id || product_ids[0], // Default to first product
        is_active: true
      })
      .select()
      .single()

    if (groupError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create variant group',
        details: groupError.message
      }, { status: 500 })
    }

    // Add products to the group
    const memberInserts = product_ids.map((productId, index) => ({
      product_id: productId,
      group_id: newGroup.id,
      is_primary: productId === (primary_product_id || product_ids[0]),
      sort_order: index
    }))

    const { error: membersError } = await supabase
      .from('product_group_members')
      .insert(memberInserts)

    if (membersError) {
      // Rollback: delete the group
      await supabase.from('product_groups').delete().eq('id', newGroup.id)

      return NextResponse.json({
        success: false,
        error: 'Failed to add products to group',
        details: membersError.message
      }, { status: 500 })
    }

    // Return created group with members
    const { data: createdGroup, error: fetchError } = await supabase
      .from('product_groups')
      .select(`
        *,
        members:product_group_members(*, product:products(*))
      `)
      .eq('id', newGroup.id)
      .single()

    if (fetchError) {
      console.error('[API] Error fetching created group:', fetchError)
    }

    return NextResponse.json({
      success: true,
      data: createdGroup || newGroup,
      message: `Variant group "${name}" created with ${product_ids.length} products`
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API] Variant group creation failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
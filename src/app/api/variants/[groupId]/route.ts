/**
 * 🔗 API Routes: Individual Variant Group Management
 *
 * GET /api/variants/[groupId] - Get specific group details
 * PUT /api/variants/[groupId] - Update group
 * DELETE /api/variants/[groupId] - Delete group
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface UpdateVariantGroupRequest {
  name?: string
  description?: string
  group_type?: 'variant' | 'bundle' | 'related'
  primary_product_id?: string
  is_active?: boolean
}

/**
 * GET - Get specific variant group with members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params
    const supabase = createAdminClient()

    const { data: group, error } = await supabase
      .from('product_groups')
      .select(`
        *,
        members:product_group_members(
          *,
          product:products(
            id,
            sku,
            name,
            price_ht,
            status,
            images:product_images(
              id,
              public_url,
              is_primary,
              display_order
            )
          )
        )
      `)
      .eq('id', groupId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Variant group not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch variant group',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: group
    })

  } catch (error: any) {
    console.error('[API] Error fetching variant group:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * PUT - Update variant group
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params
    const body: UpdateVariantGroupRequest = await request.json()

    const supabase = createAdminClient()

    // Check if group exists
    const { data: existingGroup, error: checkError } = await supabase
      .from('product_groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Variant group not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to check variant group',
        details: checkError.message
      }, { status: 500 })
    }

    // If changing primary product, verify it's a member of the group
    if (body.primary_product_id) {
      const { data: memberCheck, error: memberError } = await supabase
        .from('product_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('product_id', body.primary_product_id)
        .single()

      if (memberError || !memberCheck) {
        return NextResponse.json({
          success: false,
          error: 'Primary product must be a member of the group'
        }, { status: 400 })
      }
    }

    // Update the group
    const { data: updatedGroup, error: updateError } = await supabase
      .from('product_groups')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update variant group',
        details: updateError.message
      }, { status: 500 })
    }

    // If primary product changed, update member is_primary flags
    if (body.primary_product_id) {
      // Set all to false first
      await supabase
        .from('product_group_members')
        .update({ is_primary: false })
        .eq('group_id', groupId)

      // Set new primary to true
      await supabase
        .from('product_group_members')
        .update({ is_primary: true })
        .eq('group_id', groupId)
        .eq('product_id', body.primary_product_id)
    }

    return NextResponse.json({
      success: true,
      data: updatedGroup,
      message: `Variant group "${updatedGroup.name}" updated successfully`
    })

  } catch (error: any) {
    console.error('[API] Error updating variant group:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE - Delete variant group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params
    const supabase = createAdminClient()

    // Check if group exists and get member count
    const { data: groupInfo, error: checkError } = await supabase
      .from('product_groups')
      .select(`
        id,
        name,
        members:product_group_members(count)
      `)
      .eq('id', groupId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Variant group not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to check variant group',
        details: checkError.message
      }, { status: 500 })
    }

    const memberCount = groupInfo.members?.[0]?.count || 0

    // Delete the group (CASCADE will remove members automatically)
    const { error: deleteError } = await supabase
      .from('product_groups')
      .delete()
      .eq('id', groupId)

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete variant group',
        details: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Variant group "${groupInfo.name}" deleted successfully (${memberCount} products released)`
    })

  } catch (error: any) {
    console.error('[API] Error deleting variant group:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
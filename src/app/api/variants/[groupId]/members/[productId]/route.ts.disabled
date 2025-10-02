/**
 * 🔗 API Routes: Individual Group Member Management
 *
 * DELETE /api/variants/[groupId]/members/[productId] - Remove product from group
 * PUT /api/variants/[groupId]/members/[productId] - Update member settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface UpdateMemberRequest {
  is_primary?: boolean
  sort_order?: number
}

/**
 * DELETE - Remove product from variant group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; productId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId, productId } = await params
    const supabase = createAdminClient()

    // Check if membership exists
    const { data: membership, error: membershipError } = await supabase
      .from('product_group_members')
      .select(`
        *,
        group:product_groups(id, name, primary_product_id),
        product:products(id, sku, name)
      `)
      .eq('group_id', groupId)
      .eq('product_id', productId)
      .single()

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Product is not a member of this group'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to check membership',
        details: membershipError.message
      }, { status: 500 })
    }

    // Check how many members remain in the group
    const { data: memberCount, error: countError } = await supabase
      .from('product_group_members')
      .select('id', { count: 'exact' })
      .eq('group_id', groupId)

    if (countError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check group member count',
        details: countError.message
      }, { status: 500 })
    }

    // Prevent removing if it would leave less than 2 members
    if ((memberCount?.length || 0) <= 2) {
      return NextResponse.json({
        success: false,
        error: 'Cannot remove product: variant groups must have at least 2 members'
      }, { status: 400 })
    }

    // If removing the primary product, reassign primary to another member
    let newPrimaryAssigned = false
    if (membership.is_primary) {
      const { data: otherMembers, error: otherMembersError } = await supabase
        .from('product_group_members')
        .select('product_id')
        .eq('group_id', groupId)
        .neq('product_id', productId)
        .limit(1)

      if (otherMembersError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to find replacement primary product',
          details: otherMembersError.message
        }, { status: 500 })
      }

      if (otherMembers && otherMembers.length > 0) {
        const newPrimaryId = otherMembers[0].product_id

        // Update the new primary member
        await supabase
          .from('product_group_members')
          .update({ is_primary: true })
          .eq('group_id', groupId)
          .eq('product_id', newPrimaryId)

        // Update group's primary_product_id
        await supabase
          .from('product_groups')
          .update({
            primary_product_id: newPrimaryId,
            updated_at: new Date().toISOString()
          })
          .eq('id', groupId)

        newPrimaryAssigned = true
      }
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('product_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('product_id', productId)

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to remove product from group',
        details: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Product "${membership.product.sku}" removed from variant group "${membership.group.name}"`,
      newPrimaryAssigned
    })

  } catch (error: any) {
    console.error('[API] Error removing group member:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * PUT - Update member settings (primary status, sort order)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; productId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId, productId } = await params
    const body: UpdateMemberRequest = await request.json()
    const supabase = createAdminClient()

    // Check if membership exists
    const { data: membership, error: membershipError } = await supabase
      .from('product_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('product_id', productId)
      .single()

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Product is not a member of this group'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to check membership',
        details: membershipError.message
      }, { status: 500 })
    }

    // If setting as primary, unset other primaries first
    if (body.is_primary === true) {
      await supabase
        .from('product_group_members')
        .update({ is_primary: false })
        .eq('group_id', groupId)
        .neq('product_id', productId)

      // Update group's primary_product_id
      await supabase
        .from('product_groups')
        .update({
          primary_product_id: productId,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
    }

    // Update the member
    const { data: updatedMember, error: updateError } = await supabase
      .from('product_group_members')
      .update(body)
      .eq('group_id', groupId)
      .eq('product_id', productId)
      .select(`
        *,
        product:products(id, sku, name)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update member settings',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: 'Member settings updated successfully'
    })

  } catch (error: any) {
    console.error('[API] Error updating group member:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
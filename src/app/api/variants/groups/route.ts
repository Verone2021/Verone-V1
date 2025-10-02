import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateVariantGroupData } from '@/types/variant-groups'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body: CreateVariantGroupData = await request.json()

    const { name, subcategory_id, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, initial_product_id } = body

    if (!name || !subcategory_id) {
      return NextResponse.json(
        { error: 'Nom et sous-catégorie obligatoires' },
        { status: 400 }
      )
    }

    const { data: group, error: groupError } = await supabase
      .from('variant_groups')
      .insert([{
        name,
        subcategory_id,
        dimensions_length: dimensions_length || null,
        dimensions_width: dimensions_width || null,
        dimensions_height: dimensions_height || null,
        dimensions_unit: dimensions_unit || 'cm'
      }])
      .select()
      .single()

    if (groupError) {
      return NextResponse.json(
        { error: groupError.message },
        { status: 400 }
      )
    }

    if (initial_product_id) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          variant_group_id: group.id,
          variant_position: 1
        })
        .eq('id', initial_product_id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: group
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
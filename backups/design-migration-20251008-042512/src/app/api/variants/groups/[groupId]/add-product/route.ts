import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AddProductToGroupData } from '@/types/variant-groups'

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = await createServerClient()
    const body: AddProductToGroupData = await request.json()
    const groupId = params.groupId

    const { product_id, variant_attributes } = body

    if (!product_id) {
      return NextResponse.json(
        { error: 'ID produit requis' },
        { status: 400 }
      )
    }

    if (!variant_attributes?.color && !variant_attributes?.material) {
      return NextResponse.json(
        { error: 'Au moins couleur ou matière requis' },
        { status: 400 }
      )
    }

    const { data: group, error: groupError } = await supabase
      .from('variant_groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Groupe non trouvé' },
        { status: 404 }
      )
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const { data: existingProducts } = await supabase
      .from('products')
      .select('variant_position')
      .eq('variant_group_id', groupId)
      .order('variant_position', { ascending: false })
      .limit(1)

    const nextPosition = existingProducts && existingProducts.length > 0
      ? existingProducts[0].variant_position + 1
      : 1

    const colorPart = variant_attributes.color || ''
    const materialPart = variant_attributes.material || ''
    const suffix = [colorPart, materialPart].filter(Boolean).join(' - ')
    const newName = suffix ? `${group.name} - ${suffix}` : group.name

    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: newName,
        subcategory_id: group.subcategory_id,
        dimensions_length: group.dimensions_length,
        dimensions_width: group.dimensions_width,
        dimensions_height: group.dimensions_height,
        dimensions_unit: group.dimensions_unit,
        variant_group_id: groupId,
        variant_position: nextPosition,
        variant_attributes
      })
      .eq('id', product_id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        product_id,
        new_name: newName,
        variant_position: nextPosition,
        message: 'Produit ajouté au groupe et modifié avec succès'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
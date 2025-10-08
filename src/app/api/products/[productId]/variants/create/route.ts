import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const supabase = createClient()
    const resolvedParams = await params
    const { productId } = resolvedParams
    const body = await request.json()

    const { variant_attributes, additional_note } = body

    if (!variant_attributes || Object.keys(variant_attributes).length === 0) {
      return NextResponse.json(
        { error: 'Les attributs de variante (couleur ou matière) sont requis' },
        { status: 400 }
      )
    }

    const { data: parentProduct, error: fetchError } = await supabase
      .from('products')
      .select(`
        *,
        supplier:organisations!supplier_id(id, name)
      `)
      .eq('id', productId)
      .single()

    if (fetchError || !parentProduct) {
      console.error('Erreur récupération produit parent:', fetchError)
      return NextResponse.json(
        { error: 'Produit parent introuvable' },
        { status: 404 }
      )
    }

    let variantGroupId = parentProduct.variant_group_id

    if (!variantGroupId) {
      const { data: { user } } = await supabase.auth.getUser()
      const newGroupId = crypto.randomUUID()

      const { error: updateError } = await supabase
        .from('products')
        .update({
          variant_group_id: newGroupId,
          is_variant_parent: true,
          variant_position: 1
        })
        .eq('id', productId)

      if (updateError) {
        console.error('Erreur création groupe variantes:', updateError)
        return NextResponse.json(
          { error: 'Erreur lors de la création du groupe de variantes' },
          { status: 500 }
        )
      }

      variantGroupId = newGroupId
    }

    const { data: existingVariants } = await supabase
      .from('products')
      .select('variant_position')
      .eq('variant_group_id', variantGroupId)
      .order('variant_position', { ascending: false })
      .limit(1)

    const nextPosition = existingVariants && existingVariants.length > 0
      ? (existingVariants[0].variant_position || 0) + 1
      : 2

    const variantSuffix = Object.values(variant_attributes).filter(Boolean).join(' - ')
    const baseName = parentProduct.name.split(' - ')[0]
    const variantName = `${baseName} - ${variantSuffix}`

    const variantData = {
      name: variantName,
      sku: `${parentProduct.sku}-V${nextPosition}`,
      supplier_id: parentProduct.supplier_id,
      dimensions_length: parentProduct.dimensions_length,
      dimensions_width: parentProduct.dimensions_width,
      dimensions_height: parentProduct.dimensions_height,
      dimensions_unit: parentProduct.dimensions_unit,
      weight: parentProduct.weight,
      weight_unit: parentProduct.weight_unit,
      base_cost: parentProduct.base_cost,
      selling_price: parentProduct.selling_price,
      description: additional_note || parentProduct.description,
      technical_description: parentProduct.technical_description,
      category_id: parentProduct.category_id,
      subcategory_id: parentProduct.subcategory_id,
      brand: parentProduct.brand,
      gtin: null,
      condition: parentProduct.condition,
      variant_group_id: variantGroupId,
      is_variant_parent: false,
      variant_position: nextPosition,
      variant_attributes: variant_attributes,
      status: parentProduct.status || 'draft'
    }

    const { data: newVariant, error: insertError } = await supabase
      .from('products')
      .insert(variantData)
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création variante:', insertError)
      return NextResponse.json(
        { error: `Erreur lors de la création de la variante: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        variant: newVariant,
        variant_group_id: variantGroupId,
        message: 'Variante créée avec succès'
      }
    })

  } catch (error) {
    console.error('Erreur API création variante:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
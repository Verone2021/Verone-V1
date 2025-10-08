import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      product_id,
      consultation_id,
      proposed_price,
      notes,
      is_primary_proposal = false,
      quantity = 1,
      is_free = false
    } = body

    // Validation des champs requis
    if (!product_id || !consultation_id) {
      return NextResponse.json(
        { error: 'Product ID et Consultation ID sont requis' },
        { status: 400 }
      )
    }

    // Validation des nouveaux champs
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'La quantité doit être supérieure à 0' },
        { status: 400 }
      )
    }

    if (proposed_price && proposed_price < 0) {
      return NextResponse.json(
        { error: 'Le prix ne peut pas être négatif' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe et est éligible
    const { data: product, error: productError} = await supabase
      .from('products')
      .select('id, name, status, creation_mode, assigned_client_id, archived_at')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le produit n'est pas archivé
    if (product.archived_at) {
      return NextResponse.json(
        { error: 'Les produits archivés ne peuvent pas être associés aux consultations' },
        { status: 400 }
      )
    }

    // Vérifier l'éligibilité selon les nouvelles règles business
    const isEligible =
      // Produits catalogue
      ((product.creation_mode === 'complete' || !product.creation_mode) &&
       ['in_stock', 'out_of_stock', 'preorder', 'coming_soon'].includes(product.status)) ||
      // Produits sourcing
      (product.creation_mode === 'sourcing' &&
       ['sourcing', 'pret_a_commander', 'echantillon_a_commander', 'in_stock', 'out_of_stock'].includes(product.status))

    if (!isEligible) {
      return NextResponse.json(
        { error: 'Ce produit n\'est pas éligible pour les consultations selon son statut actuel' },
        { status: 400 }
      )
    }

    // Vérifier que la consultation existe
    const { data: consultation, error: consultationError } = await supabase
      .from('client_consultations')
      .select('id, organisation_name, status')
      .eq('id', consultation_id)
      .single()

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: 'Consultation non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a déjà une proposition principale pour cette consultation
    if (is_primary_proposal) {
      const { data: existingPrimary } = await supabase
        .from('consultation_products')
        .select('id')
        .eq('consultation_id', consultation_id)
        .eq('is_primary_proposal', true)
        .single()

      if (existingPrimary) {
        return NextResponse.json(
          { error: 'Il y a déjà une proposition principale pour cette consultation' },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'association existe déjà
    const { data: existingAssociation } = await supabase
      .from('consultation_products')
      .select('id')
      .eq('consultation_id', consultation_id)
      .eq('product_id', product_id)
      .single()

    if (existingAssociation) {
      return NextResponse.json(
        { error: 'Cette association existe déjà' },
        { status: 409 }
      )
    }

    // Créer l'association
    const { data: association, error: associationError } = await supabase
      .from('consultation_products')
      .insert({
        consultation_id,
        product_id,
        proposed_price: proposed_price ? parseFloat(proposed_price) : null,
        notes: notes || null,
        is_primary_proposal,
        quantity,
        is_free
      })
      .select(`
        id,
        consultation_id,
        product_id,
        proposed_price,
        notes,
        is_primary_proposal,
        quantity,
        is_free,
        created_at,
        created_by,
        product:products(id, name, sku),
        consultation:client_consultations(id, organisation_name)
      `)
      .single()

    if (associationError) {
      console.error('Erreur création association:', associationError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'association' },
        { status: 500 }
      )
    }

    // Mettre à jour la consultation si nécessaire
    if (consultation.status === 'en_attente') {
      await supabase
        .from('client_consultations')
        .update({ status: 'en_cours' })
        .eq('id', consultation_id)
    }

    return NextResponse.json({
      success: true,
      data: association,
      message: `Association créée entre ${product.name} et ${consultation.organisation_name}`
    })

  } catch (error) {
    console.error('Erreur API associations:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    const consultationId = url.searchParams.get('consultation_id')
    const productId = url.searchParams.get('product_id')

    let query = supabase
      .from('consultation_products')
      .select(`
        id,
        consultation_id,
        product_id,
        proposed_price,
        notes,
        is_primary_proposal,
        created_at,
        created_by,
        product:products(id, name, sku, supplier_name),
        consultation:client_consultations(id, organisation_name, status)
      `)

    if (consultationId) {
      query = query.eq('consultation_id', consultationId)
    }

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: associations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération associations:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des associations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: associations || []
    })

  } catch (error) {
    console.error('Erreur API associations GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
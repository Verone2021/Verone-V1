import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Utiliser le service role pour contourner RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ACCESS_TOKEN!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // D'abord récupérer l'organisation_id de la propriété
    const { data: propriete, error: proprieteError } = await supabase
      .from('proprietes')
      .select('organisation_id')
      .eq('id', data.propriete_id)
      .single()

    if (proprieteError || !propriete) {
      console.error('❌ Erreur récupération propriété:', proprieteError)
      return NextResponse.json({ 
        success: false, 
        error: 'Propriété introuvable',
        details: proprieteError
      }, { status: 404 })
    }

    // Créer un contrat de test avec les champs de base uniquement
    const contratData = {
      propriete_id: data.propriete_id,
      unite_id: null,
      type_contrat: data.type_contrat,
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      commission_pourcentage: data.commission_pourcentage,
      // Organisation récupérée de la propriété
      organisation_id: propriete.organisation_id,
      // Champs obligatoires avec valeurs par défaut de la migration 040
      date_emission: new Date().toISOString().split('T')[0],
      meuble: data.meuble || true,
      autorisation_sous_location: data.autorisation_sous_location !== false,
      usage_proprietaire_jours_max: data.usage_proprietaire_jours_max || 60
    }

    console.log('🔄 Insertion contrat:', contratData)

    const { data: insertedContrat, error } = await supabase
      .from('contrats')
      .insert(contratData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur insertion:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log('✅ Contrat créé:', insertedContrat)

    return NextResponse.json({ 
      success: true, 
      data: insertedContrat,
      message: `Contrat ${data.type_contrat} créé pour propriété ${data.propriete_id}`
    })

  } catch (error) {
    console.error('❌ Erreur API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
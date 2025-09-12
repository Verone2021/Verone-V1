import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { contratMinimalSchema } from '@/lib/validations/contrats-minimal'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les données de la requête
    const body = await request.json()
    
    // Valider les données
    const validationResult = contratMinimalSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const data = validationResult.data

    // Vérifier l'accès à l'organisation
    const { data: orgAccess } = await supabase
      .from('user_organisation_assignments')
      .select('id')
      .eq('user_id', user.id)
      .eq('organisation_id', data.organisation_id)
      .single()

    if (!orgAccess) {
      return NextResponse.json({ 
        error: 'Accès non autorisé à cette organisation' 
      }, { status: 403 })
    }

    // Ajouter l'ID de l'utilisateur
    const contratData = {
      ...data,
      created_by: user.id
    }

    // Insérer le contrat
    const { data: contrat, error } = await supabase
      .from('contrats')
      .insert(contratData)
      .select()
      .single()

    if (error) {
      console.error('Erreur création contrat:', error)
      return NextResponse.json({ 
        error: 'Erreur lors de la création du contrat',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: contrat 
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur API contrats:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur interne' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const organisationId = searchParams.get('organisation_id')

    if (!organisationId) {
      return NextResponse.json({ 
        error: 'ID organisation requis' 
      }, { status: 400 })
    }

    // Vérifier l'accès à l'organisation
    const { data: orgAccess } = await supabase
      .from('user_organisation_assignments')
      .select('id')
      .eq('user_id', user.id)
      .eq('organisation_id', organisationId)
      .single()

    if (!orgAccess) {
      return NextResponse.json({ 
        error: 'Accès non autorisé à cette organisation' 
      }, { status: 403 })
    }

    // Récupérer les contrats avec informations enrichies
    const { data: contrats, error } = await supabase
      .from('contrats_with_org_v')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération contrats:', error)
      return NextResponse.json({ 
        error: 'Erreur lors de la récupération des contrats',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: contrats || [] 
    })

  } catch (error) {
    console.error('Erreur API contrats GET:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur interne' 
    }, { status: 500 })
  }
}
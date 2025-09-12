import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Utiliser le service role
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
    
    console.log('🚀 Création de la view temporaire...')
    
    // SQL pour créer la view manquante
    const createViewSQL = `
      -- Supprimer la vue si elle existe déjà
      DROP VIEW IF EXISTS public.v_proprietes_avec_contrats_actifs;
      
      -- Créer la vue de base avec les propriétés existantes
      CREATE VIEW public.v_proprietes_avec_contrats_actifs AS
      SELECT DISTINCT
          p.id as propriete_id,
          p.nom as propriete_nom,
          p.type_propriete as type_propriete,
          p.adresse_ligne1 as adresse,
          p.ville,
          p.code_postal,
          p.pays,
          p.superficie_m2,
          p.nb_pieces,
          p.a_unites,
          p.organisation_id,
          o.nom as organisation_nom,
          
          -- Données simulées pour contrats (temporaire)
          'actif' as statut_contrat,
          'fixe' as type_contrat,
          15.0 as commission_pourcentage,
          CURRENT_DATE as date_debut_contrat,
          (CURRENT_DATE + interval '1 year')::date as date_fin_contrat,
          800.00 as loyer_mensuel_ht,
          
          -- Métadonnées
          p.created_at,
          p.updated_at
          
      FROM public.proprietes p
      LEFT JOIN public.organisations o ON o.id = p.organisation_id
      WHERE p.is_active = true
        AND p.deleted_at IS NULL;
        
      -- Permissions sur la vue
      GRANT SELECT ON public.v_proprietes_avec_contrats_actifs TO authenticated;
      GRANT SELECT ON public.v_proprietes_avec_contrats_actifs TO service_role;
    `
    
    // Exécuter le SQL
    const { error: sqlError } = await supabase.rpc('exec', { 
      sql: createViewSQL 
    })
    
    if (sqlError) {
      console.error('❌ Erreur création view:', sqlError)
    }
    
    // Tester la view créée
    const { data: testData, error: testError } = await supabase
      .from('v_proprietes_avec_contrats_actifs')
      .select('propriete_id, propriete_nom, statut_contrat')
      .limit(5)
    
    if (testError) {
      console.error('❌ Erreur test view:', testError)
      return NextResponse.json({ 
        success: false, 
        error: 'View creation failed', 
        details: testError 
      }, { status: 500 })
    }
    
    console.log('✅ View créée avec succès!')
    console.log(`📊 Trouvé ${testData.length} propriétés:`)
    testData.forEach(prop => {
      console.log(`  - ${prop.propriete_nom} (${prop.propriete_id})`)
    })
    
    return NextResponse.json({
      success: true,
      message: `View créée avec ${testData.length} propriétés`,
      data: testData
    })
    
  } catch (error) {
    console.error('❌ Erreur API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
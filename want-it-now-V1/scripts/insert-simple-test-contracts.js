#!/usr/bin/env node

/**
 * Script simplifié pour créer 2 contrats de test
 * Utilise uniquement les colonnes de base existantes
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = 'https://ptqwayandsfhciitjnhb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSimpleTestContracts() {
  console.log('🚀 Insertion de contrats de test simplifiés...')
  
  try {
    // 1. Récupérer une organisation existante
    console.log('🏢 Recherche organisation existante...')
    const { data: orgs, error: orgError } = await supabase
      .from('organisations')
      .select('id')
      .limit(1)

    if (orgError || !orgs || orgs.length === 0) {
      console.log('❌ Aucune organisation trouvée, création requise')
      return
    }

    const organisationId = orgs[0].id
    console.log(`✅ Organisation trouvée: ${organisationId}`)

    // 2. Récupérer des propriétés existantes
    console.log('🏠 Recherche propriétés existantes...')
    const { data: props, error: propsError } = await supabase
      .from('proprietes')
      .select('id, nom')
      .eq('organisation_id', organisationId)
      .limit(2)

    if (propsError || !props || props.length < 2) {
      console.log('❌ Pas assez de propriétés existantes')
      console.log(`Trouvées: ${props?.length || 0} propriétés`)
      return
    }

    console.log(`✅ ${props.length} propriétés trouvées`)
    props.forEach(p => console.log(`  - ${p.nom} (${p.id})`))

    // 3. Créer 2 contrats avec colonnes de base uniquement
    console.log('📑 Création contrats...')

    // Contrat 1: Fixe
    const contrat1 = {
      id: crypto.randomUUID(),
      organisation_id: organisationId,
      propriete_id: props[0].id,
      unite_id: null,
      type_contrat: 'fixe',
      date_emission: '2025-01-15',
      date_debut: '2025-03-01', 
      date_fin: '2026-02-28',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 12
    }

    const { data: contrat1Data, error: contrat1Error } = await supabase
      .from('contrats')
      .insert(contrat1)
      .select()

    if (contrat1Error) {
      console.log('❌ Erreur contrat 1:', contrat1Error.message)
    } else {
      console.log('✅ Contrat fixe créé')
    }

    // Contrat 2: Variable
    const contrat2 = {
      id: crypto.randomUUID(),
      organisation_id: organisationId,
      propriete_id: props[1].id,
      unite_id: null,
      type_contrat: 'variable',
      date_emission: '2025-01-10',
      date_debut: '2025-02-01',
      date_fin: '2026-01-31', 
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 10
    }

    const { data: contrat2Data, error: contrat2Error } = await supabase
      .from('contrats')
      .insert(contrat2)
      .select()

    if (contrat2Error) {
      console.log('❌ Erreur contrat 2:', contrat2Error.message)
    } else {
      console.log('✅ Contrat variable créé')
    }

    // 4. Vérification finale
    console.log('\n📊 Vérification...')
    const { data: contratsCount } = await supabase
      .from('contrats')
      .select('*', { count: 'exact' })

    console.log(`✅ ${contratsCount?.length || 0} contrat(s) total en base`)
    
    if (contratsCount && contratsCount.length > 0) {
      console.log('\n📋 Contrats existants:')
      contratsCount.forEach(c => {
        console.log(`  - ${c.type_contrat.toUpperCase()} | ${c.date_debut} → ${c.date_fin}`)
      })
    }

    console.log('\n🎉 Contrats de test créés avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
  }
}

// Exécution
createSimpleTestContracts().then(() => {
  process.exit(0)
}).catch(console.error)
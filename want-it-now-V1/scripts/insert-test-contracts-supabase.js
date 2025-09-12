#!/usr/bin/env node

/**
 * Script d'insertion des contrats de test via Supabase JS client
 * Utilise la service role key pour bypasser RLS
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration avec service role key
const supabaseUrl = 'https://ptqwayandsfhciitjnhb.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function insertTestData() {
  console.log('🚀 Insertion des données de test pour contrats...\n')
  
  try {
    // 1. Vérifier organisation existante
    console.log('🏢 1. Vérification organisation existante...')
    const { data: existingOrgs, error: orgsError } = await supabase
      .from('organisations')
      .select('id, nom')
      .limit(1)

    if (orgsError) {
      console.log('❌ Erreur lecture organisations:', orgsError.message)
      return
    }

    if (!existingOrgs || existingOrgs.length === 0) {
      console.log('❌ Aucune organisation trouvée. Créez d\'abord une organisation.')
      return
    }

    const organisationId = existingOrgs[0].id
    console.log('✅ Organisation trouvée:', existingOrgs[0].nom, '(ID:', organisationId, ')')

    // 2. Propriétés de test avec UUID fixes
    console.log('\n🏠 2. Insertion propriétés...')
    
    const propertyId1 = '550e8400-e29b-41d4-a716-446655440001'
    const propertyId2 = '550e8400-e29b-41d4-a716-446655440002'
    
    // Villa Nice
    const { data: prop1Data, error: prop1Error } = await supabase
      .from('proprietes')
      .upsert({
        id: propertyId1,
        organisation_id: organisationId,
        nom: 'Villa Les Palmiers Nice',
        type: 'maison',
        adresse: '15 Avenue des Palmiers',
        code_postal: '06000',
        ville: 'Nice',
        pays: 'FR',
        a_unites: false,
        is_active: true
      }, {
        onConflict: 'id'
      })

    if (prop1Error) {
      console.log('⚠️  Villa Nice:', prop1Error.message)
    } else {
      console.log('✅ Villa Nice créée')
    }

    // Studio Paris  
    const { data: prop2Data, error: prop2Error } = await supabase
      .from('proprietes')
      .upsert({
        id: propertyId2,
        organisation_id: organisationId,
        nom: 'Studio Trocadéro Paris',
        type: 'appartement',
        adresse: '42 Avenue Kléber',
        code_postal: '75016',
        ville: 'Paris',
        pays: 'FR',
        a_unites: false,
        is_active: true
      }, {
        onConflict: 'id'
      })

    if (prop2Error) {
      console.log('⚠️  Studio Paris:', prop2Error.message)
    } else {
      console.log('✅ Studio Paris créé')
    }

    // 3. Contrats directs - approche simplifiée sans créer proprietaires
    console.log('\n📑 3. Insertion contrats directs...')
    
    const contractId1 = '550e8400-e29b-41d4-a716-446655440020'
    const contractId2 = '550e8400-e29b-41d4-a716-446655440021'

    // Contrat fixe - Villa Nice (colonnes minimales)
    const { data: contract1Data, error: contract1Error } = await supabase
      .from('contrats')
      .upsert({
        id: contractId1,
        organisation_id: organisationId,
        propriete_id: propertyId1,
        unite_id: null,
        type_contrat: 'fixe',
        date_emission: '2025-01-15',
        date_debut: '2025-03-01',
        date_fin: '2026-02-28'
      }, {
        onConflict: 'id'
      })

    if (contract1Error) {
      console.log('⚠️  Contrat fixe:', contract1Error.message)
    } else {
      console.log('✅ Contrat fixe Villa Nice créé')
    }

    // Contrat variable - Studio Paris (colonnes minimales)  
    const { data: contract2Data, error: contract2Error } = await supabase
      .from('contrats')
      .upsert({
        id: contractId2,
        organisation_id: organisationId,
        propriete_id: propertyId2,
        unite_id: null,
        type_contrat: 'variable',
        date_emission: '2025-01-10',
        date_debut: '2025-02-01',
        date_fin: '2026-01-31'
      }, {
        onConflict: 'id'
      })

    if (contract2Error) {
      console.log('⚠️  Contrat variable:', contract2Error.message)
    } else {
      console.log('✅ Contrat variable Studio Paris créé')
    }

    // 4. Vérification finale
    console.log('\n📊 4. Vérification des données...')
    
    const { data: contractsData, error: contractsError } = await supabase
      .from('contrats')
      .select(`
        id,
        type_contrat,
        proprietes!inner (
          nom,
          ville
        )
      `)
      .order('type_contrat')

    if (contractsError) {
      console.log('⚠️  Erreur vérification:', contractsError.message)
    } else {
      console.log('\n✅ DONNÉES CRÉÉES AVEC SUCCÈS:')
      console.log(`📑 ${contractsData?.length || 0} contrat(s) en base:`)
      contractsData?.forEach(contract => {
        const propNom = contract.proprietes?.nom || 'Propriété inconnue'
        const propVille = contract.proprietes?.ville || ''
        console.log(`   • ${contract.type_contrat.toUpperCase()}: ${propNom} (${propVille})`)
      })
    }

    console.log('\n🎉 INSERTION TERMINÉE !')
    console.log('\n🔗 Vous pouvez maintenant vérifier:')
    console.log('   • http://localhost:3000/contrats - Doit afficher 2 contrats')
    console.log('   • http://localhost:3000/reservations - Doit afficher 2 propriétés avec contrats')

  } catch (error) {
    console.error('❌ Erreur globale:', error)
    process.exit(1)
  }
}

// Exécution
insertTestData().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
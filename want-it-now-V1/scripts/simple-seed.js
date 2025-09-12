#!/usr/bin/env node

/**
 * Script simple pour créer les données de test rapidement
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpwkrqzqvjtzagudxxnk.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestData() {
  console.log('🚀 Création données test simple...\n')

  try {
    // 1. Récupérer l'organisation existante
    console.log('📋 1. Récupération organisation...')
    const { data: organisations } = await supabase
      .from('organisations')
      .select('id, nom')
      .eq('pays', 'FR')
      .limit(1)

    if (!organisations || organisations.length === 0) {
      console.error('❌ Aucune organisation trouvée')
      return
    }

    const orgId = organisations[0].id
    console.log(`✅ Organisation trouvée: ${organisations[0].nom} (${orgId})`)

    // 2. Créer propriétés simples
    console.log('\n🏠 2. Création propriétés...')
    
    const proprietes = [
      {
        id: 'prop_villa_nice_test',
        organisation_id: orgId,
        nom: 'Villa Test Nice',
        type: 'maison',
        statut: 'disponible',
        adresse_ligne1: '15 Avenue Test',
        code_postal: '06000',
        ville: 'Nice',
        pays: 'FR',
        surface_habitable: 180,
        nombre_pieces: 6
      },
      {
        id: 'prop_appart_paris_test',
        organisation_id: orgId,
        nom: 'Appartement Test Paris',
        type: 'appartement',
        statut: 'disponible',
        adresse_ligne1: '42 Rue Test',
        code_postal: '75016',
        ville: 'Paris',
        pays: 'FR',
        surface_habitable: 85,
        nombre_pieces: 3
      }
    ]

    for (const propriete of proprietes) {
      const { error } = await supabase
        .from('proprietes')
        .upsert(propriete, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur propriété ${propriete.nom}:`, error.message)
      } else {
        console.log(`✅ Propriété: ${propriete.nom}`)
      }
    }

    // 3. Créer contrats simples
    console.log('\n📜 3. Création contrats...')
    
    const contrats = [
      {
        id: 'contrat_test_villa',
        propriete_id: 'prop_villa_nice_test',
        unite_id: null,
        type_contrat: 'fixe',
        date_debut: '2025-01-01',
        date_fin: '2025-12-31',
        statut: 'actif',
        commission_pourcentage: 12,
        loyer_mensuel_ht: 2000,
        duree_contrat_1an: true
      },
      {
        id: 'contrat_test_appart',
        propriete_id: 'prop_appart_paris_test',
        unite_id: null,
        type_contrat: 'variable',
        date_debut: '2025-01-01',
        date_fin: '2025-12-31',
        statut: 'actif',
        commission_pourcentage: 10,
        estimation_revenus_mensuels: 3000,
        duree_contrat_1an: true
      }
    ]

    for (const contrat of contrats) {
      const { error } = await supabase
        .from('contrats')
        .upsert(contrat, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur contrat:`, error.message)
        console.log('Détail erreur:', error)
      } else {
        console.log(`✅ Contrat ${contrat.type_contrat}: ${contrat.commission_pourcentage}%`)
      }
    }

    // 4. Vérification
    console.log('\n🔍 4. Vérification...')
    
    const { data: contratsActifs } = await supabase
      .from('contrats')
      .select('*')
      .eq('statut', 'actif')
    
    console.log(`📊 Contrats actifs: ${contratsActifs?.length || 0}`)

    const { data: proprietesTest } = await supabase
      .from('proprietes')
      .select('nom')
      .in('id', ['prop_villa_nice_test', 'prop_appart_paris_test'])
    
    console.log(`🏠 Propriétés test: ${proprietesTest?.length || 0}`)

    console.log('\n🎉 SUCCÈS!')
    console.log('\n🔗 Testez maintenant: http://localhost:3004/reservations')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

createTestData()
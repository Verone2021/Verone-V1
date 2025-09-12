#!/usr/bin/env node

/**
 * Script pour créer des données de test via les actions Next.js
 * Usage: node scripts/create-test-contracts.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = 'https://ptqwayandsfhciitjnhb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestData() {
  console.log('🚀 Création des données de test...')
  
  try {
    // 1. Organisation de test
    console.log('🏢 Création organisation...')
    const orgResult = await supabase
      .from('organisations')
      .upsert({
        id: 'org_wantitnow_001',
        nom: 'Want It Now Test',
        email: 'test@want-it-now.com',
        telephone: '+33 1 23 45 67 89',
        siret: '12345678901234',
        is_active: true
      })
      .select()

    if (orgResult.error) {
      console.log('Organisation existe déjà ou erreur:', orgResult.error.message)
    } else {
      console.log('✅ Organisation créée')
    }

    // 2. Propriétés de test
    console.log('🏠 Création propriétés...')
    
    // Propriété 1: Villa Nice (sans unités)
    const prop1Result = await supabase
      .from('proprietes')
      .upsert({
        id: 'prop_villa_nice_001',
        organisation_id: 'org_wantitnow_001',
        nom: 'Villa Les Palmiers Nice',
        description: 'Villa avec piscine et vue mer',
        adresse: '15 Avenue des Palmiers',
        code_postal: '06000',
        ville: 'Nice',
        pays: 'FR',
        type: 'villa',
        superficie_m2: 180,
        a_unites: false,
        is_active: true
      })

    if (prop1Result.error) {
      console.log('Erreur propriété 1:', prop1Result.error.message)
    } else {
      console.log('✅ Villa Nice créée')
    }

    // Propriété 2: Appartement Paris (sans unités) - simplifié
    const prop2Result = await supabase
      .from('proprietes')
      .upsert({
        id: 'prop_appart_paris_001',
        organisation_id: 'org_wantitnow_001',
        nom: 'Studio Trocadéro',
        description: 'Studio moderne près du Trocadéro',
        adresse: '42 Avenue Kléber',
        code_postal: '75016',
        ville: 'Paris',
        pays: 'FR',
        type: 'studio',
        superficie_m2: 35,
        a_unites: false,
        is_active: true
      })

    if (prop2Result.error) {
      console.log('Erreur propriété 2:', prop2Result.error.message)
    } else {
      console.log('✅ Studio Paris créé')
    }

    // 3. Propriétaires de test
    console.log('👥 Création propriétaires...')
    
    const proprios = [
      {
        id: 'proprio_jean_dupont',
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@gmail.com',
        telephone: '+33 6 12 34 56 78',
        type: 'personne_physique',
        is_active: true
      },
      {
        id: 'proprio_sci_martin',
        nom: 'SCI Famille Martin',
        prenom: null,
        email: 'contact@sci-martin.fr',
        telephone: '+33 1 42 33 44 55',
        type: 'personne_morale',
        is_active: true
      }
    ]

    for (const proprio of proprios) {
      const result = await supabase
        .from('proprietaires')
        .upsert(proprio)
        
      if (result.error) {
        console.log(`Erreur propriétaire ${proprio.nom}:`, result.error.message)
      } else {
        console.log(`✅ Propriétaire ${proprio.nom} créé`)
      }
    }

    // 4. Contrats de test
    console.log('📑 Création contrats...')

    // Contrat 1: Fixe - Villa Nice
    const contrat1Result = await supabase
      .from('contrats')
      .upsert({
        id: 'contrat_villa_nice_fixe',
        organisation_id: 'org_wantitnow_001',
        propriete_id: 'prop_villa_nice_001',
        unite_id: null,
        type_contrat: 'fixe',
        date_emission: '2025-01-15',
        date_debut: '2025-03-01',
        date_fin: '2026-02-28',
        meuble: true,
        autorisation_sous_location: true,
        besoin_renovation: false,
        commission_pourcentage: 12,
        usage_proprietaire_jours_max: 45,
        
        // Champs financiers fixe
        loyer_mensuel_ht: 2500,
        charges_mensuelles: 200,
        depot_garantie: 2500,
        jour_paiement_loyer: 5,
        
        // Informations bailleur
        bailleur_nom: 'Jean Dupont',
        bailleur_email: 'jean.dupont@gmail.com',
        bailleur_telephone: '+33 6 12 34 56 78',
        
        // Informations bien
        bien_adresse_complete: '15 Avenue des Palmiers, 06000 Nice, France',
        bien_type: 'villa',
        bien_superficie: 180,
        bien_nombre_pieces: 6
      })

    if (contrat1Result.error) {
      console.log('Erreur contrat 1:', contrat1Result.error.message)
    } else {
      console.log('✅ Contrat fixe Villa Nice créé')
    }

    // Contrat 2: Variable - Studio Paris
    const contrat2Result = await supabase
      .from('contrats')
      .upsert({
        id: 'contrat_studio_paris_variable',
        organisation_id: 'org_wantitnow_001',
        propriete_id: 'prop_appart_paris_001',
        unite_id: null,
        type_contrat: 'variable',
        date_emission: '2025-01-10',
        date_debut: '2025-02-01',
        date_fin: '2026-01-31',
        meuble: true,
        autorisation_sous_location: true,
        besoin_renovation: false,
        commission_pourcentage: 10,
        usage_proprietaire_jours_max: 30,
        
        // Champs financiers variable
        estimation_revenus_mensuels: 3200,
        methode_calcul_revenus: 'revenus_nets',
        dates_paiement: 'Mensuel le 10',
        frais_abonnement_internet: 45,
        frais_equipements_domotique: 25,
        
        // Informations bailleur
        bailleur_nom: 'SCI Famille Martin',
        bailleur_email: 'contact@sci-martin.fr',
        bailleur_telephone: '+33 1 42 33 44 55',
        bailleur_siren_siret: '123456789',
        
        // Informations bien
        bien_adresse_complete: '42 Avenue Kléber, 75016 Paris, France',
        bien_type: 'studio',
        bien_superficie: 35,
        bien_nombre_pieces: 1
      })

    if (contrat2Result.error) {
      console.log('Erreur contrat 2:', contrat2Result.error.message)
    } else {
      console.log('✅ Contrat variable Studio Paris créé')
    }

    // 5. Vérification finale
    console.log('\n📊 Vérification des données créées...')
    
    const contratsCount = await supabase
      .from('contrats')
      .select('id', { count: 'exact' })
      
    const proprietesCount = await supabase
      .from('proprietes')
      .select('id', { count: 'exact' })

    console.log(`✅ ${contratsCount.count || 0} contrat(s) en base`)
    console.log(`✅ ${proprietesCount.count || 0} propriété(s) en base`)
    
    console.log('\n🎉 Données de test créées avec succès !')
    console.log('\n🔗 Vous pouvez maintenant :')
    console.log('   - Accéder à /contrats pour voir la liste')
    console.log('   - Accéder à /reservations pour les propriétés avec contrats')

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error)
  }
}

// Exécution
createTestData().then(() => {
  process.exit(0)
}).catch(console.error)
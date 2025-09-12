#!/usr/bin/env node

/**
 * Script d'insertion des données de test pour le système de réservations
 * Usage: node scripts/seed-data.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpwkrqzqvjtzagudxxnk.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Données test inline
const TEST_DATA = {
  organisation: {
    nom: 'Want It Now France',
    pays: 'FR',
    description: 'Organisation principale pour la France - plateforme de gestion immobilière',
    adresse_siege: '15 Rue de la Paix, 75001 Paris, France',
    telephone: '+33 1 42 33 44 55',
    email: 'contact@want-it-now.fr',
    site_web: 'https://want-it-now.fr'
  },

  proprietaires: [
    {
      id: 'proprio_jean_dupont',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@gmail.com',
      telephone: '+33 6 12 34 56 78',
      type: 'personne_physique',
      adresse: '15 Rue de la Paix, 75001 Paris, France'
    },
    {
      id: 'proprio_sci_famille_martin',
      nom: 'SCI Famille Martin',
      prenom: '',
      email: 'contact@sci-martin.fr',
      telephone: '+33 1 42 33 44 55',
      type: 'personne_morale',
      siren_siret: '123456789',
      adresse: '8 Boulevard Saint-Germain, 75005 Paris, France'
    }
  ],

  proprietes: [
    {
      id: 'prop_villa_nice_001',
      organisation_id: 'org_wantitnow_001',
      nom: 'Villa Les Palmiers Nice',
      type: 'maison',
      statut: 'disponible',
      adresse_ligne1: '15 Avenue des Palmiers',
      code_postal: '06000',
      ville: 'Nice',
      pays: 'FR',
      surface_habitable: 180,
      nombre_pieces: 6,
      nombre_chambres: 4,
      a_unites: false
    },
    {
      id: 'prop_immeuble_paris_001',
      organisation_id: 'org_wantitnow_001',
      nom: 'Résidence Trocadéro',
      type: 'immeuble',
      statut: 'disponible',
      adresse_ligne1: '42 Avenue Kléber',
      code_postal: '75016',
      ville: 'Paris',
      pays: 'FR',
      surface_habitable: 450,
      nombre_pieces: 0,
      nombre_chambres: 0,
      a_unites: true
    },
    {
      id: 'prop_chalet_chamonix_001',
      organisation_id: 'org_wantitnow_001',
      nom: 'Chalet Mont-Blanc Vue',
      type: 'maison',
      statut: 'disponible',
      adresse_ligne1: '25 Route des Pècles',
      code_postal: '74400',
      ville: 'Chamonix',
      pays: 'FR',
      surface_habitable: 120,
      nombre_pieces: 5,
      nombre_chambres: 3,
      a_unites: false
    }
  ],

  unites: [
    {
      id: 'unit_paris_trocadero_01',
      propriete_id: 'prop_immeuble_paris_001',
      nom: 'Studio Étoile',
      numero: '01',
      type: 'studio',
      superficie_m2: 35,
      nb_pieces: 1,
      description: 'Studio moderne avec kitchenette équipée, vue Trocadéro',
      status: 'active'
    },
    {
      id: 'unit_paris_trocadero_02',
      propriete_id: 'prop_immeuble_paris_001',
      nom: 'Appartement Hausmanien',
      numero: '02',
      type: 'appartement',
      superficie_m2: 75,
      nb_pieces: 3,
      description: '2 chambres, salon, cuisine équipée, salle de bain avec baignoire',
      status: 'active'
    }
  ],

  contrats: [
    {
      id: 'contrat_villa_nice_fixe',
      propriete_id: 'prop_villa_nice_001',
      unite_id: null,
      type_contrat: 'fixe',
      date_debut: '2025-03-01',
      date_fin: '2026-02-28',
      statut: 'actif',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 12,
      usage_proprietaire_jours_max: 45,
      loyer_mensuel_ht: 2500,
      charges_mensuelles: 200,
      depot_garantie: 2500,
      jour_paiement_loyer: 5,
      bailleur_nom: 'Jean Dupont',
      bailleur_email: 'jean.dupont@gmail.com',
      bailleur_telephone: '+33 6 12 34 56 78',
      attestation_assurance: true,
      nom_assureur: 'AXA France',
      numero_police: 'AXA-PNO-2025-001234',
      type_activite_sous_location: 'courte_duree',
      duree_contrat_1an: true
    },
    {
      id: 'contrat_studio_paris_variable',
      propriete_id: null,
      unite_id: 'unit_paris_trocadero_01',
      type_contrat: 'variable',
      date_debut: '2025-02-01',
      date_fin: '2026-01-31',
      statut: 'actif',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 10,
      usage_proprietaire_jours_max: 30,
      estimation_revenus_mensuels: 3200,
      methode_calcul_revenus: 'revenus_nets',
      dates_paiement: 'Mensuel le 10',
      bailleur_nom: 'SCI Famille Martin',
      bailleur_email: 'contact@sci-martin.fr',
      bailleur_telephone: '+33 1 42 33 44 55',
      bailleur_siren_siret: '123456789',
      attestation_assurance: true,
      nom_assureur: 'Allianz France',
      numero_police: 'ALL-PNO-2025-005678',
      type_activite_sous_location: 'mixte',
      duree_contrat_1an: true
    },
    {
      id: 'contrat_chalet_chamonix_renovation',
      propriete_id: 'prop_chalet_chamonix_001',
      unite_id: null,
      type_contrat: 'fixe',
      date_debut: '2025-04-01',
      date_fin: '2026-03-31',
      statut: 'actif',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: true,
      commission_pourcentage: 15,
      usage_proprietaire_jours_max: 60,
      loyer_mensuel_ht: 1800,
      charges_mensuelles: 300,
      depot_garantie: 3600,
      autorisation_travaux: true,
      type_activite_sous_location: 'saisonniere',
      duree_contrat_1an: true
    }
  ]
}

async function seedData() {
  console.log('🚀 Début insertion données test réservations...\n')

  try {
    // 1. Organisation
    console.log('📋 1. Création organisation...')
    const { error: orgError } = await supabase
      .from('organisations')
      .upsert(TEST_DATA.organisation, { onConflict: 'id' })

    if (orgError && orgError.code !== '23505') {
      throw new Error(`Erreur organisation: ${orgError.message}`)
    }
    console.log('✅ Organisation créée: Want It Now France')

    // 2. Propriétaires
    console.log('\n👥 2. Création propriétaires...')
    for (const proprietaire of TEST_DATA.proprietaires) {
      const { error } = await supabase
        .from('proprietaires')
        .upsert({ ...proprietaire, is_active: true }, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur propriétaire ${proprietaire.nom}:`, error.message)
      } else {
        console.log(`✅ Propriétaire: ${proprietaire.nom} ${proprietaire.prenom || ''}`)
      }
    }

    // 3. Propriétés
    console.log('\n🏠 3. Création propriétés...')
    for (const propriete of TEST_DATA.proprietes) {
      const { error } = await supabase
        .from('proprietes')
        .upsert(propriete, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur propriété ${propriete.nom}:`, error.message)
      } else {
        console.log(`✅ Propriété: ${propriete.nom}`)
      }
    }

    // 4. Unités
    console.log('\n🏢 4. Création unités...')
    for (const unite of TEST_DATA.unites) {
      const { error } = await supabase
        .from('unites')
        .upsert(unite, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur unité ${unite.nom}:`, error.message)
      } else {
        console.log(`✅ Unité: ${unite.nom}`)
      }
    }

    // 5. Contrats
    console.log('\n📜 5. Création contrats...')
    for (const contrat of TEST_DATA.contrats) {
      const { error } = await supabase
        .from('contrats')
        .upsert(contrat, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur contrat:`, error.message)
      } else {
        console.log(`✅ Contrat ${contrat.type_contrat}: ${contrat.commission_pourcentage}% commission`)
      }
    }

    // 6. Réservations test
    console.log('\n📅 6. Création réservations...')
    const reservations = [
      {
        id: 'reservation_test_001',
        propriete_id: 'prop_villa_nice_001',
        unite_id: null,
        voyageur_nom: 'Martin Dubois',
        voyageur_email: 'martin.dubois@email.fr',
        voyageur_telephone: '+33 6 12 34 56 78',
        date_arrivee: '2025-03-15',
        date_depart: '2025-03-22',
        nombre_adultes: 2,
        nombre_enfants: 1,
        nombre_bebes: 0,
        prix_nuit: 250,
        frais_menage: 80,
        source_reservation: 'airbnb',
        code_confirmation: 'VN2025031522',
        statut: 'confirmee'
      },
      {
        id: 'reservation_test_002',
        propriete_id: null,
        unite_id: 'unit_paris_trocadero_01',
        voyageur_nom: 'Sophie Laurent',
        voyageur_email: 'sophie.laurent@email.fr',
        voyageur_telephone: '+33 6 98 76 54 32',
        date_arrivee: '2025-02-10',
        date_depart: '2025-02-14',
        nombre_adultes: 1,
        nombre_enfants: 0,
        nombre_bebes: 0,
        prix_nuit: 120,
        frais_menage: 40,
        source_reservation: 'booking',
        code_confirmation: 'SP2025021014',
        statut: 'confirmee'
      }
    ]

    for (const reservation of reservations) {
      const { error } = await supabase
        .from('reservations')
        .upsert(reservation, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur réservation ${reservation.voyageur_nom}:`, error.message)
      } else {
        console.log(`✅ Réservation: ${reservation.voyageur_nom} (${reservation.date_arrivee})`)
      }
    }

    // 7. Vérification
    console.log('\n🔍 7. Vérification données...')
    const { data: proprietes, error: verifError } = await supabase
      .from('v_proprietes_avec_contrats_actifs')
      .select('*')

    if (verifError) {
      console.error('❌ Erreur vérification:', verifError.message)
      // Essayons une requête directe sur les contrats
      const { data: contrats } = await supabase
        .from('contrats')
        .select('*')
        .eq('statut', 'actif')
      
      console.log(`📊 Contrats actifs trouvés: ${contrats?.length || 0}`)
    } else {
      console.log(`✅ Propriétés avec contrats: ${proprietes?.length || 0} trouvées`)
    }

    console.log('\n🎉 SUCCÈS - Données de test insérées!')
    console.log('\n📊 Résumé:')
    console.log(`   • ${TEST_DATA.proprietaires.length} propriétaires`)
    console.log(`   • ${TEST_DATA.proprietes.length} propriétés`)
    console.log(`   • ${TEST_DATA.unites.length} unités`)
    console.log(`   • ${TEST_DATA.contrats.length} contrats actifs`)
    console.log('   • 2 réservations test')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécution
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('\n✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { seedData }
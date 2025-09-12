#!/usr/bin/env ts-node

/**
 * Script d'insertion des données de test pour le système de réservations
 * Utilise les données définies dans test-data/contrats-test-data.ts
 * 
 * Usage: npx ts-node scripts/seed-reservations-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import {
  TEST_PROPRIETES,
  TEST_UNITES, 
  TEST_PROPRIETAIRES,
  TEST_CONTRAT_SCENARIOS
} from '../test-data/contrats-test-data.js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedReservationsData() {
  console.log('🚀 Début insertion données test réservations...\n')

  try {
    // 1. Créer organisation Want It Now France
    console.log('📋 1. Création organisation...')
    const { data: organisation, error: orgError } = await supabase
      .from('organisations')
      .upsert({
        id: 'org_wantitnow_001',
        nom: 'Want It Now France',
        pays: 'FR',
        ville: 'Paris',
        code_postal: '75001',
        adresse: '15 Rue de la Paix',
        telephone: '+33 1 42 33 44 55',
        email: 'contact@want-it-now.fr',
        website: 'https://want-it-now.fr',
        status: 'active'
      }, { onConflict: 'id' })
      .select()
      .single()

    if (orgError && orgError.code !== '23505') {
      throw new Error(`Erreur création organisation: ${orgError.message}`)
    }
    console.log('✅ Organisation créée:', organisation?.nom || 'Want It Now France')

    // 2. Créer propriétaires
    console.log('\n👥 2. Création propriétaires...')
    for (const proprietaire of TEST_PROPRIETAIRES) {
      const { data, error } = await supabase
        .from('proprietaires')
        .upsert({
          id: proprietaire.id,
          nom: proprietaire.nom,
          prenom: proprietaire.prenom || null,
          email: proprietaire.email,
          telephone: proprietaire.telephone,
          type: proprietaire.type,
          siren_siret: proprietaire.siren_siret || null,
          adresse: proprietaire.adresse,
          is_active: true
        }, { onConflict: 'id' })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur propriétaire ${proprietaire.nom}:`, error.message)
      } else {
        console.log(`✅ Propriétaire: ${proprietaire.nom} ${proprietaire.prenom || ''}`)
      }
    }

    // 3. Créer propriétés
    console.log('\n🏠 3. Création propriétés...')
    for (const propriete of TEST_PROPRIETES) {
      const { data, error } = await supabase
        .from('proprietes')
        .upsert({
          id: propriete.id,
          organisation_id: propriete.organisation_id,
          nom: propriete.nom,
          adresse_complete: propriete.adresse_complete,
          type: propriete.type,
          superficie_m2: propriete.superficie_m2,
          nb_pieces: propriete.nb_pieces,
          a_unites: propriete.a_unites,
          status: 'active'
        }, { onConflict: 'id' })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur propriété ${propriete.nom}:`, error.message)
      } else {
        console.log(`✅ Propriété: ${propriete.nom}`)
      }
    }

    // 4. Créer unités si nécessaire
    console.log('\n🏢 4. Création unités...')
    for (const unite of TEST_UNITES) {
      const { data, error } = await supabase
        .from('unites')
        .upsert({
          id: unite.id,
          propriete_id: unite.propriete_id,
          nom: unite.nom,
          numero: unite.numero,
          type: unite.type,
          superficie_m2: unite.superficie_m2,
          nb_pieces: unite.nb_pieces,
          description: unite.description,
          status: 'active'
        }, { onConflict: 'id' })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur unité ${unite.nom}:`, error.message)
      } else {
        console.log(`✅ Unité: ${unite.nom}`)
      }
    }

    // 5. Créer contrats test
    console.log('\n📜 5. Création contrats...')
    
    // Contrat fixe - Villa Nice
    const contratVillaNice = TEST_CONTRAT_SCENARIOS.villa_nice_fixe
    const { data: contrat1, error: err1 } = await supabase
      .from('contrats')
      .upsert({
        id: 'contrat_villa_nice_fixe',
        propriete_id: contratVillaNice.propriete_id,
        unite_id: contratVillaNice.unite_id,
        type_contrat: contratVillaNice.type_contrat,
        date_debut: contratVillaNice.date_debut,
        date_fin: contratVillaNice.date_fin,
        statut: 'actif',
        meuble: contratVillaNice.meuble,
        autorisation_sous_location: contratVillaNice.autorisation_sous_location,
        besoin_renovation: contratVillaNice.besoin_renovation,
        commission_pourcentage: parseFloat(contratVillaNice.commission_pourcentage),
        usage_proprietaire_jours_max: parseInt(contratVillaNice.usage_proprietaire_jours_max),
        
        // Financier fixe
        loyer_mensuel_ht: parseFloat(contratVillaNice.loyer_mensuel_ht),
        charges_mensuelles: parseFloat(contratVillaNice.charges_mensuelles),
        depot_garantie: parseFloat(contratVillaNice.depot_garantie),
        jour_paiement_loyer: parseInt(contratVillaNice.jour_paiement_loyer),
        
        // Bailleur
        bailleur_nom: contratVillaNice.bailleur_nom,
        bailleur_email: contratVillaNice.bailleur_email,
        bailleur_telephone: contratVillaNice.bailleur_telephone,
        
        // Assurance
        attestation_assurance: contratVillaNice.attestation_assurance,
        nom_assureur: contratVillaNice.nom_assureur,
        numero_police: contratVillaNice.numero_police,
        assurance_pertes_exploitation: contratVillaNice.assurance_pertes_exploitation,
        protection_juridique: contratVillaNice.protection_juridique,
        
        // Contact urgence
        contact_urgence_nom: contratVillaNice.contact_urgence_nom,
        contact_urgence_telephone: contratVillaNice.contact_urgence_telephone,
        contact_urgence_email: contratVillaNice.contact_urgence_email,
        
        // Want It Now spécifique
        type_activite_sous_location: contratVillaNice.type_activite_sous_location,
        conditions_sous_location: contratVillaNice.conditions_sous_location,
        duree_contrat_1an: contratVillaNice.duree_contrat_1an
      }, { onConflict: 'id' })

    if (err1 && err1.code !== '23505') {
      console.error('❌ Erreur contrat Villa Nice:', err1.message)
    } else {
      console.log('✅ Contrat fixe: Villa Nice (12% commission)')
    }

    // Contrat variable - Studio Paris
    const contratStudioParis = TEST_CONTRAT_SCENARIOS.studio_paris_variable
    const { data: contrat2, error: err2 } = await supabase
      .from('contrats')
      .upsert({
        id: 'contrat_studio_paris_variable',
        propriete_id: contratStudioParis.propriete_id,
        unite_id: contratStudioParis.unite_id,
        type_contrat: contratStudioParis.type_contrat,
        date_debut: contratStudioParis.date_debut,
        date_fin: contratStudioParis.date_fin,
        statut: 'actif',
        meuble: contratStudioParis.meuble,
        autorisation_sous_location: contratStudioParis.autorisation_sous_location,
        besoin_renovation: contratStudioParis.besoin_renovation,
        commission_pourcentage: parseFloat(contratStudioParis.commission_pourcentage),
        usage_proprietaire_jours_max: parseInt(contratStudioParis.usage_proprietaire_jours_max),
        
        // Financier variable
        estimation_revenus_mensuels: parseFloat(contratStudioParis.estimation_revenus_mensuels),
        methode_calcul_revenus: contratStudioParis.methode_calcul_revenus,
        dates_paiement: contratStudioParis.dates_paiement,
        frais_abonnement_internet: parseFloat(contratStudioParis.frais_abonnement_internet),
        frais_equipements_domotique: parseFloat(contratStudioParis.frais_equipements_domotique),
        
        // Bailleur SCI
        bailleur_nom: contratStudioParis.bailleur_nom,
        bailleur_email: contratStudioParis.bailleur_email,
        bailleur_telephone: contratStudioParis.bailleur_telephone,
        bailleur_siren_siret: contratStudioParis.bailleur_siren_siret,
        bailleur_representant_legal: contratStudioParis.bailleur_representant_legal,
        
        // Assurance complète
        attestation_assurance: contratStudioParis.attestation_assurance,
        nom_assureur: contratStudioParis.nom_assureur,
        numero_police: contratStudioParis.numero_police,
        assurance_pertes_exploitation: contratStudioParis.assurance_pertes_exploitation,
        assurance_pertes_exploitation_details: contratStudioParis.assurance_pertes_exploitation_details,
        assurance_occupation_illicite: contratStudioParis.assurance_occupation_illicite,
        protection_juridique: contratStudioParis.protection_juridique,
        protection_juridique_details: contratStudioParis.protection_juridique_details,
        
        // Contact professionnel
        contact_urgence_nom: contratStudioParis.contact_urgence_nom,
        contact_urgence_telephone: contratStudioParis.contact_urgence_telephone,
        contact_urgence_email: contratStudioParis.contact_urgence_email,
        
        // Want It Now spécifique
        type_activite_sous_location: contratStudioParis.type_activite_sous_location,
        conditions_sous_location: contratStudioParis.conditions_sous_location,
        activites_permises: contratStudioParis.activites_permises,
        duree_contrat_1an: contratStudioParis.duree_contrat_1an
      }, { onConflict: 'id' })

    if (err2 && err2.code !== '23505') {
      console.error('❌ Erreur contrat Studio Paris:', err2.message)
    } else {
      console.log('✅ Contrat variable: Studio Paris (10% commission)')
    }

    // Contrat fixe avec travaux - Chalet Chamonix
    const contratChamonix = TEST_CONTRAT_SCENARIOS.chalet_chamonix_renovation
    const { data: contrat3, error: err3 } = await supabase
      .from('contrats')
      .upsert({
        id: 'contrat_chalet_chamonix_renovation',
        propriete_id: contratChamonix.propriete_id,
        unite_id: contratChamonix.unite_id,
        type_contrat: contratChamonix.type_contrat,
        date_debut: contratChamonix.date_debut,
        date_fin: contratChamonix.date_fin,
        statut: 'actif',
        meuble: contratChamonix.meuble,
        autorisation_sous_location: contratChamonix.autorisation_sous_location,
        besoin_renovation: contratChamonix.besoin_renovation,
        commission_pourcentage: parseFloat(contratChamonix.commission_pourcentage),
        usage_proprietaire_jours_max: parseInt(contratChamonix.usage_proprietaire_jours_max),
        deduction_futurs_loyers: parseFloat(contratChamonix.deduction_futurs_loyers),
        
        // Financier avec travaux
        loyer_mensuel_ht: parseFloat(contratChamonix.loyer_mensuel_ht),
        charges_mensuelles: parseFloat(contratChamonix.charges_mensuelles),
        depot_garantie: parseFloat(contratChamonix.depot_garantie),
        plafond_depannages_urgents: parseFloat(contratChamonix.plafond_depannages_urgents),
        
        // Autorisation travaux
        autorisation_travaux: contratChamonix.autorisation_travaux,
        conditions_remboursement_travaux: contratChamonix.conditions_remboursement_travaux,
        
        // Want It Now spécifique montagne
        type_activite_sous_location: contratChamonix.type_activite_sous_location,
        conditions_sous_location: contratChamonix.conditions_sous_location,
        periodes_creuses: contratChamonix.periodes_creuses,
        
        // Assurance montagne
        attestation_assurance: contratChamonix.attestation_assurance,
        nom_assureur: contratChamonix.nom_assureur,
        numero_police: contratChamonix.numero_police,
        assurance_pertes_exploitation: contratChamonix.assurance_pertes_exploitation,
        assurance_occupation_illicite: contratChamonix.assurance_occupation_illicite,
        protection_juridique: contratChamonix.protection_juridique,
        
        duree_contrat_1an: true
      }, { onConflict: 'id' })

    if (err3 && err3.code !== '23505') {
      console.error('❌ Erreur contrat Chalet Chamonix:', err3.message)
    } else {
      console.log('✅ Contrat fixe avec travaux: Chalet Chamonix (15% commission)')
    }

    // 6. Créer quelques réservations de test
    console.log('\n📅 6. Création réservations de test...')
    
    const reservationsTest = [
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
      },
      {
        id: 'reservation_test_003',
        propriete_id: 'prop_chalet_chamonix_001',
        unite_id: null,
        voyageur_nom: 'Family Johnson',
        voyageur_email: 'family.johnson@email.com',
        voyageur_telephone: '+44 7 12 34 56 78',
        date_arrivee: '2025-04-05',
        date_depart: '2025-04-12',
        nombre_adultes: 4,
        nombre_enfants: 2,
        nombre_bebes: 0,
        prix_nuit: 180,
        frais_menage: 100,
        source_reservation: 'direct',
        code_confirmation: 'CH2025040512',
        statut: 'confirmee'
      }
    ]

    for (const reservation of reservationsTest) {
      const { data, error } = await supabase
        .from('reservations')
        .upsert(reservation, { onConflict: 'id' })

      if (error && error.code !== '23505') {
        console.error(`❌ Erreur réservation ${reservation.voyageur_nom}:`, error.message)
      } else {
        console.log(`✅ Réservation: ${reservation.voyageur_nom} (${reservation.date_arrivee})`)
      }
    }

    // 7. Vérification finale
    console.log('\n🔍 7. Vérification données...')
    
    const { data: proprietes, error: verifError } = await supabase
      .from('v_proprietes_avec_contrats_actifs')
      .select('*')

    if (verifError) {
      console.error('❌ Erreur vérification vue:', verifError.message)
    } else {
      console.log(`✅ Vue propriétés avec contrats: ${proprietes?.length || 0} propriétés trouvées`)
      
      if (proprietes && proprietes.length > 0) {
        proprietes.forEach((prop: any) => {
          console.log(`   📍 ${prop.propriete_nom} - Contrat ${prop.type_contrat} (${prop.commission_pourcentage}%)`)
        })
      }
    }

    console.log('\n🎉 SUCCÈS - Données de test insérées avec succès!')
    console.log('\n📊 Résumé:')
    console.log(`   • ${TEST_PROPRIETAIRES.length} propriétaires créés`)
    console.log(`   • ${TEST_PROPRIETES.length} propriétés créées`) 
    console.log(`   • ${TEST_UNITES.length} unités créées`)
    console.log(`   • 3 contrats actifs créés (fixe + variable + travaux)`)
    console.log(`   • 3 réservations de test créées`)
    console.log('\n🔗 Liens rapides:')
    console.log('   • http://localhost:3004/reservations (Channel Manager)')
    console.log('   • http://localhost:3004/reservations/prop_villa_nice_001/calendar')
    console.log('   • http://localhost:3004/reservations/unit_paris_trocadero_01/list')

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error)
    process.exit(1)
  }
}

// Execution du script
if (require.main === module) {
  seedReservationsData()
    .then(() => {
      console.log('\n✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error)
      process.exit(1)
    })
}

export { seedReservationsData }
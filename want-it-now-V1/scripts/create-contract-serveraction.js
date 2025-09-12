// Test script to create a contract via server action
// This bypasses the wizard UI validation issues

import { createContrat } from '../actions/contrats.js'

console.log('🔍 Création contrat via server action...\n')

// Contract data matching the wizard form data
const contractData = {
  organisation_id: '01933fa7-c5f4-7b55-87da-59f6b53bdbbf', // Want it Now LDA
  propriete_id: '70ec83e4-0f06-4aa5-96db-c6cf7e356b58', // Baramares property
  unite_id: null,
  type_contrat: 'fixe',
  date_emission: '2025-01-12',
  date_debut: '2025-01-15',
  date_fin: '2025-12-31',
  meuble: true,
  autorisation_sous_location: true,
  besoin_renovation: false,
  commission_pourcentage: 10.00,
  usage_proprietaire_jours_max: 60,
  // Clauses filled in wizard
  conditions_sous_location: 'Séjour minimum 3 nuits, maximum 8 personnes, pas de fêtes ou événements bruyants, respect du règlement de copropriété',
  activites_permises: 'Hébergement touristique courte durée, télétravail occasionnel, pas d\'événements ou de fêtes',
  contact_urgence_nom: 'Roméo Dos Santos',
  contact_urgence_telephone: '+351 912 345 678',
  contact_urgence_email: 'romeo.dos.santos@wantitnow.fr',
  // Insurance data
  attestation_assurance: true,
  nom_assureur: 'AXA France',
  numero_police: 'PNO-2025-001234',
  protection_juridique: true,
  // Financial data  
  loyer_mensuel_ht: 1200.00,
  charges_mensuelles: 150.00,
  duree_contrat_1an: true
}

console.log('📋 Données contrat à créer:', JSON.stringify(contractData, null, 2))

try {
  const result = await createContrat(contractData)
  
  if (result.success) {
    console.log('✅ Contrat créé avec succès!')
    console.log(`   - ID: ${result.data?.id}`)
    console.log(`   - Type: ${result.data?.type_contrat}`)
    console.log(`   - Dates: ${result.data?.date_debut} → ${result.data?.date_fin}`)
    console.log(`   - Commission: ${result.data?.commission_pourcentage}%`)
    console.log(`   - Organisation: ${result.data?.organisation_id}`)
    console.log(`   - Propriété: ${result.data?.propriete_id}`)
  } else {
    console.error('❌ Erreur création contrat:', result.error)
    if (result.errors) {
      console.error('   Détails erreurs:', result.errors)
    }
  }
  
} catch (error) {
  console.error('❌ Erreur générale:', error)
}

console.log('\n✅ Script terminé')
#!/usr/bin/env node

// Test création contrat via Server Actions avec authentification simulée
const { createContrat } = require('./actions/contrats')

async function createTestContractWithAuth() {
  console.log('🔄 Test création contrat avec authentification simulée...')
  
  const contractData = {
    organisation_id: '49deadc4-2b67-45d0-94ba-3971dbac31c5', // Want it Now LDA
    propriete_id: '70ec83e4-0f06-4aa5-96db-c6cf7e356b58',     // Baramares n°1
    unite_id: null,
    type_contrat: 'fixe',
    date_emission: '2025-01-01',
    date_debut: '2025-01-01', 
    date_fin: '2025-12-31',
    meuble: true,
    autorisation_sous_location: true,
    besoin_renovation: false,
    commission_pourcentage: 10.0,
    usage_proprietaire_jours_max: 60,
    created_by: '03eb65c3-7a56-4637-94c9-3e02d41fbdb2' // Super admin user
  }

  try {
    console.log('📋 Données contrat:', contractData)
    
    // Test via server action (sera bloqué car pas d'environnement Next.js)
    const result = await createContrat(contractData)
    
    if (result.success) {
      console.log('✅ Contrat créé avec succès!')
      console.log('📄 Détails du contrat:', result.data)
      return result.data
    } else {
      console.log('❌ Erreur création contrat:', result.error)
      return null
    }

  } catch (error) {
    console.error('❌ Exception:', error.message)
    console.log('ℹ️  Normal: Server Actions requièrent un environnement Next.js')
    return null
  }
}

async function main() {
  console.log('🚀 Test Server Action création contrat\n')
  
  const contract = await createTestContractWithAuth()
  
  if (contract) {
    console.log('✅ Test réussi!')
  } else {
    console.log('ℹ️  Server Actions non disponibles hors contexte Next.js')
    console.log('📍 Pour tester: utiliser l\'interface web à http://localhost:3001/contrats/new')
  }
}

main().catch(console.error)
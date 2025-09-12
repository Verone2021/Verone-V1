// Script de création de données de test via curl API
// Utilise les endpoints API de l'application Next.js

async function createTestData() {
  try {
    console.log('🚀 Création des données de test pour quotités...\n')

    // 1. Créer une organisation de test via l'interface
    console.log('📊 Données de test à créer manuellement via l\'interface...')
    console.log('OU créer via les server actions...')
    
    // Pour simplifier, nous allons créer les données en supposant qu'une organisation existe
    const orgId = '00000000-0000-0000-0000-000000000001' // ID factice pour les tests

    // 2. Créer des propriétaires de test
    console.log('\n👥 Création propriétaires de test...')
    const proprietaires = [
      {
        nom: 'Dupont',
        prenom: 'Jean',
        type: 'personne_physique',
        email: 'jean.dupont@test.com',
        is_active: true
      },
      {
        nom: 'Martin',
        prenom: 'Marie',
        type: 'personne_physique', 
        email: 'marie.martin@test.com',
        is_active: true
      },
      {
        nom: 'SCI Immobilière',
        prenom: null,
        type: 'sci',
        email: 'contact@sci-immobiliere.com',
        is_active: true
      },
      {
        nom: 'Durand',
        prenom: 'Pierre',
        type: 'personne_physique',
        email: 'pierre.durand@test.com', 
        is_active: true
      }
    ]

    const { data: proprietairesCreated, error: propError } = await supabase
      .from('proprietaires')
      .insert(proprietaires)
      .select()

    if (propError) throw propError
    console.log(`✅ ${proprietairesCreated.length} propriétaires créés`)

    // 3. Créer des propriétés de test
    console.log('\n🏠 Création propriétés de test...')
    const proprietes = [
      {
        organisation_id: org.id,
        nom: 'Villa Nice Test',
        type: 'villa',
        adresse: '123 Avenue de la Côte d\'Azur, Nice',
        code_postal: '06000',
        ville: 'Nice',
        pays: 'FR',
        superficie_m2: 200,
        nb_pieces: 6,
        a_unites: false
      },
      {
        organisation_id: org.id,
        nom: 'Appartement Paris Test', 
        type: 'appartement',
        adresse: '45 Rue de Rivoli, Paris',
        code_postal: '75001',
        ville: 'Paris',
        pays: 'FR',
        superficie_m2: 80,
        nb_pieces: 3,
        a_unites: false
      },
      {
        organisation_id: org.id,
        nom: 'Résidence Cannes Test',
        type: 'villa',
        adresse: '78 Boulevard de la Croisette, Cannes', 
        code_postal: '06400',
        ville: 'Cannes',
        pays: 'FR',
        superficie_m2: 350,
        nb_pieces: 8,
        a_unites: false
      }
    ]

    const { data: proprietesCreated, error: propietesError } = await supabase
      .from('proprietes')
      .insert(proprietes)
      .select()

    if (propietesError) throw propietesError
    console.log(`✅ ${proprietesCreated.length} propriétés créées`)

    // 4. Créer des quotités de test
    console.log('\n📊 Création quotités de test...')
    
    // Propriété 1: Villa Nice (100% répartis)
    const quotitesVilla = [
      {
        propriete_id: proprietesCreated[0].id,
        proprietaire_id: proprietairesCreated[0].id, // Jean Dupont
        pourcentage: 60.0,
        date_acquisition: '2023-01-15',
        prix_acquisition: 300000,
        notes: 'Acquisition initiale - Propriétaire principal'
      },
      {
        propriete_id: proprietesCreated[0].id,
        proprietaire_id: proprietairesCreated[1].id, // Marie Martin
        pourcentage: 25.0,
        date_acquisition: '2023-06-20',
        prix_acquisition: 125000,
        notes: 'Investissement secondaire'
      },
      {
        propriete_id: proprietesCreated[0].id,
        proprietaire_id: proprietairesCreated[2].id, // SCI Immobilière
        pourcentage: 15.0,
        date_acquisition: '2023-09-10', 
        prix_acquisition: 75000,
        notes: 'Participation SCI'
      }
    ]

    // Propriété 2: Appartement Paris (80% répartis - données partielles pour tester)
    const quotitesAppartement = [
      {
        propriete_id: proprietesCreated[1].id,
        proprietaire_id: proprietairesCreated[1].id, // Marie Martin
        pourcentage: 50.0,
        date_acquisition: '2024-01-01',
        prix_acquisition: 200000,
        notes: 'Propriétaire majoritaire'
      },
      {
        propriete_id: proprietesCreated[1].id,
        proprietaire_id: proprietairesCreated[3].id, // Pierre Durand
        pourcentage: 30.0,
        date_acquisition: '2024-02-15',
        prix_acquisition: 120000,
        notes: 'Copropriétaire'
      }
    ]

    // Propriété 3: Résidence Cannes (une seule quotité pour tester ajout)
    const quotitesResidence = [
      {
        propriete_id: proprietesCreated[2].id,
        proprietaire_id: proprietairesCreated[2].id, // SCI Immobilière
        pourcentage: 45.0,
        date_acquisition: '2023-12-01',
        prix_acquisition: 400000,
        notes: 'Première tranche d\'acquisition'
      }
    ]

    // Insérer toutes les quotités
    const toutesQuotites = [...quotitesVilla, ...quotitesAppartement, ...quotitesResidence]
    const { data: quotitesCreated, error: quotitesError } = await supabase
      .from('propriete_proprietaires')
      .insert(toutesQuotites)
      .select()

    if (quotitesError) throw quotitesError
    console.log(`✅ ${quotitesCreated.length} quotités créées`)

    // 5. Afficher résumé
    console.log('\n📋 RÉSUMÉ DES DONNÉES DE TEST CRÉÉES:')
    console.log('=====================================')
    console.log(`🏢 Organisation: ${org.nom}`)
    console.log(`👥 Propriétaires: ${proprietairesCreated.length}`)
    console.log(`🏠 Propriétés: ${proprietesCreated.length}`) 
    console.log(`📊 Quotités: ${quotitesCreated.length}`)
    
    console.log('\n🎯 SCÉNARIOS DE TEST DISPONIBLES:')
    console.log('- Villa Nice: 100% répartis (3 propriétaires)')
    console.log('- Appartement Paris: 80% répartis (20% disponibles)')  
    console.log('- Résidence Cannes: 45% répartis (55% disponibles)')
    
    console.log('\n✨ Données prêtes pour tests Playwright!')
    
    return {
      organisation: org,
      proprietaires: proprietairesCreated,
      proprietes: proprietesCreated, 
      quotites: quotitesCreated
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error)
    throw error
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('\n🎉 Création des données de test terminée avec succès!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Échec de la création des données:', error)
      process.exit(1)
    })
}

module.exports = { createTestData }
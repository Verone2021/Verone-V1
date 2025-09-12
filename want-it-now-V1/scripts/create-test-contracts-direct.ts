import { createClient } from '@/lib/supabase/server'

// Script direct pour créer les contrats de test
async function createTestContracts() {
  console.log('🚀 Création de contrats de test...')
  
  try {
    const supabase = await createClient()
    
    // IDs des propriétés existantes
    const PROPERTY_ID_1 = "687cac1e-1ad9-423a-b47e-2b22971644f8" // Appartement Centre Ville
    const PROPERTY_ID_2 = "db65f3e6-c192-457e-9c61-3b85154d0bbe" // Maison Familiale
    
    // Vérifier que les propriétés existent
    const { data: proprietes, error: propError } = await supabase
      .from('proprietes')
      .select('id, nom, organisation_id')
      .in('id', [PROPERTY_ID_1, PROPERTY_ID_2])
    
    if (propError) {
      console.error('❌ Erreur récupération propriétés:', propError)
      return
    }
    
    if (!proprietes || proprietes.length === 0) {
      console.error('❌ Aucune propriété trouvée avec ces IDs')
      return
    }
    
    console.log(`✅ Propriétés trouvées : ${proprietes.length}`)
    proprietes.forEach(p => console.log(`  - ${p.nom} (${p.id})`))
    
    // Créer les contrats
    const contrats = []
    
    // Contrat 1 - Fixe
    contrats.push({
      propriete_id: PROPERTY_ID_1,
      unite_id: null,
      type_contrat: 'fixe',
      date_debut: '2025-01-01',
      date_fin: '2025-12-31',
      commission_pourcentage: 15.0,
      organisation_id: proprietes.find(p => p.id === PROPERTY_ID_1)?.organisation_id,
      date_emission: '2025-01-31',
      meuble: true,
      autorisation_sous_location: true,
      usage_proprietaire_jours_max: 60
    })
    
    // Contrat 2 - Variable
    contrats.push({
      propriete_id: PROPERTY_ID_2,
      unite_id: null,
      type_contrat: 'variable',
      date_debut: '2025-01-01',
      date_fin: '2025-12-31',
      commission_pourcentage: 12.0,
      organisation_id: proprietes.find(p => p.id === PROPERTY_ID_2)?.organisation_id,
      date_emission: '2025-01-31',
      meuble: true,
      autorisation_sous_location: true,
      usage_proprietaire_jours_max: 60
    })
    
    console.log('📝 Insertion des contrats...')
    
    const { data: insertedContrats, error: insertError } = await supabase
      .from('contrats')
      .insert(contrats)
      .select('*')
    
    if (insertError) {
      console.error('❌ Erreur insertion contrats:', insertError)
      return
    }
    
    console.log('✅ Contrats créés avec succès!')
    insertedContrats?.forEach(contrat => {
      console.log(`  - Contrat ${contrat.type_contrat} pour propriété ${contrat.propriete_id}`)
      console.log(`    ID: ${contrat.id}`)
      console.log(`    Commission: ${contrat.commission_pourcentage}%`)
      console.log(`    Dates: ${contrat.date_debut} → ${contrat.date_fin}`)
    })
    
    console.log('🎉 Script terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur script:', error)
  }
}

// Exporter pour exécution
export { createTestContracts }
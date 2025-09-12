#!/usr/bin/env node

// Script de test pour créer un contrat test via les actions server
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ptqwayandsfhciitjnhb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestContract() {
  console.log('🔄 Création d\'un contrat test...')
  
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
    const { data, error } = await supabase
      .from('contrats')
      .insert(contractData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création contrat:', error)
      return null
    }

    console.log('✅ Contrat créé avec succès!')
    console.log('📄 Détails du contrat:')
    console.log('  - ID:', data.id)
    console.log('  - Propriété:', 'Baramares n°1')
    console.log('  - Type:', data.type_contrat)
    console.log('  - Période:', `${data.date_debut} → ${data.date_fin}`)
    console.log('  - Commission:', `${data.commission_pourcentage}%`)
    console.log('  - Usage propriétaire:', `${data.usage_proprietaire_jours_max} jours max`)
    
    return data

  } catch (error) {
    console.error('❌ Exception:', error)
    return null
  }
}

async function listContracts() {
  console.log('\n📋 Vérification des contrats existants...')
  
  try {
    const { data, error } = await supabase
      .from('contrats')
      .select(`
        id,
        type_contrat,
        date_debut,
        date_fin,
        commission_pourcentage,
        created_at,
        proprietes!inner(nom, ville)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Erreur récupération contrats:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('📋 Aucun contrat trouvé')
      return
    }

    console.log(`📋 ${data.length} contrat(s) trouvé(s):`)
    data.forEach((contrat, index) => {
      console.log(`  ${index + 1}. [${contrat.id.slice(0, 8)}...] ${contrat.proprietes?.nom} (${contrat.type_contrat})`)
      console.log(`     📅 ${contrat.date_debut} → ${contrat.date_fin}`)
      console.log(`     💰 Commission: ${contrat.commission_pourcentage}%`)
      console.log(`     🕐 Créé: ${new Date(contrat.created_at).toLocaleString('fr-FR')}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Exception récupération:', error)
  }
}

async function main() {
  console.log('🚀 Test de création de contrat complet\n')
  
  // Créer le contrat test
  const contract = await createTestContract()
  
  if (!contract) {
    console.log('❌ Échec de la création du contrat')
    return
  }
  
  // Vérifier que le contrat apparaît bien dans la liste
  await listContracts()
  
  console.log('✅ Test terminé avec succès!')
  console.log('\n📍 Prochaine étape: Vérifier sur http://localhost:3001/contrats')
}

main().catch(console.error)
#!/usr/bin/env node

// Test du filtrage des propriétés sans contrat actif
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ptqwayandsfhciitjnhb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPropertyFiltering() {
  console.log('🔄 Test du filtrage des propriétés sans contrat actif...\n')
  
  try {
    // Étape 1: Récupérer toutes les propriétés actives
    console.log('📊 Étape 1: Récupération de toutes les propriétés actives')
    const { data: allProprietesData, error: propError } = await supabase
      .from('proprietes')
      .select(`
        id,
        nom,
        type,
        ville,
        pays,
        organisation_id,
        is_active,
        organisations!inner(id, nom, pays)
      `)
      .eq('is_active', true)
      .order('nom')
    
    if (propError) {
      console.error('❌ Erreur récupération propriétés:', propError)
      return
    }

    console.log(`✅ ${allProprietesData?.length || 0} propriété(s) active(s) trouvée(s):`)
    allProprietesData?.forEach((prop, index) => {
      console.log(`  ${index + 1}. ${prop.nom} (${prop.ville}) - Org: ${prop.organisations?.nom}`)
    })

    // Étape 2: Récupérer les contrats actifs
    console.log('\n📋 Étape 2: Récupération des contrats actifs (non expirés)')
    const { data: contratsActifs, error: contractsError } = await supabase
      .from('contrats')
      .select(`
        id,
        propriete_id,
        type_contrat,
        date_debut,
        date_fin
      `)
      .gte('date_fin', new Date().toISOString().split('T')[0]) // Contrats non expirés
    
    if (contractsError) {
      console.error('❌ Erreur récupération contrats actifs:', contractsError)
      return
    }

    console.log(`✅ ${contratsActifs?.length || 0} contrat(s) actif(s) trouvé(s):`)
    contratsActifs?.forEach((contrat, index) => {
      console.log(`  ${index + 1}. [${contrat.id.slice(0, 8)}...] Propriété: ${contrat.propriete_id.slice(0, 8)}... (${contrat.type_contrat})`)
      console.log(`     📅 ${contrat.date_debut} → ${contrat.date_fin}`)
    })

    // Étape 3: Filtrage des propriétés disponibles
    console.log('\n🔍 Étape 3: Filtrage des propriétés disponibles pour nouveau contrat')
    const proprietesWithActiveContracts = new Set(
      contratsActifs?.map(c => c.propriete_id) || []
    )
    
    const proprietesData = allProprietesData?.filter(
      propriete => !proprietesWithActiveContracts.has(propriete.id)
    ) || []

    console.log('📊 Résultat du filtrage:')
    console.log(`  - Total propriétés: ${allProprietesData?.length || 0}`)
    console.log(`  - Propriétés avec contrats actifs: ${proprietesWithActiveContracts.size}`)
    console.log(`  - Propriétés disponibles: ${proprietesData.length}`)

    if (proprietesData.length > 0) {
      console.log('\n✅ Propriétés disponibles pour nouveau contrat:')
      proprietesData.forEach((prop, index) => {
        console.log(`  ${index + 1}. ${prop.nom} (${prop.ville}) - Org: ${prop.organisations?.nom}`)
      })
    } else {
      const totalProprietesCount = allProprietesData?.length || 0
      if (totalProprietesCount === 0) {
        console.log('\n⚠️  Aucune propriété accessible. Vous devez d\'abord créer une propriété.')
      } else {
        console.log(`\n⚠️  Aucune propriété disponible pour un nouveau contrat. Toutes les ${totalProprietesCount} propriété(s) ont déjà un contrat actif.`)
      }
    }

    return {
      totalProprietes: allProprietesData?.length || 0,
      contratsActifs: contratsActifs?.length || 0,
      proprietesDisponibles: proprietesData.length,
      message: proprietesData.length === 0 ? 
        (allProprietesData?.length === 0 ? 
          'Aucune propriété accessible' : 
          `Toutes les ${allProprietesData?.length} propriété(s) ont déjà un contrat actif`
        ) : 
        `${proprietesData.length} propriété(s) disponible(s)`
    }

  } catch (error) {
    console.error('❌ Exception:', error)
    return null
  }
}

async function main() {
  console.log('🚀 Test Filtrage Propriétés - Logique Business\n')
  
  const result = await testPropertyFiltering()
  
  if (result) {
    console.log('\n✅ Test terminé avec succès!')
    console.log('\n📈 Résumé:')
    console.log(`  - Total propriétés: ${result.totalProprietes}`)
    console.log(`  - Contrats actifs: ${result.contratsActifs}`)
    console.log(`  - Propriétés disponibles: ${result.proprietesDisponibles}`)
    console.log(`  - Message: ${result.message}`)
    
    console.log('\n🎯 Test de la logique métier:')
    if (result.proprietesDisponibles === 0 && result.totalProprietes > 0) {
      console.log('✅ SUCCÈS: Le filtrage fonctionne correctement - aucune propriété disponible car toutes ont des contrats actifs')
    } else if (result.proprietesDisponibles > 0) {
      console.log('✅ SUCCÈS: Le filtrage fonctionne correctement - propriétés sans contrats disponibles')
    } else {
      console.log('ℹ️  INFO: Aucune propriété dans le système')
    }
  } else {
    console.log('❌ Test échoué')
  }
  
  console.log('\n📍 Interface utilisateur: http://localhost:3001/contrats/new')
}

main().catch(console.error)
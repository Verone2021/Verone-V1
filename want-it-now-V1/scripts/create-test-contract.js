const { createClient } = require('@supabase/supabase-js')

// Use service role for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_ACCESS_TOKEN

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createTestContract() {
  console.log('🔍 Création d\'un contrat test...\n')
  
  try {
    // 1. Récupérer la propriété Baramares
    console.log('📋 Étape 1: Recherche de la propriété Baramares...')
    const { data: properties, error: propError } = await supabase
      .from('proprietes')
      .select('*')
      .ilike('nom', '%Baramares%')
      .limit(1)

    if (propError) {
      console.error('❌ Erreur propriétés:', propError)
      return
    }

    if (!properties || properties.length === 0) {
      console.log('❌ Aucune propriété Baramares trouvée')
      return
    }

    const property = properties[0]
    console.log(`✅ Propriété trouvée: ${property.nom} (${property.id})`)

    // 2. Créer le contrat directement
    console.log('📋 Étape 2: Création du contrat...')
    const contractData = {
      organisation_id: property.organisation_id,
      propriete_id: property.id,
      unite_id: null,
      type_contrat: 'fixe',
      date_emission: '2025-01-12',
      date_debut: '2025-01-15',
      date_fin: '2025-12-31',
      meuble: true,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: 10.00,
      usage_proprietaire_jours_max: 60
    }

    const { data: contrat, error: contratError } = await supabase
      .from('contrats')
      .insert(contractData)
      .select()
      .single()

    if (contratError) {
      console.error('❌ Erreur création contrat:', contratError)
      return
    }

    console.log('✅ Contrat créé avec succès!')
    console.log(`   - ID: ${contrat.id}`)
    console.log(`   - Type: ${contrat.type_contrat}`)
    console.log(`   - Dates: ${contrat.date_debut} → ${contrat.date_fin}`)
    console.log(`   - Commission: ${contrat.commission_pourcentage}%`)
    
    return contrat

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

createTestContract()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erreur script:', error)
    process.exit(1)
  })
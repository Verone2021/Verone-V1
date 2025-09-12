const { createClient } = require('@supabase/supabase-js')

// Use access token for authenticated access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl || !supabaseAccessToken) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_ACCESS_TOKEN:', supabaseAccessToken ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAccessToken, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createContractDirect() {
  console.log('🔍 Creation contrat direct avec service role...\n')
  
  try {
    // Contract data based on wizard values
    const contractData = {
      organisation_id: '01933fa7-c5f4-7b55-87da-59f6b53bdbbf', // Want it Now LDA organization
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
      created_by: '01933fa3-2b2b-73d3-b04f-1b0d9a1e8b9f' // Romeo's user ID
    }

    console.log('📋 Données contrat à créer:', JSON.stringify(contractData, null, 2))

    const { data: contrat, error } = await supabase
      .from('contrats')
      .insert(contractData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création contrat:', error)
      return
    }

    console.log('✅ Contrat créé avec succès!')
    console.log(`   - ID: ${contrat.id}`)
    console.log(`   - Type: ${contrat.type_contrat}`) 
    console.log(`   - Dates: ${contrat.date_debut} → ${contrat.date_fin}`)
    console.log(`   - Commission: ${contrat.commission_pourcentage}%`)
    console.log(`   - Organisation: ${contrat.organisation_id}`)
    console.log(`   - Propriété: ${contrat.propriete_id}`)
    
    return contrat

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

createContractDirect()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erreur script:', error)
    process.exit(1)
  })
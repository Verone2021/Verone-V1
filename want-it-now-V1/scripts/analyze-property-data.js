const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzePropertyData() {
  console.log('🔍 Analyse des données pour la création du contrat...\n')
  
  // 1. Rechercher la propriété Baramares
  const { data: properties, error: propError } = await supabase
    .from('proprietes')
    .select('*')
    .ilike('nom', '%Baramares%')

  if (propError) {
    console.error('Erreur propriétés:', propError)
    return
  }

  if (properties.length === 0) {
    console.log('❌ Aucune propriété Baramares trouvée')
    return
  }

  const property = properties[0]
  console.log('🏠 Propriété trouvée:')
  console.log(`   - ID: ${property.id}`)
  console.log(`   - Nom: ${property.nom}`)
  console.log(`   - Type: ${property.type}`)
  console.log(`   - Ville: ${property.ville}`)
  console.log(`   - Pays: ${property.pays}`)
  console.log(`   - Organisation ID: ${property.organisation_id}`)
  console.log(`   - Adresse complète disponible: ${JSON.stringify(property, null, 2)}\n`)

  // 2. Récupérer l'organisation
  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', property.organisation_id)
    .single()

  if (orgError) {
    console.error('Erreur organisation:', orgError)
  } else {
    console.log('🏢 Organisation:')
    console.log(`   - Nom: ${org.nom}`)
    console.log(`   - Pays: ${org.pays}`)
    console.log(`   - SIRET: ${org.siret}`)
    console.log(`   - Adresse: ${org.adresse_siege}\n`)
  }

  // 3. Récupérer les propriétaires et quotités
  const { data: ownership, error: ownerError } = await supabase
    .from('property_ownership')
    .select(`
      proprietaire_id,
      quotite_numerateur,
      quotite_denominateur,
      proprietaires!inner (
        nom,
        prenom,
        type,
        email,
        telephone,
        forme_juridique,
        iban,
        numero_identification
      )
    `)
    .eq('propriete_id', property.id)
    .is('date_fin', null)

  if (ownerError) {
    console.error('Erreur propriétaires:', ownerError)
  } else {
    console.log('👥 Propriétaires et quotités:')
    ownership.forEach((item, index) => {
      const owner = item.proprietaires
      const quotite = (item.quotite_numerateur / item.quotite_denominateur * 100).toFixed(2)
      
      console.log(`   ${index + 1}. ${owner.prenom || ''} ${owner.nom} (${quotite}%)`)
      console.log(`      - Type: ${owner.type}`)
      console.log(`      - Email: ${owner.email || 'Non renseigné'}`)
      console.log(`      - Téléphone: ${owner.telephone || 'Non renseigné'}`)
      console.log(`      - Forme juridique: ${owner.forme_juridique || 'Non renseignée'}`)
      console.log(`      - IBAN: ${owner.iban || 'Non renseigné'}`)
      console.log(`      - N° identification: ${owner.numero_identification || 'Non renseigné'}`)
      console.log(`      - Quotité: ${item.quotite_numerateur}/${item.quotite_denominateur}\n`)
    })

    // Vérifier que les quotités font bien 100%
    const totalQuotite = ownership.reduce((sum, item) => 
      sum + (item.quotite_numerateur / item.quotite_denominateur), 0)
    
    console.log(`✅ Total quotités: ${(totalQuotite * 100).toFixed(2)}%`)
  }

  return {
    property,
    organization: org,
    owners: ownership
  }
}

analyzePropertyData()
  .then(() => {
    console.log('\n✅ Analyse terminée')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
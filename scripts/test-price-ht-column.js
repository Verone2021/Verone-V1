/**
 * 🧪 Test Existence Colonne price_ht - Diagnostic Erreur 42703
 * Date: 28/09/2025
 * Objectif: Vérifier si la colonne price_ht existe dans la table products
 */

const { createClient } = require('@supabase/supabase-js')

async function testPriceHTColumn() {
  console.log('🔍 Test existence colonne price_ht...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Test 1: Requête simple sur products avec price_ht
    console.log('📋 Test 1: SELECT avec price_ht...')
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id, name, price_ht')
      .limit(1)

    if (testError) {
      console.log('❌ ERREUR Test 1:', testError.message)
      if (testError.code === '42703') {
        console.log('🎯 CONFIRMÉ: Erreur 42703 - colonne price_ht introuvable')
      }
    } else {
      console.log('✅ Test 1 réussi - colonne price_ht existe')
      console.log('📊 Exemple données:', testData?.[0])
    }

    // Test 2: Requête comme dans use-collections.ts (ligne 414)
    console.log('\n📋 Test 2: Requête collections exacte...')
    const { data: collectionData, error: collectionError } = await supabase
      .from('collection_products')
      .select(`
        position,
        products:product_id (
          id,
          name,
          price_ht,
          product_images!left (
            public_url,
            is_primary
          )
        )
      `)
      .limit(1)

    if (collectionError) {
      console.log('❌ ERREUR Test 2:', collectionError.message)
      if (collectionError.code === '42703') {
        console.log('🎯 CONFIRMÉ: Erreur 42703 dans requête collections')
      }
    } else {
      console.log('✅ Test 2 réussi - requête collections OK')
      console.log('📊 Exemple données:', collectionData?.[0])
    }

    // Test 3: Vérification structure table via information_schema
    console.log('\n📋 Test 3: Vérification structure table...')
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' })

    if (schemaError) {
      console.log('❌ ERREUR Test 3:', schemaError.message)
    } else {
      console.log('✅ Test 3 réussi - structure table récupérée')
      const priceColumns = schemaData?.filter(col =>
        col.column_name.includes('price')
      )
      console.log('📊 Colonnes prix trouvées:', priceColumns)
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }

  console.log('\n🏁 Test terminé')
}

// Exécution
if (require.main === module) {
  testPriceHTColumn()
}

module.exports = { testPriceHTColumn }
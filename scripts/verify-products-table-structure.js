/**
 * 🔍 Vérification Structure Table Products - Diagnostic Complet
 * Date: 28/09/2025
 * Objectif: Analyser la structure actuelle de la table products
 */

const { createClient } = require('@supabase/supabase-js')

async function verifyProductsTableStructure() {
  console.log('🔍 Analyse structure table products...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Test: Récupération structure via requête raw SQL
    console.log('📋 Récupération colonnes via SQL...')

    const { data: columns, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = 'products'
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    if (error) {
      console.log('❌ Erreur SQL:', error.message)

      // Plan B: Test direct de colonnes communes
      console.log('\n📋 Plan B: Test colonnes individuelles...')

      const testColumns = [
        'id', 'name', 'sku', 'price_ht', 'cost_price',
        'supplier_cost_price', 'estimated_selling_price', 'status'
      ]

      for (const column of testColumns) {
        try {
          const { data, error: colError } = await supabase
            .from('products')
            .select(column)
            .limit(1)

          if (colError) {
            console.log(`❌ ${column}: ${colError.message}`)
          } else {
            console.log(`✅ ${column}: OK`)
          }
        } catch (err) {
          console.log(`💥 ${column}: Erreur inattendue`)
        }
      }

    } else {
      console.log('✅ Structure table récupérée:')
      console.table(columns)

      // Analyse spécifique des colonnes prix
      const priceColumns = columns.filter(col =>
        col.column_name.toLowerCase().includes('price')
      )

      console.log('\n💰 Colonnes prix identifiées:')
      priceColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`)
      })

      // Vérification si price_ht existe
      const hasPriceHT = columns.some(col => col.column_name === 'price_ht')

      if (hasPriceHT) {
        console.log('\n✅ CONCLUSION: Colonne price_ht EXISTE')
      } else {
        console.log('\n❌ CONCLUSION: Colonne price_ht MANQUANTE')
        console.log('🔧 Action requise: Appliquer migration 20250916_010_fix_prices_to_euros.sql')
      }
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }

  console.log('\n🏁 Analyse terminée')
}

// Exécution
if (require.main === module) {
  verifyProductsTableStructure()
}

module.exports = { verifyProductsTableStructure }
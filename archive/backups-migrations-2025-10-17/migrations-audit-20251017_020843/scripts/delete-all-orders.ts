/**
 * Script de suppression TOTALE des commandes et mouvements
 * ATTENTION: Opération irréversible - supprime TOUTES les données de commandes
 * Usage: npx tsx scripts/delete-all-orders.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MANQUANT')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'MANQUANT')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteAllOrderData() {
  console.log('\n🗑️  DÉBUT DE LA SUPPRESSION TOTALE DES COMMANDES\n')
  console.log('⚠️  Cette opération va supprimer:')
  console.log('   - Toutes les sales_orders (commandes clients)')
  console.log('   - Toutes les purchase_orders (commandes fournisseurs)')
  console.log('   - Tous les stock_movements liés')
  console.log('   - Tous les items associés (sales_order_items, purchase_order_items)')
  console.log('\n⚠️  Les produits NE SERONT PAS touchés\n')

  try {
    // 1. Compter les données AVANT suppression
    console.log('📊 Comptage des données actuelles...')
    const [soCount, poCount, smCount, productsCount] = await Promise.all([
      supabase.from('sales_orders').select('*', { count: 'exact', head: true }),
      supabase.from('purchase_orders').select('*', { count: 'exact', head: true }),
      supabase.from('stock_movements').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true })
    ])

    console.log(`   Sales Orders: ${soCount.count}`)
    console.log(`   Purchase Orders: ${poCount.count}`)
    console.log(`   Stock Movements: ${smCount.count}`)
    console.log(`   Products: ${productsCount.count} (NE SERONT PAS SUPPRIMÉS)`)

    if (soCount.count === 0 && poCount.count === 0 && smCount.count === 0) {
      console.log('\n✅ Base déjà vide, rien à supprimer.')
      return
    }

    // 2. Suppression Sales Orders (CASCADE vers sales_order_items + stock_movements)
    console.log('\n🗑️  Suppression des Sales Orders...')
    const { error: soError } = await supabase
      .from('sales_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tout sauf ID impossible

    if (soError) {
      console.error('❌ Erreur suppression sales_orders:', soError.message)
      throw soError
    }
    console.log('✅ Sales Orders supprimées')

    // 3. Suppression Purchase Orders (CASCADE vers purchase_order_items + stock_movements)
    console.log('\n🗑️  Suppression des Purchase Orders...')
    const { error: poError } = await supabase
      .from('purchase_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (poError) {
      console.error('❌ Erreur suppression purchase_orders:', poError.message)
      throw poError
    }
    console.log('✅ Purchase Orders supprimées')

    // 4. Suppression mouvements orphelins (si CASCADE n'a pas fonctionné)
    console.log('\n🗑️  Nettoyage mouvements orphelins...')
    const { error: smError } = await supabase
      .from('stock_movements')
      .delete()
      .in('reference_type', ['sales_order', 'purchase_order'])

    if (smError) {
      console.warn('⚠️  Warning suppression stock_movements:', smError.message)
    } else {
      console.log('✅ Mouvements orphelins supprimés')
    }

    // 5. Vérification finale
    console.log('\n📊 Vérification finale...')
    const [soFinal, poFinal, smFinal, productsFinal] = await Promise.all([
      supabase.from('sales_orders').select('*', { count: 'exact', head: true }),
      supabase.from('purchase_orders').select('*', { count: 'exact', head: true }),
      supabase.from('stock_movements').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true })
    ])

    console.log(`   Sales Orders: ${soFinal.count}`)
    console.log(`   Purchase Orders: ${poFinal.count}`)
    console.log(`   Stock Movements: ${smFinal.count}`)
    console.log(`   Products: ${productsFinal.count} ✅ (PRÉSERVÉS)`)

    if (soFinal.count === 0 && poFinal.count === 0 && smFinal.count === 0) {
      console.log('\n✅ ✅ ✅ SUPPRESSION TOTALE RÉUSSIE ✅ ✅ ✅')
      console.log(`   ${soCount.count} sales_orders supprimées`)
      console.log(`   ${poCount.count} purchase_orders supprimées`)
      console.log(`   ${smCount.count} stock_movements supprimés`)
      console.log(`   ${productsFinal.count} products PRÉSERVÉS`)
    } else {
      console.warn('\n⚠️  Attention: Certaines données n\'ont pas été supprimées')
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message)
    process.exit(1)
  }
}

// Exécution
deleteAllOrderData()
  .then(() => {
    console.log('\n✅ Script terminé avec succès\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script échoué:', error)
    process.exit(1)
  })

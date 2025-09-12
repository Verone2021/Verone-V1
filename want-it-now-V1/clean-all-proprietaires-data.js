/**
 * Script pour nettoyer complètement TOUTES les données liées aux propriétaires
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_ACCESS_TOKEN=... node clean-all-proprietaires-data.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.log('Requis: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanAllProprietairesData() {
  console.log('🧹 Nettoyage COMPLET de toutes les données propriétaires...')
  
  try {
    // 1. État initial
    console.log('\n📊 État initial:')
    const tables = [
      'property_ownership',
      'propriete_proprietaires', 
      'associes',
      'proprietaires'
    ]
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        console.log(`   ${table}: ${count || 0} enregistrements`)
      } catch (error) {
        console.log(`   ${table}: Table n'existe peut-être pas`)
      }
    }
    
    // 2. Suppression en cascade dans l'ordre des dépendances
    const deletionOrder = [
      'property_ownership',
      'propriete_proprietaires',
      'associes', 
      'proprietaires'
    ]
    
    console.log('\n🗑️ Suppression en cascade...')
    
    for (const table of deletionOrder) {
      try {
        console.log(`   Suppression table ${table}...`)
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tout
        
        if (error) {
          console.log(`   ⚠️ ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ ${table}: Nettoyé avec succès`)
        }
      } catch (error) {
        console.log(`   ℹ️ ${table}: Table non accessible ou n'existe pas`)
      }
    }
    
    // 3. Vérification finale
    console.log('\n🔍 Vérification finale:')
    
    let allClean = true
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        console.log(`   ${table}: ${count || 0} enregistrements restants`)
        if ((count || 0) > 0) allClean = false
      } catch (error) {
        console.log(`   ${table}: Non accessible`)
      }
    }
    
    if (allClean) {
      console.log('\n🎉 NETTOYAGE COMPLET RÉUSSI!')
      console.log('📋 Base de données parfaitement nettoyée')
      console.log('🚀 Prête pour les 2 propriétaires test')
    } else {
      console.log('\n⚠️ Nettoyage partiel - certaines données persistent')
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du nettoyage:', error)
    process.exit(1)
  }
}

// Exécuter le nettoyage
cleanAllProprietairesData()
/**
 * Script pour nettoyer complètement la base de données propriétaires
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_ACCESS_TOKEN=... node clean-proprietaires-db.js
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

async function cleanDatabase() {
  console.log('🧹 Début du nettoyage complet de la base de données...')
  
  try {
    // 1. Compter les enregistrements existants
    console.log('\n📊 État actuel de la base:')
    
    const { count: associesCount } = await supabase
      .from('associes')
      .select('*', { count: 'exact', head: true })
    
    const { count: proprietairesCount } = await supabase
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   Associés existants: ${associesCount || 0}`)
    console.log(`   Propriétaires existants: ${proprietairesCount || 0}`)
    
    // 2. Supprimer tous les associés (dépendances en premier)
    console.log('\n🗑️ Suppression des associés...')
    const { error: associesError } = await supabase
      .from('associes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tout
    
    if (associesError) {
      console.error('❌ Erreur suppression associés:', associesError)
    } else {
      console.log('✅ Tous les associés supprimés')
    }
    
    // 3. Supprimer tous les propriétaires
    console.log('\n🗑️ Suppression des propriétaires...')
    const { error: proprietairesError } = await supabase
      .from('proprietaires')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Supprimer tout
    
    if (proprietairesError) {
      console.error('❌ Erreur suppression propriétaires:', proprietairesError)
    } else {
      console.log('✅ Tous les propriétaires supprimés')
    }
    
    // 4. Vérifier le nettoyage
    console.log('\n🔍 Vérification du nettoyage:')
    
    const { count: newAssociesCount } = await supabase
      .from('associes')
      .select('*', { count: 'exact', head: true })
    
    const { count: newProprietairesCount } = await supabase
      .from('proprietaires')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   Associés restants: ${newAssociesCount || 0}`)
    console.log(`   Propriétaires restants: ${newProprietairesCount || 0}`)
    
    if ((newAssociesCount || 0) === 0 && (newProprietairesCount || 0) === 0) {
      console.log('\n🎉 Nettoyage complet réussi!')
      console.log('📋 Base de données prête pour les nouveaux propriétaires test')
    } else {
      console.log('\n⚠️ Nettoyage partiel - vérifier les contraintes')
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du nettoyage:', error)
    process.exit(1)
  }
}

// Exécuter le nettoyage
cleanDatabase()
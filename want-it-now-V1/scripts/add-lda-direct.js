#!/usr/bin/env node

/**
 * Script simple pour ajouter LDA à l'ENUM via requête SQL directe
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addLDAToEnum() {
  console.log('🔧 Ajout de LDA à l\'ENUM forme_juridique_enum...')
  
  try {
    // Méthode simple : exécuter ALTER TYPE directement
    const { data, error } = await supabase.rpc('sql', {
      query: `ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'LDA';`
    })

    if (error) {
      console.error('❌ Erreur SQL:', error)
      
      // Alternative : utiliser une fonction PostgreSQL simple
      console.log('🔄 Tentative avec fonction alternative...')
      const { data: data2, error: error2 } = await supabase
        .from('pg_enum')
        .select('enumlabel')
        .eq('enumlabel', 'LDA')
      
      if (error2) {
        console.error('❌ Impossible de vérifier l\'existence de LDA:', error2)
        return false
      }
      
      if (data2 && data2.length > 0) {
        console.log('✅ LDA existe déjà dans l\'ENUM')
        return true
      } else {
        console.log('ℹ️ LDA n\'existe pas, il faut l\'ajouter manuellement via le dashboard Supabase')
        console.log('📋 SQL à exécuter : ALTER TYPE forme_juridique_enum ADD VALUE \'LDA\';')
        return false
      }
    }
    
    console.log('✅ LDA ajouté avec succès à l\'ENUM !')
    return true
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Script d\'ajout LDA à l\'ENUM')
  console.log('============================================================')
  
  const success = await addLDAToEnum()
  
  if (success) {
    console.log('✅ Opération terminée avec succès')
  } else {
    console.log('⚠️ Échec - Ajouter LDA manuellement via dashboard Supabase')
    console.log('📋 SQL : ALTER TYPE forme_juridique_enum ADD VALUE \'LDA\';')
  }
  
  console.log('============================================================')
}

main().catch(console.error)
#!/usr/bin/env node

/**
 * Script pour appliquer la migration individual_customers
 *
 * Usage: node scripts/apply-migration-individual-customers.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  process.exit(1)
}

console.log('🔌 Connexion à Supabase...')
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Lire le fichier SQL
const migrationPath = join(__dirname, '../supabase/migrations/20251013_023_create_individual_customers_table.sql')
console.log(`📄 Lecture migration: ${migrationPath}`)

try {
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('🚀 Application de la migration...')

  // Exécuter le SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  })

  if (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error)
    process.exit(1)
  }

  console.log('✅ Migration appliquée avec succès!')
  console.log('📊 Table individual_customers créée')

  // Vérifier que la table existe
  const { data: tables, error: checkError } = await supabase
    .from('individual_customers')
    .select('id')
    .limit(1)

  if (checkError) {
    console.warn('⚠️ Attention:', checkError.message)
  } else {
    console.log('✅ Table individual_customers accessible')
  }

} catch (error) {
  console.error('❌ Erreur:', error.message)
  process.exit(1)
}

console.log('\n🎉 Migration terminée!')

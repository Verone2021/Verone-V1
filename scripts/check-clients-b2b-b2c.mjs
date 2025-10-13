#!/usr/bin/env node

/**
 * Script: Vérifier séparation clients B2B/B2C
 * Date: 2025-10-13
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('========================================')
console.log('VÉRIFICATION CLIENTS B2B vs B2C')
console.log('========================================')
console.log('')

// Vérifier organisations (B2B)
console.log('=== ORGANISATIONS (B2B) ===')
const { data: orgs, error: orgError } = await supabase
  .from('organisations')
  .select('id, name, type, email')
  .eq('type', 'customer')
  .order('name')

if (orgError) {
  console.error('❌ Erreur:', orgError.message)
} else {
  console.log(`Total organisations B2B: ${orgs.length}`)
  console.log('')
  console.log('Premières 10 organisations:')
  orgs.slice(0, 10).forEach(org => {
    console.log(`  - ${org.name} (${org.email || 'pas d\'email'})`)
  })
}

console.log('')
console.log('=== CLIENTS PARTICULIERS (B2C) ===')
const { data: individuals, error: indError } = await supabase
  .from('individual_customers')
  .select('id, first_name, last_name, email')
  .order('first_name')

if (indError) {
  console.error('❌ Erreur:', indError.message)
} else {
  console.log(`Total clients particuliers B2C: ${individuals.length}`)
  console.log('')
  if (individuals.length > 0) {
    console.log('Tous les clients particuliers:')
    individuals.forEach(ind => {
      console.log(`  - ${ind.first_name} ${ind.last_name} (${ind.email || 'pas d\'email'})`)
    })
  } else {
    console.log('⚠️ Aucun client particulier trouvé')
  }
}

console.log('')
console.log('=== ANALYSE ===')
console.log('')

// Vérifier si "Jean Martin" et "Marie Dupont" existent
const jeanMartin = orgs?.find(o => o.name === 'Jean Martin')
const marieDupont = orgs?.find(o => o.name === 'Marie Dupont')

if (jeanMartin) {
  console.log('🔴 PROBLÈME: "Jean Martin" existe comme ORGANISATION (table organisations)')
  console.log(`   → ID: ${jeanMartin.id}`)
  console.log(`   → Type: ${jeanMartin.type}`)
  console.log(`   → C'est un nom de PERSONNE, pas d'organisation !`)
  console.log('')
}

if (marieDupont) {
  console.log('🔴 PROBLÈME: "Marie Dupont" existe comme ORGANISATION (table organisations)')
  console.log(`   → ID: ${marieDupont.id}`)
  console.log(`   → Type: ${marieDupont.type}`)
  console.log(`   → C'est un nom de PERSONNE, pas d'organisation !`)
  console.log('')
}

if (jeanMartin || marieDupont) {
  console.log('🔴 CONCLUSION: Ces données sont dans la MAUVAISE TABLE')
  console.log('   → Organisations = Entreprises B2B (Pokawa, Hotel Le Luxe, etc.)')
  console.log('   → Individual_customers = Clients particuliers B2C (Jean Martin, Marie Dupont, etc.)')
  console.log('')
  console.log('📝 RECOMMANDATION:')
  console.log('   1. Supprimer "Jean Martin" et "Marie Dupont" de la table organisations')
  console.log('   2. OU les migrer vers individual_customers')
  console.log('   3. OU les renommer en noms d\'entreprise (ex: "Jean Martin SARL")')
} else {
  console.log('✅ Pas de pollution : organisations contient uniquement des entreprises')
}

console.log('========================================')

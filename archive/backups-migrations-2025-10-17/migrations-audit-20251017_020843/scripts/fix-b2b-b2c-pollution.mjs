#!/usr/bin/env node

/**
 * Script: Fix B2B/B2C Data Pollution
 * Date: 2025-10-13
 * Objectif: Supprimer les clients particuliers de la table organisations
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
console.log('FIX: Pollution B2B/B2C')
console.log('========================================')
console.log('')

// Liste des noms de personnes à supprimer de organisations
const personsToRemove = ['Jean Martin', 'Marie Dupont']

console.log('⚠️  Suppression des clients particuliers de la table organisations...')
console.log('')

for (const personName of personsToRemove) {
  // Vérifier d'abord si utilisé dans des commandes
  const { data: orders, error: checkError } = await supabase
    .from('sales_orders')
    .select('id, order_number')
    .eq('customer_type', 'organization')
    .in('customer_id',
      await supabase
        .from('organisations')
        .select('id')
        .eq('name', personName)
        .then(r => r.data?.map(o => o.id) || [])
    )

  if (checkError) {
    console.error(`❌ Erreur vérification commandes pour ${personName}:`, checkError.message)
    continue
  }

  if (orders && orders.length > 0) {
    console.log(`⚠️  ${personName} a ${orders.length} commande(s) liée(s) - CONSERVATION`)
    console.log(`   Commandes: ${orders.map(o => o.order_number).join(', ')}`)
    console.log(`   → Ne peut pas être supprimé (contrainte référentielle)`)
    console.log('')
    continue
  }

  // Supprimer si aucune commande
  const { error: deleteError } = await supabase
    .from('organisations')
    .delete()
    .eq('name', personName)

  if (deleteError) {
    console.error(`❌ Erreur suppression ${personName}:`, deleteError.message)
  } else {
    console.log(`✅ ${personName} supprimé de la table organisations`)
  }
}

console.log('')
console.log('=== VÉRIFICATION FINALE ===')
console.log('')

const { data: remainingOrgs } = await supabase
  .from('organisations')
  .select('name')
  .eq('type', 'customer')
  .order('name')

console.log(`Organisations B2B restantes: ${remainingOrgs?.length || 0}`)
console.log('')

// Vérifier qu'il ne reste plus de noms de personnes
const personNames = remainingOrgs?.filter(o =>
  o.name.split(' ').length === 2 &&
  !o.name.includes('Pokawa') &&
  !o.name.includes('Hotel') &&
  !o.name.includes('Restaurant') &&
  !o.name.includes('Boutique')
)

if (personNames && personNames.length > 0) {
  console.log('⚠️  Noms suspects (peut-être des personnes):')
  personNames.forEach(o => console.log(`  - ${o.name}`))
} else {
  console.log('✅ Aucun nom de personne détecté dans organisations')
}

console.log('')
console.log('========================================')
console.log('✅ Fix terminé')
console.log('========================================')

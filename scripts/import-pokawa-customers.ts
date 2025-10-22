/**
 * Script d'import des données clients Pokawa depuis CSV
 *
 * Met à jour les champs suivants pour chaque client :
 * - Adresse complète (billing_address_line1, billing_postal_code, billing_city, billing_country)
 * - SIRET (siren)
 * - Email
 * - Téléphone
 * - Notes (Propre/Franchise depuis colonne Commentaire)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import csvParser from 'csv-parser'
import { Readable } from 'stream'

// Configuration Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface PokawaCustomer {
  name: string
  entreprise: string
  adresse: string
  siret: string
  url: string
  codePostal: string
  ville: string
  pays: string
  email: string
  telephone: string
  commentaire: string
}

/**
 * Parse le fichier CSV et retourne un tableau d'objets
 */
async function parseCSV(filePath: string): Promise<PokawaCustomer[]> {
  return new Promise((resolve, reject) => {
    const customers: PokawaCustomer[] = []

    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csvParser())
      .on('data', (row: any) => {
        // Nettoyer le BOM si présent
        const name = Object.keys(row)[0]
        const actualRow = name.startsWith('\ufeff')
          ? { [name.replace('\ufeff', '')]: row[name], ...Object.fromEntries(Object.entries(row).slice(1)) }
          : row

        customers.push({
          name: actualRow['Name'] || '',
          entreprise: actualRow['Nom entreprise'] || '',
          adresse: actualRow['Adresse'] || '',
          siret: actualRow['SIRET / Identifiant fiscal'] || '',
          url: actualRow['Url'] || '',
          codePostal: (actualRow['Code postal'] || '').toString().trim(),
          ville: actualRow['Ville'] || '',
          pays: actualRow['Pays'] || '',
          email: actualRow['Email'] || '',
          telephone: actualRow['Téléphone'] || '',
          commentaire: actualRow['Commentaire'] || ''
        })
      })
      .on('end', () => resolve(customers))
      .on('error', reject)
  })
}

/**
 * Met à jour un client dans la base de données
 */
async function updateCustomer(customer: PokawaCustomer) {
  try {
    // Chercher le client par nom (insensible à la casse)
    const searchName = customer.entreprise.replace(/^\d+\s*-\s*/, '') // Remove leading number

    const { data: existingCustomers, error: searchError } = await supabase
      .from('organisations')
      .select('id, legal_name, trade_name')
      .eq('type', 'customer')
      .or(`legal_name.ilike.%${searchName}%,trade_name.ilike.%${searchName}%`)
      .limit(1)

    if (searchError) {
      console.error(`❌ Erreur recherche ${customer.entreprise}:`, searchError.message)
      return { success: false, customer: customer.entreprise, error: searchError.message }
    }

    if (!existingCustomers || existingCustomers.length === 0) {
      console.warn(`⚠️  Client non trouvé: ${customer.entreprise}`)
      return { success: false, customer: customer.entreprise, error: 'Not found' }
    }

    const customerId = existingCustomers[0].id

    // Préparer les données de mise à jour (seulement si non vide)
    const updateData: any = {}

    if (customer.adresse) updateData.billing_address_line1 = customer.adresse
    if (customer.codePostal) updateData.billing_postal_code = customer.codePostal.substring(0, 9) // Tronquer à 9 caractères max
    if (customer.ville) updateData.billing_city = customer.ville
    if (customer.pays) updateData.billing_country = customer.pays
    if (customer.siret) updateData.siren = customer.siret.replace(/\s/g, '').substring(0, 9) // Garder seulement SIREN (9 chiffres)
    if (customer.email) updateData.email = customer.email
    if (customer.telephone) updateData.phone = customer.telephone
    if (customer.commentaire) updateData.notes = customer.commentaire

    // Mettre à jour le client
    const { error: updateError } = await supabase
      .from('organisations')
      .update(updateData)
      .eq('id', customerId)

    if (updateError) {
      console.error(`❌ Erreur mise à jour ${customer.entreprise}:`, updateError.message)
      return { success: false, customer: customer.entreprise, error: updateError.message }
    }

    console.log(`✅ Mis à jour: ${customer.entreprise}`)
    return { success: true, customer: customer.entreprise }

  } catch (error: any) {
    console.error(`❌ Exception ${customer.entreprise}:`, error.message)
    return { success: false, customer: customer.entreprise, error: error.message }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage import clients Pokawa...\n')

  // Path vers le CSV
  const csvPath = path.join(__dirname, '../docs/Clients Pro – Liste.csv')

  if (!fs.existsSync(csvPath)) {
    console.error('❌ Fichier CSV introuvable:', csvPath)
    process.exit(1)
  }

  // Parser le CSV
  console.log('📄 Parsing CSV...')
  const customers = await parseCSV(csvPath)
  console.log(`✅ ${customers.length} clients trouvés dans le CSV\n`)

  // Statistiques
  let success = 0
  let failed = 0
  const errors: string[] = []

  // Mettre à jour chaque client
  console.log('🔄 Mise à jour des clients...\n')

  for (const customer of customers) {
    const result = await updateCustomer(customer)

    if (result.success) {
      success++
    } else {
      failed++
      errors.push(`${result.customer}: ${result.error}`)
    }

    // Petit délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ:')
  console.log(`✅ Succès: ${success}`)
  console.log(`❌ Échecs: ${failed}`)

  if (errors.length > 0) {
    console.log('\n⚠️  ERREURS:')
    errors.forEach(err => console.log(`  - ${err}`))
  }

  console.log('\n✨ Import terminé!')
}

// Exécuter
main().catch(console.error)

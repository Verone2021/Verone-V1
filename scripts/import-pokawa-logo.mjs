#!/usr/bin/env node

/**
 * Script d'import du logo Pokawa pour tous les clients Pokawa
 *
 * Ce script :
 * 1. Lit le fichier logo Pokawa depuis docs/Logo Pokawa 2025.png
 * 2. Upload une copie pour chaque client Pokawa dans Supabase Storage
 * 3. Met à jour la database avec le path du logo
 *
 * Usage: node scripts/import-pokawa-logo.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Setup __dirname pour ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables Supabase manquantes dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Chemin du logo source
const LOGO_SOURCE_PATH = path.join(__dirname, '../docs/Logo Pokawa 2025.png')
const BUCKET_NAME = 'organisation-logos'

/**
 * Upload le logo Pokawa pour un client
 */
async function uploadLogoForClient(clientId, clientName, logoBuffer) {
  try {
    const filename = 'logo-pokawa.png'
    const storagePath = `${clientId}/${filename}`

    // Upload dans Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, logoBuffer, {
        contentType: 'image/png',
        upsert: true // Remplacer si existe déjà
      })

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`)
    }

    // Update database
    const { error: updateError } = await supabase
      .from('organisations')
      .update({ logo_url: storagePath })
      .eq('id', clientId)

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`)
    }

    return { success: true, path: storagePath }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n🎨 Import Logo Pokawa - Clients Vérone\n')
  console.log('='.repeat(50))

  // 1. Vérifier que le fichier source existe
  if (!fs.existsSync(LOGO_SOURCE_PATH)) {
    console.error(`❌ Fichier logo introuvable : ${LOGO_SOURCE_PATH}`)
    process.exit(1)
  }

  // 2. Lire le fichier logo
  console.log(`📁 Lecture du logo : ${path.basename(LOGO_SOURCE_PATH)}`)
  const logoBuffer = fs.readFileSync(LOGO_SOURCE_PATH)
  const logoSizeKB = (logoBuffer.length / 1024).toFixed(2)
  console.log(`✅ Logo chargé : ${logoSizeKB} KB\n`)

  // 3. Récupérer tous les clients Pokawa
  console.log('🔍 Récupération des clients Pokawa...')
  const { data: pokawaClients, error: fetchError } = await supabase
    .from('organisations')
    .select('id, name, logo_url')
    .eq('type', 'customer')
    .ilike('name', '%pokawa%')
    .order('name')

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération des clients:', fetchError)
    process.exit(1)
  }

  console.log(`✅ ${pokawaClients.length} clients Pokawa trouvés\n`)

  // 4. Import progressif
  let successCount = 0
  let errorCount = 0
  const errors = []

  for (let i = 0; i < pokawaClients.length; i++) {
    const client = pokawaClients[i]
    const progress = `[${i + 1}/${pokawaClients.length}]`

    process.stdout.write(`${progress} ${client.name}...`)

    const result = await uploadLogoForClient(client.id, client.name, logoBuffer)

    if (result.success) {
      successCount++
      console.log(` ✅`)
    } else {
      errorCount++
      console.log(` ❌`)
      errors.push({ name: client.name, error: result.error })
    }

    // Petit délai pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // 5. Rapport final
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ DE L\'IMPORT\n')
  console.log(`✅ Succès     : ${successCount}`)
  console.log(`❌ Échecs     : ${errorCount}`)
  console.log(`📁 Total      : ${pokawaClients.length}`)

  if (errors.length > 0) {
    console.log('\n⚠️  ERREURS DÉTAILLÉES:\n')
    errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.name}`)
      console.log(`   ${err.error}\n`)
    })
  }

  console.log('\n✨ Import terminé!')
}

// Exécution
main().catch(console.error)

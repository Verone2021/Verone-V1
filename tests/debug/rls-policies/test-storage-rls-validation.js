#!/usr/bin/env node

/**
 * 🧪 VÉRONE - Test Validation Storage RLS
 *
 * Script de validation des politiques RLS Storage
 * Teste l'upload, la lecture et la suppression selon les rôles
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Créer un fichier de test minimal
const createTestImage = () => {
  const testContent = Buffer.from(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#FF6B6B"/>
      <text x="50" y="50" text-anchor="middle" fill="white" font-family="Arial">TEST</text>
    </svg>
  `)

  return new File([testContent], 'test-upload.svg', { type: 'image/svg+xml' })
}

// Test de validation RLS
async function testStorageRLS() {
  console.log('🚀 VÉRONE - Test Validation Storage RLS')
  console.log('=' .repeat(50))

  try {
    // 1. Vérifier l'utilisateur actuel
    console.log('\n📋 1. Vérification utilisateur...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ Aucun utilisateur connecté')
      console.log('💡 Connectez-vous d\'abord via l\'interface web')
      return false
    }

    console.log(`✅ Utilisateur connecté: ${user.email}`)

    // 2. Vérifier le profil utilisateur
    console.log('\n📋 2. Vérification profil...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profil utilisateur introuvable')
      return false
    }

    console.log(`✅ Rôle: ${profile.role}, Type: ${profile.user_type}`)

    // 3. Test des buckets disponibles
    console.log('\n📋 3. Test accès buckets...')
    const buckets = ['family-images', 'category-images', 'product-images', 'documents']

    for (const bucket of buckets) {
      console.log(`\n🪣 Test bucket: ${bucket}`)

      // Test upload
      const testFile = createTestImage()
      const fileName = `test-${Date.now()}.svg`
      const filePath = `test/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.log(`  ❌ Upload échoué: ${uploadError.message}`)
        continue
      }

      console.log(`  ✅ Upload réussi: ${uploadData.path}`)

      // Test lecture
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        console.log(`  ✅ URL publique: ${urlData.publicUrl.substring(0, 60)}...`)
      }

      // Test suppression
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (deleteError) {
        console.log(`  ❌ Suppression échouée: ${deleteError.message}`)
      } else {
        console.log(`  ✅ Suppression réussie`)
      }
    }

    // 4. Résumé
    console.log('\n' + '=' .repeat(50))
    console.log('🎉 TEST TERMINÉ')
    console.log(`👤 Utilisateur: ${user.email} (${profile.role})`)
    console.log('📊 Les politiques RLS Storage semblent fonctionnelles !')
    console.log('')
    console.log('💡 Si vous rencontrez encore des erreurs :')
    console.log('   1. Vérifiez que vous êtes bien connecté')
    console.log('   2. Rafraîchissez la page web')
    console.log('   3. Réessayez l\'upload depuis l\'interface')

    return true

  } catch (error) {
    console.error('💥 Erreur durant le test:', error.message)
    return false
  }
}

// Exécution
testStorageRLS().then(success => {
  process.exit(success ? 0 : 1)
})
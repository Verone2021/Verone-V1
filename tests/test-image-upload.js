/**
 * Test de validation de l'upload d'images
 * Vérifie que les buckets et la table documents fonctionnent
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Utiliser le service role pour les tests
const supabase = createClient(
  'https://aorroydfjsrygmosnzrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY'
)

async function testImageUploadSystem() {
  console.log('🧪 TEST SYSTÈME UPLOAD IMAGES')
  console.log('==============================')

  try {
    // 1. Test des buckets Storage
    console.log('\n📁 TEST 1: Vérification des buckets Storage')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Erreur liste buckets:', bucketsError)
      return false
    }

    const requiredBuckets = ['family-images', 'category-images', 'product-images', 'documents']
    const existingBuckets = buckets.map(b => b.name)

    console.log(`✅ Buckets existants: ${existingBuckets.join(', ')}`)

    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket))
    if (missingBuckets.length > 0) {
      console.error(`❌ Buckets manquants: ${missingBuckets.join(', ')}`)
      return false
    }

    console.log('✅ Tous les buckets requis sont présents!')

    // 2. Test de la table documents
    console.log('\n🗄️  TEST 2: Vérification table documents')
    const { data: tableTest, error: tableError } = await supabase
      .from('documents')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('❌ Erreur table documents:', tableError)
      return false
    }

    console.log('✅ Table documents accessible!')

    // 3. Test upload d'un fichier de test
    console.log('\n📤 TEST 3: Test upload fichier test')

    // Créer un fichier de test simple
    const testImageContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    const timestamp = Date.now()
    const testFileName = `test-${timestamp}.png`
    const testFilePath = `test/${testFileName}`

    // Upload vers le bucket family-images
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('family-images')
      .upload(testFilePath, testImageContent, {
        contentType: 'image/png',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError)
      return false
    }

    console.log('✅ Upload réussi!')
    console.log(`   Chemin: ${uploadData.path}`)

    // 4. Test URL publique
    console.log('\n🌐 TEST 4: Test génération URL publique')
    const { data: urlData } = supabase.storage
      .from('family-images')
      .getPublicUrl(testFilePath)

    if (!urlData?.publicUrl) {
      console.error('❌ Impossible de générer l\'URL publique')
      return false
    }

    console.log('✅ URL publique générée!')
    console.log(`   URL: ${urlData.publicUrl}`)

    // 5. Test insertion métadonnées
    console.log('\n💾 TEST 5: Test insertion métadonnées')
    const documentData = {
      storage_bucket: 'family-images',
      storage_path: testFilePath,
      storage_url: urlData.publicUrl,
      file_name: testFileName,
      original_name: 'test-image.png',
      mime_type: 'image/png',
      file_size: testImageContent.length,
      file_extension: 'png',
      document_type: 'image',
      document_category: 'family_image',
      title: 'Image de test',
      description: 'Image générée pour test automatique',
      access_level: 'internal',
      is_processed: true,
      metadata: { test: true, timestamp }
    }

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single()

    if (docError) {
      console.error('❌ Erreur insertion document:', docError)
      return false
    }

    console.log('✅ Métadonnées sauvegardées!')
    console.log(`   Document ID: ${docData.id}`)

    // 6. Nettoyage
    console.log('\n🧹 NETTOYAGE: Suppression fichier de test')
    await supabase.storage.from('family-images').remove([testFilePath])
    await supabase.from('documents').delete().eq('id', docData.id)
    console.log('✅ Nettoyage terminé!')

    console.log('\n🎉 RÉSULTAT FINAL')
    console.log('================')
    console.log('✅ Tous les tests passent!')
    console.log('✅ Système d\'upload opérationnel')
    console.log('✅ Buckets Storage configurés')
    console.log('✅ Table documents fonctionnelle')
    console.log('✅ Métadonnées sauvegardées')
    console.log('')
    console.log('🎯 Le formulaire famille devrait maintenant fonctionner!')

    return true

  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error)
    return false
  }
}

// Exécuter les tests
testImageUploadSystem()
  .then(success => {
    if (success) {
      console.log('\n✅ SYSTÈME UPLOAD VALIDÉ - Prêt à utiliser!')
      process.exit(0)
    } else {
      console.log('\n❌ DES PROBLÈMES DÉTECTÉS')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 ERREUR:', error)
    process.exit(1)
  })
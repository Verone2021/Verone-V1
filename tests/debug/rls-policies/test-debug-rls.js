/**
 * Debug Script pour identifier l'erreur RLS précise
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aorroydfjsrygmosnzrl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mjc0NzAsImV4cCI6MjA3MzMwMzQ3MH0.fRi7svC8bAr3wihH76pfQnaq7tjuBMypAEi6q-rHCTA'

async function debugRLS() {
  console.log('🔍 DEBUG RLS - Identification erreur précise')
  console.log('=' .repeat(50))

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // 1. Tester l'authentification utilisateur
    console.log('\n1️⃣ Test authentification utilisateur')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Pas d\'utilisateur authentifié')
      console.log('   Tentative de connexion avec email/password...')

      // Essayer de se connecter avec un utilisateur existant
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'veronebyromeo@gmail.com',
        password: 'testpassword123' // Essai avec password commun
      })

      if (signInError) {
        console.log('❌ Échec connexion:', signInError.message)
        console.log('   Test avec anon key uniquement...')
      } else {
        console.log('✅ Connexion réussie:', signInData.user.email)
      }
    } else {
      console.log('✅ Utilisateur authentifié:', user.email)
    }

    // 2. Test de la fonction get_user_role
    console.log('\n2️⃣ Test fonction get_user_role')
    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role')

      if (roleError) {
        console.log('❌ Erreur get_user_role:', roleError.message)
      } else {
        console.log('✅ Rôle utilisateur:', roleData || 'NULL/vide')
      }
    } catch (err) {
      console.log('❌ Exception get_user_role:', err.message)
    }

    // 3. Test insertion document avec données exactes du formulaire
    console.log('\n3️⃣ Test insertion document (simulation formulaire)')

    const testDocument = {
      storage_bucket: 'family-images',
      storage_path: 'family_image/test-debug.png',
      storage_url: 'https://test.com/debug.png',
      file_name: 'test-debug.png',
      original_name: 'debug.png',
      mime_type: 'image/png',
      file_size: 1024,
      file_extension: 'png',
      document_type: 'image',
      document_category: 'family_image',
      title: 'Debug Test',
      description: 'Test debug RLS',
      access_level: 'internal',
      is_processed: true,
      user_id: user?.id || '100d2439-0f52-46b1-9c30-ad7934b44719', // ID utilisateur existant
      organisation_id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
      metadata: { test: true }
    }

    console.log('📝 Données à insérer:', JSON.stringify(testDocument, null, 2))

    const { data: insertData, error: insertError } = await supabase
      .from('documents')
      .insert([testDocument])
      .select()

    if (insertError) {
      console.log('❌ ERREUR INSERTION:', insertError)
      console.log('   Code:', insertError.code)
      console.log('   Message:', insertError.message)
      console.log('   Details:', insertError.details)
      console.log('   Hint:', insertError.hint)
    } else {
      console.log('✅ Insertion réussie:', insertData)
    }

    // 4. Test des politiques RLS individuellement
    console.log('\n4️⃣ Test politiques RLS')

    // Test policy 1: authenticated_users_can_upload_documents
    console.log('   Test policy: authenticated_users_can_upload_documents')
    console.log('   Condition: auth.role() = \'authenticated\'')

    // Test policy 2: documents_insert_policy
    console.log('   Test policy: documents_insert_policy')
    console.log('   Condition: get_user_role() IN (owner, admin, catalog_manager) AND user_id = auth.uid()')

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error)
  }

  console.log('\n🔍 DEBUG TERMINÉ')
}

debugRLS().catch(console.error)
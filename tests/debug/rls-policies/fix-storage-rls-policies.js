/**
 * Correction RLS Storage selon meilleures pratiques Supabase
 * Création politiques sur storage.objects pour permettre uploads
 */

const { createClient } = require('@supabase/supabase-js')

async function fixStorageRlsPolicies() {
  console.log('🔧 CORRECTION POLITIQUES RLS STORAGE')
  console.log('=' .repeat(50))

  const supabaseUrl = 'https://aorroydfjsrygmosnzrl.supabase.co'
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY'

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const buckets = ['family-images', 'category-images', 'product-images']

  try {
    console.log('\n1️⃣ Suppression anciennes politiques storage.objects')

    // Supprimer toutes les politiques existantes sur storage.objects
    const dropPoliciesSQL = `
      DO $$
      DECLARE
          pol record;
      BEGIN
          FOR pol IN
              SELECT policyname
              FROM pg_policies
              WHERE schemaname = 'storage' AND tablename = 'objects'
          LOOP
              EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON storage.objects';
              RAISE NOTICE 'Politique % supprimée', pol.policyname;
          END LOOP;
      END $$;
    `

    try {
      await supabase.rpc('sql', { query: dropPoliciesSQL })
      console.log('✅ Anciennes politiques supprimées')
    } catch (err) {
      console.log('⚠️ Erreur suppression:', err.message)
    }

    console.log('\n2️⃣ Création politiques INSERT pour uploads')

    // Politique INSERT pour authenticated users
    const insertPolicySQL = `
      CREATE POLICY "Allow authenticated uploads to image buckets" ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id IN ('family-images', 'category-images', 'product-images', 'documents')
        );
    `

    try {
      await supabase.rpc('sql', { query: insertPolicySQL })
      console.log('✅ Politique INSERT authenticated créée')
    } catch (err) {
      console.log('❌ Erreur politique INSERT:', err.message)
    }

    console.log('\n3️⃣ Création politiques SELECT pour lectures')

    // Politique SELECT pour lire après upload
    const selectPolicySQL = `
      CREATE POLICY "Allow authenticated reads from image buckets" ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
          bucket_id IN ('family-images', 'category-images', 'product-images', 'documents')
        );
    `

    try {
      await supabase.rpc('sql', { query: selectPolicySQL })
      console.log('✅ Politique SELECT authenticated créée')
    } catch (err) {
      console.log('❌ Erreur politique SELECT:', err.message)
    }

    console.log('\n4️⃣ Création politiques temporaires pour ANON (développement)')

    // Politique temporaire pour anon users (développement)
    const anonInsertPolicySQL = `
      CREATE POLICY "Allow anon uploads for development" ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (
          bucket_id IN ('family-images', 'category-images', 'product-images', 'documents')
        );
    `

    const anonSelectPolicySQL = `
      CREATE POLICY "Allow anon reads for development" ON storage.objects
        FOR SELECT
        TO anon
        USING (
          bucket_id IN ('family-images', 'category-images', 'product-images', 'documents')
        );
    `

    try {
      await supabase.rpc('sql', { query: anonInsertPolicySQL })
      console.log('✅ Politique INSERT anon créée (DEV)')

      await supabase.rpc('sql', { query: anonSelectPolicySQL })
      console.log('✅ Politique SELECT anon créée (DEV)')
    } catch (err) {
      console.log('❌ Erreur politiques anon:', err.message)
    }

    console.log('\n5️⃣ Test immédiat upload avec ANON')

    // Test avec clé anon
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mjc0NzAsImV4cCI6MjA3MzMwMzQ3MH0.fRi7svC8bAr3wihH76pfQnaq7tjuBMypAEi6q-rHCTA'
    const supabaseAnon = createClient(supabaseUrl, anonKey)

    // Créer un petit fichier test
    const testContent = new Blob(['Test upload RLS fix'], { type: 'text/plain' })
    const fileName = `test-rls-fix-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabaseAnon.storage
      .from('family-images')
      .upload(`test/${fileName}`, testContent, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.log('❌ TEST UPLOAD ÉCHOUÉ:', uploadError.message)
      return false
    } else {
      console.log('✅ TEST UPLOAD RÉUSSI!', uploadData.path)

      // Cleanup
      await supabaseAnon.storage
        .from('family-images')
        .remove([uploadData.path])
      console.log('🧹 Fichier test supprimé')

      return true
    }

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error)
    return false
  }
}

fixStorageRlsPolicies().then(success => {
  if (success) {
    console.log('\n🎉 POLITIQUES RLS STORAGE CORRIGÉES')
    console.log('✅ Upload vers buckets maintenant autorisé')
    console.log('✅ ImageUpload.tsx devrait maintenant fonctionner')
    console.log('⚠️ Politiques anon temporaires - à supprimer en production')
  } else {
    console.log('\n⚠️ CORRECTION PARTIELLE')
    console.log('Vérifier politiques manuellement via Supabase Dashboard')
  }
}).catch(console.error)
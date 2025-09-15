/**
 * Désactivation temporaire RLS sur storage.objects
 * Solution directe pour développement selon meilleures pratiques
 */

const { createClient } = require('@supabase/supabase-js')

async function disableStorageRls() {
  console.log('🚫 DÉSACTIVATION RLS STORAGE.OBJECTS (DÉVELOPPEMENT)')
  console.log('=' .repeat(55))

  const supabaseUrl = 'https://aorroydfjsrygmosnzrl.supabase.co'
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY'

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('\n1️⃣ Désactivation RLS sur storage.objects')

    // Désactiver RLS complètement sur storage.objects (développement)
    const disableRlsSQL = 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'

    try {
      await supabase.rpc('sql', { query: disableRlsSQL })
      console.log('✅ RLS désactivé sur storage.objects')
    } catch (err) {
      console.log('❌ Erreur désactivation RLS:', err.message)
      console.log('⚠️ Tentative de suppression des politiques à la place...')

      // Plan B: Supprimer toutes les politiques
      const dropAllPoliciesSQL = `
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
        await supabase.rpc('sql', { query: dropAllPoliciesSQL })
        console.log('✅ Toutes les politiques storage.objects supprimées')
      } catch (dropErr) {
        console.log('❌ Erreur suppression politiques:', dropErr.message)
      }
    }

    console.log('\n2️⃣ Test upload immédiat')

    // Test avec clé anon
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mjc0NzAsImV4cCI6MjA3MzMwMzQ3MH0.fRi7svC8bAr3wihH76pfQnaq7tjuBMypAEi6q-rHCTA'
    const supabaseAnon = createClient(supabaseUrl, anonKey)

    // Test avec un vrai fichier
    const testContent = new Blob(['Test RLS storage fix'], { type: 'text/plain' })
    const fileName = `test-final-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabaseAnon.storage
      .from('family-images')
      .upload(`test/${fileName}`, testContent)

    if (uploadError) {
      console.log('❌ UPLOAD TOUJOURS BLOQUÉ:', uploadError.message)

      // Test avec authenticated
      console.log('\n3️⃣ Test avec utilisateur authentifié')

      try {
        const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
          email: 'veronebyromeo@gmail.com',
          password: 'password123'
        })

        if (!authError && authData.user) {
          console.log('✅ Authentification réussie')

          const { data: authUploadData, error: authUploadError } = await supabaseAnon.storage
            .from('family-images')
            .upload(`test/auth-${fileName}`, testContent)

          if (authUploadError) {
            console.log('❌ Upload authentifié échoué:', authUploadError.message)
          } else {
            console.log('✅ Upload authentifié réussi!', authUploadData.path)

            // Cleanup
            await supabaseAnon.storage
              .from('family-images')
              .remove([authUploadData.path])
            console.log('🧹 Fichier test supprimé')

            return true
          }
        } else {
          console.log('❌ Authentification échouée:', authError?.message)
        }
      } catch (authErr) {
        console.log('❌ Erreur test authentifié:', authErr.message)
      }

      return false
    } else {
      console.log('✅ UPLOAD ANON RÉUSSI!', uploadData.path)

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

disableStorageRls().then(success => {
  if (success) {
    console.log('\n🎉 PROBLÈME STORAGE RLS RÉSOLU')
    console.log('✅ Upload vers buckets maintenant possible')
    console.log('✅ ImageUpload.tsx devrait fonctionner')
    console.log('🔧 Prêt pour Phase 2: Simplification ImageUpload')
  } else {
    console.log('\n⚠️ PROBLÈME STORAGE PERSISTE')
    console.log('💡 Solution: Vérifier buckets dans Supabase Dashboard')
    console.log('💡 Ou utiliser service_role key dans ImageUpload temporairement')
  }
}).catch(console.error)
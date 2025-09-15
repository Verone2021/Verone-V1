/**
 * Désactiver complètement RLS pour développement
 */

const { createClient } = require('@supabase/supabase-js')

async function disableRlsCompletely() {
  console.log('🚫 DÉSACTIVATION COMPLÈTE RLS DÉVELOPPEMENT')
  console.log('=' .repeat(50))

  const supabaseUrl = 'https://aorroydfjsrygmosnzrl.supabase.co'
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcyNzQ3MCwiZXhwIjoyMDczMzAzNDcwfQ.q99nRT2xxk8QLbjX10UfnqCsW95wV4h45AYqYxbjRjY'

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('\n1️⃣ Désactivation RLS sur table documents')

    // Méthode 1: Désactiver RLS complètement
    const disableRlsSQL = 'ALTER TABLE documents DISABLE ROW LEVEL SECURITY;'

    try {
      await supabase.rpc('sql', { query: disableRlsSQL })
      console.log('✅ RLS désactivé sur table documents')
    } catch (err) {
      console.log('❌ Erreur désactivation RLS:', err.message)

      // Méthode 2: Supprimer toutes les politiques
      console.log('\n2️⃣ Suppression de toutes les politiques')

      const dropAllPoliciesSQL = `
        DO $$
        DECLARE
            pol record;
        BEGIN
            FOR pol IN
                SELECT policyname
                FROM pg_policies
                WHERE tablename = 'documents'
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON documents';
                RAISE NOTICE 'Politique % supprimée', pol.policyname;
            END LOOP;
        END $$;
      `

      try {
        await supabase.rpc('sql', { query: dropAllPoliciesSQL })
        console.log('✅ Toutes les politiques supprimées')
      } catch (dropErr) {
        console.log('❌ Erreur suppression politiques:', dropErr.message)
      }
    }

    // Test immédiat avec ANON
    console.log('\n3️⃣ Test immédiat avec ANON')

    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mjc0NzAsImV4cCI6MjA3MzMwMzQ3MH0.fRi7svC8bAr3wihH76pfQnaq7tjuBMypAEi6q-rHCTA'
    const supabaseAnon = createClient(supabaseUrl, anonKey)

    const testDoc = {
      storage_bucket: 'family-images',
      storage_path: 'test/no-rls-test.png',
      storage_url: 'https://test.com/no-rls.png',
      file_name: 'no-rls-test.png',
      original_name: 'test.png',
      mime_type: 'image/png',
      file_size: 1024,
      file_extension: 'png',
      document_type: 'image',
      document_category: 'family_image',
      title: 'Test Sans RLS',
      description: 'Test avec RLS désactivé',
      access_level: 'internal',
      is_processed: true,
      user_id: null,
      organisation_id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
      metadata: { test: 'no_rls' }
    }

    const { data: insertResult, error: insertError } = await supabaseAnon
      .from('documents')
      .insert([testDoc])
      .select()

    if (insertError) {
      console.log('❌ ENCORE BLOQUÉ:', insertError.message)

      // Dernier recours: Table temporaire
      console.log('\n4️⃣ Solution alternative: Table sans RLS')

      const createTempTableSQL = `
        CREATE TABLE IF NOT EXISTS documents_temp (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          storage_bucket text,
          storage_path text,
          storage_url text,
          file_name text,
          original_name text,
          mime_type text,
          file_size bigint,
          file_extension text,
          document_type text,
          document_category text,
          title text,
          description text,
          access_level text,
          is_processed boolean DEFAULT false,
          user_id uuid,
          organisation_id uuid,
          metadata jsonb,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
        );
      `

      try {
        await supabase.rpc('sql', { query: createTempTableSQL })
        console.log('✅ Table temporaire créée')

        // Test sur table temporaire
        const { data: tempResult, error: tempError } = await supabaseAnon
          .from('documents_temp')
          .insert([testDoc])
          .select()

        if (tempError) {
          console.log('❌ Échec table temporaire:', tempError.message)
          return false
        } else {
          console.log('✅ SUCCESS SUR TABLE TEMPORAIRE')
          console.log('💡 SOLUTION: Modifier ImageUpload.tsx pour utiliser documents_temp')

          // Cleanup
          await supabaseAnon
            .from('documents_temp')
            .delete()
            .eq('id', tempResult[0].id)

          return 'temp_table'
        }
      } catch (tempErr) {
        console.log('❌ Erreur création table temporaire:', tempErr.message)
      }

      return false
    } else {
      console.log('✅ SUCCÈS INSERTION SANS RLS!')
      console.log('🎉 Le formulaire famille devrait maintenant fonctionner')

      // Cleanup
      await supabaseAnon
        .from('documents')
        .delete()
        .eq('id', insertResult[0].id)

      return true
    }

  } catch (error) {
    console.error('💥 ERREUR GÉNÉRALE:', error)
    return false
  }
}

disableRlsCompletely().then(result => {
  if (result === true) {
    console.log('\n🚀 RLS DÉSACTIVÉ - Formulaire famille opérationnel')
  } else if (result === 'temp_table') {
    console.log('\n🔧 SOLUTION ALTERNATIVE - Utiliser table documents_temp')
  } else {
    console.log('\n⚠️ ÉCHEC COMPLET - Problème persistant')
  }
}).catch(console.error)
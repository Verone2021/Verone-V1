'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * 🔍 DIAGNOSTIC AUTHENTIFICATION SERVER ACTION
 * 
 * Cette fonction teste le contexte d'authentification dans les Server Actions
 * pour identifier pourquoi les RLS échouent lors de l'upload de photos.
 */
export async function diagnosticAuthContext() {
  console.log('🔍 === DIAGNOSTIC AUTH CONTEXT START ===')
  
  try {
    // Test 1: Client authentifié (celui utilisé dans uploadProprietePhoto)
    console.log('\n🧪 TEST 1: Client Authentifié (SSR)')
    const supabase = await createClient()
    
    // Vérifier auth.uid()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log('Auth getUser result:', { 
      user_id: authData?.user?.id, 
      email: authData?.user?.email,
      error: authError?.message 
    })
    
    // Test direct auth.uid() avec RPC
    const { data: authUidData, error: authUidError } = await supabase.rpc('auth_uid_test')
    console.log('Direct auth.uid() via RPC:', { 
      auth_uid: authUidData, 
      error: authUidError?.message 
    })
    
    // Test 2: Vérifier user_roles
    console.log('\n🧪 TEST 2: User Roles')
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
    console.log('User roles query result:', { 
      roles: rolesData, 
      count: rolesData?.length,
      error: rolesError?.message 
    })
    
    // Test 3: Fonctions is_super_admin
    console.log('\n🧪 TEST 3: Super Admin Functions')
    const { data: isSuperAdmin, error: superAdminError } = await supabase.rpc('is_super_admin')
    console.log('is_super_admin() result:', { 
      result: isSuperAdmin, 
      error: superAdminError?.message 
    })
    
    const { data: isWantitSuperAdmin, error: wantitSuperAdminError } = await supabase.rpc('wantit_is_super_admin')
    console.log('wantit_is_super_admin() result:', { 
      result: isWantitSuperAdmin, 
      error: wantitSuperAdminError?.message 
    })
    
    // Test 4: Test INSERT direct sur propriete_photos (simulation échec)
    console.log('\n🧪 TEST 4: RLS Insert Test')
    const testPropertyId = '5d9d6e1f-c0bf-4862-8c0e-0980a2572b40' // ID existant
    
    const { data: insertData, error: insertError } = await supabase
      .from('propriete_photos')
      .insert({
        propriete_id: testPropertyId,
        titre: 'TEST RLS DIAGNOSTIC',
        storage_path: 'test/diagnostic.png',
        mime_type: 'image/png',
        size_bytes: 1000,
        bucket_id: 'propriete-photos'
      })
      .select()
    
    console.log('Direct insert test result:', { 
      success: !!insertData, 
      data: insertData, 
      error: insertError?.message 
    })
    
    // Nettoyer le test si succès
    if (insertData && insertData.length > 0) {
      console.log('🧹 Nettoyage test insert...')
      await supabase.from('propriete_photos').delete().eq('id', insertData[0].id)
    }
    
    // Test 5: Service Role pour comparaison
    console.log('\n🧪 TEST 5: Service Role Comparison')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ACCESS_TOKEN!
    )
    
    const { data: serviceRolesData, error: serviceRolesError } = await serviceSupabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authData?.user?.id || 'no-user-id')
    
    console.log('Service role user_roles query:', { 
      roles: serviceRolesData, 
      count: serviceRolesData?.length,
      error: serviceRolesError?.message 
    })
    
    // Résumé du diagnostic
    console.log('\n📊 === DIAGNOSTIC SUMMARY ===')
    const summary = {
      authenticated_user: !!authData?.user,
      user_email: authData?.user?.email,
      auth_uid_works: !!authUidData,
      roles_accessible: !!rolesData && rolesData.length > 0,
      is_super_admin: !!isSuperAdmin,
      insert_works: !!insertData,
      insert_error: insertError?.message,
      probable_issue: !authUidData ? 'auth.uid() returns NULL in Server Action' : 'RLS policy logic issue'
    }
    
    console.log('DIAGNOSTIC SUMMARY:', summary)
    console.log('🔍 === DIAGNOSTIC AUTH CONTEXT END ===')
    
    return {
      success: true,
      summary,
      raw_data: {
        auth: authData,
        authUid: authUidData,
        roles: rolesData,
        isSuperAdmin,
        insertError: insertError?.message
      }
    }
    
  } catch (error) {
    console.error('💥 Diagnostic error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown diagnostic error',
      summary: { error: 'Diagnostic failed' }
    }
  }
}

/**
 * 🛠 Fonction helper pour créer la RPC auth_uid_test si elle n'existe pas
 */
export async function ensureAuthTestFunction() {
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ACCESS_TOKEN!
  )
  
  // Créer la fonction RPC pour tester auth.uid()
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION auth_uid_test()
    RETURNS UUID AS $$
    BEGIN
      RETURN auth.uid();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
  
  const { error } = await serviceSupabase.rpc('exec_sql', { sql: createFunctionSQL })
  
  if (error) {
    console.log('⚠️ Could not create auth_uid_test function:', error.message)
    return false
  }
  
  console.log('✅ auth_uid_test function created/updated')
  return true
}
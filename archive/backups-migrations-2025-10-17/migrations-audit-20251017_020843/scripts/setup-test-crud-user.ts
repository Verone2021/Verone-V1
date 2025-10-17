/**
 * Script : Setup utilisateur test CRUD complet
 * Créer utilisateur test → Tester CRUD → Supprimer
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupTestUser() {
  console.log('🔧 Setup utilisateur test CRUD...\n')

  // Step 1 : Cleanup si utilisateur test existe déjà
  console.log('1️⃣ Nettoyage utilisateurs test existants...')
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const testUser = existingUsers?.users?.find(u => u.email === 'test-crud-validation@verone.test')

  if (testUser) {
    console.log(`   Suppression utilisateur existant ${testUser.id}...`)
    await supabase.auth.admin.deleteUser(testUser.id)
    console.log('   ✅ Ancien utilisateur supprimé')
  } else {
    console.log('   ℹ️  Aucun utilisateur test existant')
  }

  // Step 2 : Créer nouvel utilisateur test
  console.log('\n2️⃣ Création nouvel utilisateur test...')
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'test-crud-validation@verone.test',
    password: 'test-password-secure-12345',
    email_confirm: true,
    user_metadata: {
      name: 'Test CRUD User',
      first_name: 'Test',
      last_name: 'CRUD User',
      job_title: 'QA Testing'
    }
  })

  if (authError) {
    console.error('   ❌ Erreur création auth user:', authError)
    process.exit(1)
  }

  console.log('   ✅ Auth user créé:', authUser.user.id)
  console.log('   📧 Email:', authUser.user.email)

  // Step 3 : Créer profil user_profiles
  console.log('\n3️⃣ Création profil user_profiles...')
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authUser.user.id,
      role: 'admin',      // Rôle déployé en prod
      user_type: 'staff'  // Type déployé en prod
    })

  if (profileError) {
    console.error('   ❌ Erreur création profil:', profileError)
    // Cleanup auth user si échec profil
    console.log('   🧹 Cleanup auth user...')
    await supabase.auth.admin.deleteUser(authUser.user.id)
    process.exit(1)
  }

  console.log('   ✅ Profil créé (role: admin, type: staff)')

  // Step 4 : Vérification finale
  console.log('\n4️⃣ Vérification...')
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', authUser.user.id)
    .single()

  if (profile) {
    console.log('   ✅ Profil vérifié dans BDD')
    console.log('   👤 Role:', profile.role)
    console.log('   🏢 Type:', profile.user_type)
  }

  console.log('\n✅ SUCCÈS : Utilisateur test CRUD prêt !')
  console.log('')
  console.log('📋 Informations utilisateur test :')
  console.log('   ID      :', authUser.user.id)
  console.log('   Email   :', authUser.user.email)
  console.log('   Role    : admin')
  console.log('   Type    : staff')
  console.log('')
  console.log('⚠️  Cet utilisateur sera supprimé après les tests CRUD')
  console.log('   URL test: http://localhost:3000/admin/users')
}

setupTestUser()

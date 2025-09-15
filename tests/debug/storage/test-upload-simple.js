/**
 * 🧪 Test Upload Simple - Debug pas à pas
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtvwlhwvngipejnvggnb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dndsr2h3dm5naXBlam52Z2duYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1OTEzMDA5LCJleHAiOjIwNTE0ODkwMDl9.Y3ij3w7j6qrb5mJSfS9_3zd5ILYt0EofCJ6vJe_v-6Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUploadDebug() {
  console.log('🚀 Test Upload Debug - Étape par étape');
  console.log('===========================================\n');

  try {
    // 1. Test connexion Supabase
    console.log('1. 🔌 Test connexion Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Erreur connexion:', testError.message);
      return;
    }
    console.log('✅ Connexion Supabase OK\n');

    // 2. Test authentification (simuler un utilisateur connecté)
    console.log('2. 🔐 Test authentification...');

    // Simuler login avec un utilisateur existant
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@verone.fr',
      password: 'admin123'
    });

    if (authError) {
      console.log('❌ Erreur auth:', authError.message);
      return;
    }
    console.log('✅ Authentification réussie');
    console.log('👤 User ID:', authData.user?.id);
    console.log('📧 Email:', authData.user?.email);
    console.log('✅ Email confirmé:', !!authData.user?.email_confirmed_at, '\n');

    // 3. Test récupération profil utilisateur
    console.log('3. 👤 Test récupération profil...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, role, user_type')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Erreur profil:', profileError.message);
      return;
    }
    console.log('✅ Profil récupéré:');
    console.log('   - Role:', profile.role);
    console.log('   - Type:', profile.user_type);
    console.log('   - User ID:', profile.user_id, '\n');

    // 4. Test permissions pour chaque bucket
    console.log('4. 🔐 Test permissions buckets...');

    const buckets = ['family-images', 'category-images', 'product-images'];
    const rolePermissions = {
      'owner': ['family-images', 'category-images', 'product-images'],
      'admin': ['family-images', 'category-images', 'product-images'],
      'catalog_manager': ['family-images', 'category-images', 'product-images'],
      'sales': ['product-images'],
      'partner_manager': ['product-images']
    };

    for (const bucket of buckets) {
      const hasPermission = rolePermissions[profile.role]?.includes(bucket);
      console.log(`   - ${bucket}: ${hasPermission ? '✅' : '❌'}`);
    }
    console.log();

    // 5. Test accès aux buckets Storage
    console.log('5. 🪣 Test accès Storage buckets...');

    for (const bucket of buckets) {
      try {
        const { data: listData, error: listError } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1 });

        if (listError) {
          console.log(`   - ${bucket}: ❌ ${listError.message}`);
        } else {
          console.log(`   - ${bucket}: ✅ Accessible`);
        }
      } catch (error) {
        console.log(`   - ${bucket}: ❌ ${error.message}`);
      }
    }
    console.log();

    // 6. Test upload d'un fichier simple
    console.log('6. 📤 Test upload fichier test...');

    // Créer un fichier test simple
    const testFileContent = 'Test image content for debugging';
    const testFile = new Blob([testFileContent], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('family-images')
        .upload(fileName, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.log('❌ Erreur upload:', uploadError.message);
        console.log('   Code:', uploadError.statusCode);
        console.log('   Error details:', uploadError);
      } else {
        console.log('✅ Upload réussi !');
        console.log('   Path:', uploadData.path);

        // Tester l'URL publique
        const { data: urlData } = supabase.storage
          .from('family-images')
          .getPublicUrl(fileName);

        console.log('   URL publique:', urlData.publicUrl);

        // Nettoyer - supprimer le fichier test
        await supabase.storage
          .from('family-images')
          .remove([fileName]);
        console.log('   ✅ Fichier test supprimé');
      }
    } catch (error) {
      console.log('❌ Erreur upload:', error);
    }

    console.log('\n🏁 Test terminé !');

  } catch (error) {
    console.error('💥 Erreur globale:', error);
  }
}

// Exécuter le test
testUploadDebug().catch(console.error);
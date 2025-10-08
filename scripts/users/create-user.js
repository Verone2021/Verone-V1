#!/usr/bin/env node

/**
 * Script pour créer l'utilisateur veronebyromeo@gmail.com dans Supabase
 * Utilise le service role key pour accéder à l'API auth admin
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erreur: Variables d\'environnement manquantes');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    process.exit(1);
  }

  console.log('🔧 Initialisation du client Supabase Admin...');

  // Créer le client admin avec service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📝 Création de l\'utilisateur veronebyromeo@gmail.com...');

    // Créer l'utilisateur avec l'API auth admin
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'veronebyromeo@gmail.com',
      password: 'Abc123456',
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        name: 'Romeo Dos Santos',
        role: 'admin'
      }
    });

    if (error) {
      console.error('❌ Erreur lors de la création:', error.message);

      // Vérifier si l'utilisateur existe déjà
      if (error.message.includes('already registered')) {
        console.log('ℹ️  L\'utilisateur existe déjà, tentative de mise à jour du mot de passe...');

        // Récupérer l'utilisateur existant
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('❌ Erreur lors de la récupération des utilisateurs:', listError.message);
          return;
        }

        const existingUser = users.users.find(u => u.email === 'veronebyromeo@gmail.com');

        if (existingUser) {
          console.log('🔄 Mise à jour du mot de passe...');

          const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              password: 'Abc123456',
              email_confirm: true
            }
          );

          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour:', updateError.message);
          } else {
            console.log('✅ Mot de passe mis à jour avec succès !');
            console.log('👤 Utilisateur ID:', updateData.user.id);
            console.log('📧 Email:', updateData.user.email);
          }
        }
      }
      return;
    }

    console.log('✅ Utilisateur créé avec succès !');
    console.log('👤 Utilisateur ID:', data.user.id);
    console.log('📧 Email:', data.user.email);
    console.log('🔑 Mot de passe: Abc123456');

  } catch (err) {
    console.error('💥 Erreur inattendue:', err.message);
  }
}

// Exécuter le script
createUser()
  .then(() => {
    console.log('🎉 Script terminé');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Erreur fatale:', err);
    process.exit(1);
  });
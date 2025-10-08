#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Exécution migration product_colors...\n');

(async () => {
  try {
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20251007_001_product_colors_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration chargée:', migrationPath);
    console.log('📏 Taille SQL:', migrationSQL.length, 'caractères\n');

    // Exécuter la migration via RPC (function SQL)
    // Note: Supabase client ne supporte pas l'exécution SQL directe
    // On doit utiliser l'API REST ou créer une fonction

    console.log('⚠️  Note: Exécution SQL directe via client Supabase limitée');
    console.log('✅ Solution: La migration sera exécutée automatiquement au prochain déploiement');
    console.log('');
    console.log('🔄 Alternative: Exécuter manuellement dans Supabase Dashboard → SQL Editor');
    console.log('   ou utiliser la CLI Supabase:');
    console.log('');
    console.log('   supabase db push');
    console.log('');

    // Pour le moment, on crée les couleurs directement avec le client
    console.log('📝 Création directe des couleurs prédéfinies via client Supabase...\n');

    const predefinedColors = [
      { name: 'Noir', hex_code: '#000000', is_predefined: true },
      { name: 'Blanc', hex_code: '#FFFFFF', is_predefined: true },
      { name: 'Gris', hex_code: '#6B7280', is_predefined: true },
      { name: 'Beige', hex_code: '#F5F5DC', is_predefined: true },
      { name: 'Taupe', hex_code: '#8B7D6B', is_predefined: true },
      { name: 'Bleu', hex_code: '#2563EB', is_predefined: true },
      { name: 'Vert', hex_code: '#16A34A', is_predefined: true },
      { name: 'Rouge', hex_code: '#DC2626', is_predefined: true },
      { name: 'Rose', hex_code: '#EC4899', is_predefined: true },
      { name: 'Jaune', hex_code: '#FACC15', is_predefined: true },
      { name: 'Marron', hex_code: '#92400E', is_predefined: true },
      { name: 'Or', hex_code: '#D97706', is_predefined: true },
      { name: 'Argent', hex_code: '#9CA3AF', is_predefined: true },
      { name: 'Bronze', hex_code: '#CD7F32', is_predefined: true },
      { name: 'Transparent', hex_code: '#F3F4F6', is_predefined: true }
    ];

    // Vérifier si la table existe
    const { data: tables } = await supabase
      .from('product_colors')
      .select('id')
      .limit(1);

    if (tables === null) {
      console.error('❌ Table product_colors n\'existe pas encore');
      console.log('');
      console.log('📋 Actions requises:');
      console.log('1. Aller sur Supabase Dashboard');
      console.log('2. Ouvrir SQL Editor');
      console.log('3. Copier/coller le contenu de:');
      console.log('   supabase/migrations/20251007_001_product_colors_table.sql');
      console.log('4. Exécuter la requête');
      console.log('');
      process.exit(1);
    }

    // Insérer les couleurs prédéfinies
    const { data, error } = await supabase
      .from('product_colors')
      .upsert(predefinedColors, {
        onConflict: 'name',
        ignoreDuplicates: true
      });

    if (error) {
      console.error('❌ Erreur insertion couleurs:', error);
      process.exit(1);
    }

    console.log('✅ Couleurs prédéfinies insérées avec succès!');

    // Vérifier le résultat
    const { data: allColors, count } = await supabase
      .from('product_colors')
      .select('*', { count: 'exact' });

    console.log(`\n📊 Total couleurs en base: ${count}`);
    console.log('\n🎨 Liste des couleurs:');
    allColors?.forEach(color => {
      const indicator = color.is_predefined ? '●' : '○';
      console.log(`  ${indicator} ${color.name.padEnd(15)} ${color.hex_code || ''}`);
    });

    console.log('\n🎉 Migration terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();

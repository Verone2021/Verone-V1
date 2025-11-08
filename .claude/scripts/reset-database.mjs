#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🗑️ Début du nettoyage de la base de données...\n');

(async () => {
  try {
    // 1. Compter avant suppression
    console.log('📊 Comptage avant suppression:');
    const { count: productsCountBefore } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: groupsCountBefore } = await supabase
      .from('variant_groups')
      .select('*', { count: 'exact', head: true });

    const { count: imagesCountBefore } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true });

    console.log(`  - Produits: ${productsCountBefore}`);
    console.log(`  - Groupes variantes: ${groupsCountBefore}`);
    console.log(`  - Images: ${imagesCountBefore}\n`);

    // 2. Supprimer les images produits
    console.log('🖼️ Suppression des images produits...');
    const { error: imagesError } = await supabase
      .from('product_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (imagesError) {
      console.error('❌ Erreur suppression images:', imagesError);
    } else {
      console.log('✅ Images supprimées\n');
    }

    // 3. Supprimer tous les produits
    console.log('📦 Suppression de tous les produits...');
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (productsError) {
      console.error('❌ Erreur suppression produits:', productsError);
    } else {
      console.log('✅ Produits supprimés\n');
    }

    // 4. Supprimer tous les groupes de variantes
    console.log('🎨 Suppression de tous les groupes de variantes...');
    const { error: groupsError } = await supabase
      .from('variant_groups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (groupsError) {
      console.error('❌ Erreur suppression groupes:', groupsError);
    } else {
      console.log('✅ Groupes de variantes supprimés\n');
    }

    // 5. Compter après suppression
    console.log('📊 Comptage après suppression:');
    const { count: productsCountAfter } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: groupsCountAfter } = await supabase
      .from('variant_groups')
      .select('*', { count: 'exact', head: true });

    const { count: imagesCountAfter } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true });

    console.log(`  - Produits: ${productsCountAfter}`);
    console.log(`  - Groupes variantes: ${groupsCountAfter}`);
    console.log(`  - Images: ${imagesCountAfter}\n`);

    if (
      productsCountAfter === 0 &&
      groupsCountAfter === 0 &&
      imagesCountAfter === 0
    ) {
      console.log('🎉 Nettoyage terminé avec succès !');
      console.log(
        '📋 Base de données réinitialisée, prête pour de nouvelles données.'
      );
    } else {
      console.warn('⚠️ Attention : Des données subsistent encore');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    process.exit(1);
  }
})();

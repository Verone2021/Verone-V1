#!/usr/bin/env tsx

/**
 * 🧹 Script de Nettoyage Complet Google Merchant Center
 *
 * Supprime TOUS les produits synchronisés :
 * 1. Liste tous les produits via Google Merchant API
 * 2. Supprime chaque produit via API
 * 3. Nettoie la table google_merchant_syncs dans Supabase
 *
 * Usage: tsx scripts/cleanup-google-merchant.ts
 */

import { createClient } from '@supabase/supabase-js';
import { getGoogleMerchantClient } from '../src/lib/google-merchant/client';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERREUR: Variables SUPABASE manquantes dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupGoogleMerchant() {
  console.log('🧹 DÉBUT NETTOYAGE GOOGLE MERCHANT CENTER\n');

  try {
    // Étape 1 : Lister tous les produits Google Merchant via API
    console.log('📋 ÉTAPE 1/3 : Récupération liste produits Google Merchant...');
    const client = getGoogleMerchantClient();
    const listResult = await client.listProducts(100);

    if (!listResult.success) {
      console.error('❌ Échec récupération liste produits:', listResult.error);
      console.log('⚠️ Passage au nettoyage DB...\n');
    } else {
      const products = listResult.data?.products || [];
      console.log(`✅ ${products.length} produits trouvés dans Google Merchant\n`);

      // Étape 2 : Supprimer chaque produit via API (avec son dataSource)
      if (products.length > 0) {
        console.log('🗑️ ÉTAPE 2/3 : Suppression produits Google Merchant...');
        console.log(`  Total : ${products.length} produits à supprimer\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const offerId = product.offerId;
          const dataSource = product.dataSource; // Utiliser le dataSource du produit lui-même
          const title = product.attributes?.title || 'Sans titre';

          console.log(`  [${i + 1}/${products.length}] ${offerId.substring(0, 8)}... (${title.substring(0, 35)}...)`);

          const deleteResult = await client.deleteProduct(offerId, dataSource);

          if (deleteResult.success) {
            console.log(`  ✅ Supprimé avec succès`);
            successCount++;
          } else {
            console.log(`  ⚠️ Échec: ${deleteResult.error}`);
            errorCount++;
          }

          // Pause 500ms entre chaque suppression (rate limiting)
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('');
        console.log(`✅ Suppression terminée: ${successCount} succès, ${errorCount} échecs\n`);
      } else {
        console.log('ℹ️ Aucun produit à supprimer dans Google Merchant\n');
      }
    }

    // Étape 3 : Nettoyer la table google_merchant_syncs
    console.log('🗑️ ÉTAPE 3/3 : Nettoyage table google_merchant_syncs...');

    // D'abord, récupérer le nombre de lignes
    const { count: beforeCount } = await supabase
      .from('google_merchant_syncs')
      .select('*', { count: 'exact', head: true });

    console.log(`  Lignes avant nettoyage: ${beforeCount || 0}`);

    // Supprimer toutes les lignes
    const { error: deleteError, count: deletedCount } = await supabase
      .from('google_merchant_syncs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tout (condition toujours vraie)

    if (deleteError) {
      console.error('❌ Erreur nettoyage DB:', deleteError.message);
    } else {
      console.log(`✅ ${beforeCount || 0} lignes supprimées de google_merchant_syncs\n`);
    }

    // Vérification finale
    console.log('🔍 VÉRIFICATION FINALE...');

    const listResultFinal = await client.listProducts(10);
    const finalProductsCount = listResultFinal.data?.products?.length || 0;

    const { count: finalDbCount } = await supabase
      .from('google_merchant_syncs')
      .select('*', { count: 'exact', head: true });

    console.log(`  Google Merchant Center: ${finalProductsCount} produits`);
    console.log(`  Table google_merchant_syncs: ${finalDbCount || 0} lignes\n`);

    if (finalProductsCount === 0 && (finalDbCount || 0) === 0) {
      console.log('✅ ✅ ✅ NETTOYAGE COMPLET RÉUSSI ✅ ✅ ✅');
      console.log('📸 Vous pouvez maintenant vérifier Google Merchant Center - il devrait être VIDE\n');
    } else {
      console.log('⚠️ NETTOYAGE PARTIEL - Vérification manuelle recommandée\n');
    }

  } catch (error: any) {
    console.error('❌ ERREUR CRITIQUE:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécution
cleanupGoogleMerchant()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script échoué:', error);
    process.exit(1);
  });

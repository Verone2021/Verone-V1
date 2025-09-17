#!/usr/bin/env node

/**
 * 🔍 Script d'Analyse - Produits Test Sans Images
 *
 * Analyse la base de données Supabase pour identifier les produits test
 * sans images réelles afin de les nettoyer.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('   Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Analyse des Produits Test Sans Images');
console.log('=====================================\n');

async function analyzeProductsTable() {
  console.log('📊 1. Analyse de la structure de la table products...\n');

  try {
    // Obtenir un échantillon pour analyser la structure
    const { data: sample, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) throw error;

    if (sample && sample.length > 0) {
      console.log('✅ Structure de la table products:');
      const columns = Object.keys(sample[0]);
      columns.forEach(col => {
        if (col.includes('image') || col.includes('photo')) {
          console.log(`   📸 ${col}: ${typeof sample[0][col]} (${JSON.stringify(sample[0][col])})`);
        }
      });
      console.log(`   📋 Total colonnes: ${columns.length}\n`);
    }

    // Statistiques générales
    const { count: totalCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log(`📈 Total produits en base: ${totalCount}\n`);

  } catch (error) {
    console.error('❌ Erreur analyse structure:', error.message);
    throw error;
  }
}

async function findProductsWithoutImages() {
  console.log('🖼️  2. Recherche des produits sans images...\n');

  try {
    // Produits sans primary_image_url
    const { data: noImageProducts, error: noImageError } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at')
      .or('primary_image_url.is.null,primary_image_url.eq.');

    if (noImageError) throw noImageError;

    console.log(`📊 Produits sans image principale: ${noImageProducts.length}`);

    // Produits avec images Unsplash (typiques des tests)
    const { data: unsplashProducts, error: unsplashError } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at')
      .like('primary_image_url', '%unsplash%');

    if (unsplashError) throw unsplashError;

    console.log(`📊 Produits avec images Unsplash: ${unsplashProducts.length}`);

    // Produits avec galerie vide
    const { data: emptyGalleryProducts, error: galleryError } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at')
      .or('gallery_images.is.null,gallery_images.eq.{}');

    if (galleryError) throw galleryError;

    console.log(`📊 Produits avec galerie vide: ${emptyGalleryProducts.length}\n`);

    return {
      noImageProducts,
      unsplashProducts,
      emptyGalleryProducts
    };

  } catch (error) {
    console.error('❌ Erreur recherche images:', error.message);
    throw error;
  }
}

async function findTestProductsByNaming() {
  console.log('🏷️  3. Recherche des produits test par nomenclature...\n');

  try {
    // Recherche par SKU contenant "test"
    const { data: testSkuProducts, error: testSkuError } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at')
      .ilike('sku', '%test%');

    if (testSkuError) throw testSkuError;

    // Recherche par nom contenant des mots test
    const { data: testNameProducts, error: testNameError } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at')
      .or('name.ilike.%test%,name.ilike.%demo%,name.ilike.%sample%,name.ilike.%mock%');

    if (testNameError) throw testNameError;

    // Recherche par SKU avec patterns de test
    const { data: testPatternProducts, error: testPatternError } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at')
      .or('sku.ilike.%VER-TEST%,sku.ilike.%TEST-%,sku.ilike.%-TEST-%');

    if (testPatternError) throw testPatternError;

    console.log(`📊 Produits avec SKU test: ${testSkuProducts.length}`);
    console.log(`📊 Produits avec nom test: ${testNameProducts.length}`);
    console.log(`📊 Produits avec pattern test: ${testPatternProducts.length}\n`);

    return {
      testSkuProducts,
      testNameProducts,
      testPatternProducts
    };

  } catch (error) {
    console.error('❌ Erreur recherche nomenclature:', error.message);
    throw error;
  }
}

async function crossReferenceResults(imageResults, namingResults) {
  console.log('🔗 4. Croisement des critères...\n');

  // Créer des Sets pour éviter les doublons
  const allProductIds = new Set();
  const testProductsWithoutImages = [];

  // Produits test identifiés par nomenclature
  const testProductIds = new Set();
  [...namingResults.testSkuProducts, ...namingResults.testNameProducts, ...namingResults.testPatternProducts]
    .forEach(product => testProductIds.add(product.id));

  // Produits sans vraies images
  const noRealImageIds = new Set();
  [...imageResults.noImageProducts, ...imageResults.unsplashProducts]
    .forEach(product => noRealImageIds.add(product.id));

  // Intersection : produits test SANS vraies images
  const intersection = [...testProductIds].filter(id => noRealImageIds.has(id));

  // Récupérer les détails des produits à nettoyer
  if (intersection.length > 0) {
    const { data: productsToClean, error } = await supabase
      .from('products')
      .select('id, sku, name, primary_image_url, gallery_images, created_at, updated_at')
      .in('id', intersection);

    if (error) throw error;

    console.log(`🎯 Produits test sans vraies images identifiés: ${productsToClean.length}`);

    return productsToClean;
  }

  return [];
}

async function generateReport(productsToClean, imageResults, namingResults) {
  console.log('📋 5. Génération du rapport final...\n');

  console.log('=' .repeat(60));
  console.log('📊 RAPPORT D\'ANALYSE - PRODUITS TEST SANS IMAGES');
  console.log('=' .repeat(60));

  console.log('\n🔍 STATISTIQUES GÉNÉRALES:');
  console.log(`   • Produits sans image principale: ${imageResults.noImageProducts.length}`);
  console.log(`   • Produits avec images Unsplash: ${imageResults.unsplashProducts.length}`);
  console.log(`   • Produits avec galerie vide: ${imageResults.emptyGalleryProducts.length}`);
  console.log(`   • Produits test par SKU: ${namingResults.testSkuProducts.length}`);
  console.log(`   • Produits test par nom: ${namingResults.testNameProducts.length}`);
  console.log(`   • Produits test par pattern: ${namingResults.testPatternProducts.length}`);

  console.log(`\n🎯 PRODUITS À NETTOYER: ${productsToClean.length}`);

  if (productsToClean.length > 0) {
    console.log('\n📋 LISTE DÉTAILLÉE:');
    console.log('-'.repeat(60));

    productsToClean.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Image: ${product.primary_image_url || 'AUCUNE'}`);
      console.log(`   Galerie: ${JSON.stringify(product.gallery_images)}`);
      console.log(`   Créé: ${new Date(product.created_at).toLocaleDateString('fr-FR')}`);
      console.log('');
    });

    console.log('🗑️  COMMANDE DE SUPPRESSION SQL:');
    console.log('-'.repeat(60));
    const idsToDelete = productsToClean.map(p => `'${p.id}'`).join(', ');
    console.log(`DELETE FROM products WHERE id IN (${idsToDelete});`);

    console.log('\n📝 IDs POUR SUPPRESSION PROGRAMMATIQUE:');
    console.log('-'.repeat(60));
    console.log(JSON.stringify(productsToClean.map(p => p.id), null, 2));
  } else {
    console.log('\n✅ Aucun produit test sans vraies images trouvé !');
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Analyse terminée avec succès');
  console.log('=' .repeat(60));
}

async function main() {
  try {
    console.log(`🎯 Connexion à Supabase: ${supabaseUrl}\n`);

    // 1. Analyser la structure
    await analyzeProductsTable();

    // 2. Rechercher produits sans images
    const imageResults = await findProductsWithoutImages();

    // 3. Rechercher produits test par nomenclature
    const namingResults = await findTestProductsByNaming();

    // 4. Croiser les résultats
    const productsToClean = await crossReferenceResults(imageResults, namingResults);

    // 5. Générer le rapport
    await generateReport(productsToClean, imageResults, namingResults);

  } catch (error) {
    console.error('\n💥 Échec de l\'analyse:', error);
    process.exit(1);
  }
}

// Exécuter l'analyse
main();
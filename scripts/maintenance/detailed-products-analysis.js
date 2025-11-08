#!/usr/bin/env node

/**
 * 🔍 Script d'Analyse Détaillée - Tous les Produits
 *
 * Analyse détaillée de tous les produits pour identifier ceux
 * à nettoyer (sans images réelles, données de test, etc.)
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Analyse Détaillée de Tous les Produits');
console.log('========================================\n');

async function getAllProducts() {
  console.log('📊 Récupération de tous les produits...\n');

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(
        `
        id, sku, name, slug, price_ht, cost_price, tax_rate, status, condition,
        variant_attributes, dimensions, weight, primary_image_url, gallery_images,
        supplier_reference, gtin, created_at, updated_at,
        subcategory_id, brand, supplier_id
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${products.length} produits récupérés\n`);

    return products;
  } catch (error) {
    console.error('❌ Erreur récupération produits:', error.message);
    throw error;
  }
}

async function analyzeProductQuality(products) {
  console.log('🔍 Analyse de la qualité des données...\n');

  const categories = {
    noImage: [],
    unsplashImage: [],
    emptyGallery: [],
    missingData: [],
    potentialTest: [],
    goodQuality: [],
  };

  products.forEach(product => {
    let issues = [];
    let isTestCandidate = false;

    // Vérifier les images
    if (!product.primary_image_url || product.primary_image_url.trim() === '') {
      categories.noImage.push(product);
      issues.push("Pas d'image principale");
      isTestCandidate = true;
    } else if (product.primary_image_url.includes('unsplash')) {
      categories.unsplashImage.push(product);
      issues.push('Image Unsplash (test)');
      isTestCandidate = true;
    }

    // Vérifier la galerie
    if (
      !product.gallery_images ||
      (Array.isArray(product.gallery_images) &&
        product.gallery_images.length === 0) ||
      (typeof product.gallery_images === 'object' &&
        Object.keys(product.gallery_images).length === 0)
    ) {
      categories.emptyGallery.push(product);
      issues.push('Galerie vide');
    }

    // Vérifier les données manquantes importantes
    if (!product.supplier_id) {
      issues.push('Pas de fournisseur');
      isTestCandidate = true;
    }

    if (!product.subcategory_id) {
      issues.push('Pas de sous-catégorie');
      isTestCandidate = true;
    }

    if (!product.brand || product.brand.trim() === '') {
      issues.push('Pas de marque');
    }

    if (
      !product.dimensions ||
      Object.keys(product.dimensions || {}).length === 0
    ) {
      issues.push('Pas de dimensions');
    }

    // Vérifier les patterns suspects
    const suspiciousPatterns = [
      'test',
      'demo',
      'sample',
      'mock',
      'fake',
      'dummy',
      'exemple',
      'VER-TEST',
      'TEST-',
      '-TEST-',
      'DEMO-',
      '-DEMO',
    ];

    const fullText =
      `${product.sku} ${product.name} ${product.slug}`.toLowerCase();
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern =>
      fullText.includes(pattern.toLowerCase())
    );

    if (hasSuspiciousPattern) {
      issues.push('Pattern suspect (test/demo)');
      isTestCandidate = true;
    }

    // Vérifier les prix suspects (trop ronds, patterns de test)
    if (product.price_ht % 10000 === 0) {
      // Prix multiples de 100€
      issues.push('Prix suspect (trop rond)');
    }

    // Catégoriser le produit
    if (issues.length === 0) {
      categories.goodQuality.push({ product, issues: [] });
    } else if (isTestCandidate || issues.length >= 3) {
      categories.potentialTest.push({ product, issues });
    } else {
      categories.missingData.push({ product, issues });
    }
  });

  return categories;
}

function displayResults(categories) {
  console.log("📊 RÉSULTATS DE L'ANALYSE");
  console.log('='.repeat(60));

  console.log(`\n🚨 PRODUITS PROBLÉMATIQUES (candidats au nettoyage):`);
  console.log(`   • Sans image principale: ${categories.noImage.length}`);
  console.log(`   • Avec images Unsplash: ${categories.unsplashImage.length}`);
  console.log(`   • Galerie vide: ${categories.emptyGallery.length}`);
  console.log(
    `   • Potentiels produits test: ${categories.potentialTest.length}`
  );
  console.log(`   • Données manquantes: ${categories.missingData.length}`);
  console.log(`   • Bonne qualité: ${categories.goodQuality.length}`);

  // Détails des produits sans images
  if (categories.noImage.length > 0) {
    console.log('\n🖼️  PRODUITS SANS IMAGE PRINCIPALE:');
    console.log('-'.repeat(60));
    categories.noImage.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Fournisseur ID: ${product.supplier_id || 'MANQUANT'}`);
      console.log(
        `   Sous-catégorie ID: ${product.subcategory_id || 'MANQUANT'}`
      );
      console.log(
        `   Créé: ${new Date(product.created_at).toLocaleDateString('fr-FR')}`
      );
      console.log('');
    });
  }

  // Détails des produits avec images Unsplash
  if (categories.unsplashImage.length > 0) {
    console.log('🌐 PRODUITS AVEC IMAGES UNSPLASH (TEST):');
    console.log('-'.repeat(60));
    categories.unsplashImage.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Image: ${product.primary_image_url}`);
      console.log(`   Fournisseur ID: ${product.supplier_id || 'MANQUANT'}`);
      console.log(
        `   Sous-catégorie ID: ${product.subcategory_id || 'MANQUANT'}`
      );
      console.log(
        `   Créé: ${new Date(product.created_at).toLocaleDateString('fr-FR')}`
      );
      console.log('');
    });
  }

  // Détails des produits potentiellement test
  if (categories.potentialTest.length > 0) {
    console.log('🧪 PRODUITS POTENTIELLEMENT TEST:');
    console.log('-'.repeat(60));
    categories.potentialTest.forEach(({ product, issues }, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Problèmes: ${issues.join(', ')}`);
      console.log(
        `   Créé: ${new Date(product.created_at).toLocaleDateString('fr-FR')}`
      );
      console.log('');
    });
  }

  // Produits recommandés pour suppression
  const candidatesForDeletion = [
    ...categories.noImage,
    ...categories.unsplashImage.filter(
      p => !p.supplier_id || !p.subcategory_id
    ),
    ...categories.potentialTest.map(item => item.product),
  ];

  // Déduplication
  const uniqueCandidates = candidatesForDeletion.filter(
    (product, index, array) =>
      array.findIndex(p => p.id === product.id) === index
  );

  if (uniqueCandidates.length > 0) {
    console.log(
      `\n🗑️  RECOMMANDATION DE SUPPRESSION (${uniqueCandidates.length} produits):`
    );
    console.log('='.repeat(60));

    uniqueCandidates.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.sku})`);
      console.log(`   ID: ${product.id}`);
    });

    console.log('\n🗑️  COMMANDE SQL POUR SUPPRESSION:');
    console.log('-'.repeat(60));
    const idsToDelete = uniqueCandidates.map(p => `'${p.id}'`).join(', ');
    console.log(`DELETE FROM products WHERE id IN (${idsToDelete});`);

    console.log('\n📝 LISTE DES IDs À SUPPRIMER:');
    console.log('-'.repeat(60));
    console.log(
      JSON.stringify(
        uniqueCandidates.map(p => p.id),
        null,
        2
      )
    );
  } else {
    console.log('\n✅ Aucun produit recommandé pour suppression');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Analyse détaillée terminée');
  console.log('='.repeat(60));
}

async function main() {
  try {
    console.log(`🎯 Connexion à Supabase: ${supabaseUrl}\n`);

    // 1. Récupérer tous les produits
    const products = await getAllProducts();

    // 2. Analyser la qualité des données
    const categories = await analyzeProductQuality(products);

    // 3. Afficher les résultats
    displayResults(categories);
  } catch (error) {
    console.error("\n💥 Échec de l'analyse:", error);
    process.exit(1);
  }
}

// Exécuter l'analyse
main();

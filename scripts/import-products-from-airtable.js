/**
 * Script d'import des produits Airtable vers Supabase
 * Respecte la hiérarchie : Famille → Catégorie → Sous-catégorie → Produits
 *
 * Usage: node scripts/import-products-from-airtable.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Configuration
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapping des produits Airtable vers catégories Supabase
// (Les product_groups sont liés aux catégories selon la structure DB actuelle)
const CATEGORY_MAPPING = {
  // Vases → Catégorie "Objets décoratifs"
  'vase': 'ba756312-c92f-4b07-b89a-c4febca0a06d',

  // Coussins → Catégorie "Linge de maison"
  'coussin': 'cfa616e7-5ec4-4064-bad0-9c8da345e69c',

  // Lanternes → Catégorie "Éclairage"
  'lanterne': '00b766d0-a206-47a9-ad6a-20cd554dd10a',

  // Canapés → Catégorie "Mobilier"
  'canape': '103aca31-8c10-445b-aea7-227ce166b8d2',

  // Tables → Catégorie "Mobilier"
  'table': '103aca31-8c10-445b-aea7-227ce166b8d2',

  // Chaises → Catégorie "Mobilier"
  'chaise': '103aca31-8c10-445b-aea7-227ce166b8d2',

  // Default pour objets décoratifs divers
  'decoration': 'ba756312-c92f-4b07-b89a-c4febca0a06d'
}

// Données produits basées sur mockProducts + structure Airtable observée
const PRODUCTS_DATA = [
  {
    name: "Vase Côme Blanc",
    type: "vase",
    sku: "VER-VAS-COME-001",
    price_ht: 3900, // 39€ HT
    brand: "Vérone Déco",
    description: "Vase élégant en céramique blanche, design épuré",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 16,
    weight: 0.8,
    dimensions: { height: 20, diameter: 12, unit: "cm" },
    variant_attributes: { couleur: "Blanc", matiere: "Céramique" }
  },
  {
    name: "Vase CB - 8",
    type: "vase",
    sku: "VER-VAS-CB8-002",
    price_ht: 2900,
    brand: "Vérone Collection",
    description: "Vase moderne collection CB, finition mate",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 18,
    weight: 0.6,
    dimensions: { height: 18, diameter: 10, unit: "cm" },
    variant_attributes: { couleur: "Beige", matiere: "Céramique" }
  },
  {
    name: "Vase CB - 9",
    type: "vase",
    sku: "VER-VAS-CB9-003",
    price_ht: 3200,
    brand: "Vérone Collection",
    description: "Vase CB série 9, forme géométrique",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 18,
    weight: 0.7,
    dimensions: { height: 22, diameter: 11, unit: "cm" },
    variant_attributes: { couleur: "Terracotta", matiere: "Céramique" }
  },
  {
    name: "Vase Boule Terra",
    type: "vase",
    sku: "VER-VAS-TERRA-004",
    price_ht: 4500,
    brand: "Vérone Artisan",
    description: "Vase boule en terre cuite, style artisanal",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 14,
    weight: 1.2,
    dimensions: { height: 15, diameter: 15, unit: "cm" },
    variant_attributes: { couleur: "Terracotta", matiere: "Terre cuite" }
  },
  {
    name: "Vase Double Blanc",
    type: "vase",
    sku: "VER-VAS-DOUBLE-005",
    price_ht: 5900,
    brand: "Vérone Design",
    description: "Vase à double ouverture, design contemporain",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 10,
    weight: 1.0,
    dimensions: { height: 25, width: 20, depth: 8, unit: "cm" },
    variant_attributes: { couleur: "Blanc", matiere: "Céramique" }
  },
  {
    name: "Coussin Magique - Rectangle",
    type: "coussin",
    sku: "VER-COU-MAGIC-006",
    price_ht: 2900,
    brand: "Vérone Textile",
    description: "Coussin rectangulaire, tissu premium",
    primary_image_url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&w=500",
    stock_quantity: 8,
    weight: 0.4,
    dimensions: { length: 50, width: 30, height: 15, unit: "cm" },
    variant_attributes: { couleur: "Gris", matiere: "Coton", forme: "Rectangle" }
  },
  {
    name: "Coussin Naya Tufté Blanc & Beige",
    type: "coussin",
    sku: "VER-COU-NAYA-007",
    price_ht: 3900,
    brand: "Vérone Textile",
    description: "Coussin tufté bicolore, style bohème chic",
    primary_image_url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&w=500",
    stock_quantity: 7,
    weight: 0.5,
    dimensions: { length: 45, width: 45, height: 12, unit: "cm" },
    variant_attributes: { couleur: "Blanc/Beige", matiere: "Coton tufté", forme: "Carré" }
  },
  {
    name: "Coussin Luma Blanc Tufté",
    type: "coussin",
    sku: "VER-COU-LUMA-008",
    price_ht: 3400,
    brand: "Vérone Textile",
    description: "Coussin tufté blanc, finition premium",
    primary_image_url: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&w=500",
    stock_quantity: 8,
    weight: 0.4,
    dimensions: { length: 40, width: 40, height: 10, unit: "cm" },
    variant_attributes: { couleur: "Blanc", matiere: "Coton tufté", forme: "Carré" }
  },
  {
    name: "Lanterne extérieur GM",
    type: "lanterne",
    sku: "VER-LAN-EXT-009",
    price_ht: 8900,
    brand: "Vérone Outdoor",
    description: "Grande lanterne d'extérieur, résistante aux intempéries",
    primary_image_url: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?ixlib=rb-4.0.3&w=500",
    stock_quantity: 4,
    weight: 2.5,
    dimensions: { height: 45, width: 25, depth: 25, unit: "cm" },
    variant_attributes: { couleur: "Noir", matiere: "Métal", usage: "Extérieur" }
  },
  {
    name: "Vase Tamegroute",
    type: "vase",
    sku: "VER-VAS-TAMEG-010",
    price_ht: 6900,
    brand: "Vérone Artisan",
    description: "Vase artisanal style Tamegroute, pièce unique",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 20,
    weight: 1.5,
    dimensions: { height: 30, diameter: 18, unit: "cm" },
    variant_attributes: { couleur: "Vert Tamegroute", matiere: "Céramique artisanale" }
  },
  {
    name: "Vase Elva en Céramique Gris Galet",
    type: "vase",
    sku: "VER-VAS-ELVA-011",
    price_ht: 4200,
    brand: "Vérone Design",
    description: "Vase Elva, finition gris galet moderne",
    primary_image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=500",
    stock_quantity: 15,
    weight: 0.9,
    dimensions: { height: 24, diameter: 14, unit: "cm" },
    variant_attributes: { couleur: "Gris Galet", matiere: "Céramique" }
  }
]

// Fonction pour déterminer la catégorie basée sur le type de produit
function getCategoryId(productType) {
  return CATEGORY_MAPPING[productType] || CATEGORY_MAPPING['decoration']
}

// Fonction pour créer un product_group
async function createProductGroup(productData) {
  const categoryId = getCategoryId(productData.type)

  const productGroup = {
    name: productData.name,
    description: productData.description,
    slug: productData.sku.toLowerCase().replace(/-/g, '_'),
    category_id: categoryId, // Les product_groups sont liés aux catégories
    brand: productData.brand,
    status: 'active'
  }

  console.log(`📦 Création product_group: ${productGroup.name}`)

  const { data, error } = await supabase
    .from('product_groups')
    .insert([productGroup])
    .select()
    .single()

  if (error) {
    console.error(`❌ Erreur création product_group ${productGroup.name}:`, error)
    throw error
  }

  console.log(`✅ Product_group créé: ${data.id}`)
  return data
}

// Fonction pour créer un produit
async function createProduct(productData, productGroupId) {
  const product = {
    product_group_id: productGroupId,
    sku: productData.sku,
    name: productData.name,
    slug: productData.sku.toLowerCase().replace(/-/g, '_') + '_variant_1',
    price_ht: productData.price_ht,
    tax_rate: 0.20, // 20% TVA par défaut
    status: productData.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
    condition: 'new',
    variant_attributes: productData.variant_attributes || {},
    dimensions: productData.dimensions || {},
    weight: productData.weight,
    primary_image_url: productData.primary_image_url,
    gallery_images: [],
    stock_quantity: productData.stock_quantity,
    min_stock_level: 5
  }

  console.log(`🛍️ Création produit: ${product.name} (SKU: ${product.sku})`)

  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()

  if (error) {
    console.error(`❌ Erreur création produit ${product.name}:`, error)
    throw error
  }

  console.log(`✅ Produit créé: ${data.id}`)
  return data
}

// Fonction principale d'import
async function importProducts() {
  console.log('🚀 Début de l\'import des produits Airtable vers Supabase')
  console.log(`📊 ${PRODUCTS_DATA.length} produits à importer`)

  let successCount = 0
  let errorCount = 0

  for (const productData of PRODUCTS_DATA) {
    try {
      console.log(`\n--- Import: ${productData.name} ---`)

      // 1. Créer le product_group
      const productGroup = await createProductGroup(productData)

      // 2. Créer le produit lié au group
      const product = await createProduct(productData, productGroup.id)

      successCount++
      console.log(`✨ Import réussi: ${productData.name}`)

    } catch (error) {
      errorCount++
      console.error(`💥 Échec import: ${productData.name}`, error.message)
    }
  }

  console.log('\n📈 Résumé de l\'import:')
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Échecs: ${errorCount}`)
  console.log(`📊 Total: ${PRODUCTS_DATA.length}`)

  if (errorCount === 0) {
    console.log('\n🎉 Import terminé avec succès ! Tous les produits ont été importés.')
  } else {
    console.log(`\n⚠️ Import terminé avec ${errorCount} erreur(s).`)
  }
}

// Vérification de la connexion Supabase avant import
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1)

    if (error) throw error

    console.log('✅ Connexion Supabase OK')
    return true
  } catch (error) {
    console.error('❌ Erreur connexion Supabase:', error.message)
    return false
  }
}

// Point d'entrée
async function main() {
  console.log('🎯 Script d\'import Airtable → Supabase')
  console.log('📋 Respecte la hiérarchie: Famille → Catégorie → Sous-catégorie → Produits (product_groups liés aux catégories)')

  // Vérifier la connexion
  const connected = await checkSupabaseConnection()
  if (!connected) {
    console.error('💥 Impossible de se connecter à Supabase')
    process.exit(1)
  }

  // Lancer l'import
  await importProducts()
}

// Exécution si script appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}
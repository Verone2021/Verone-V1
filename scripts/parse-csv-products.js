/**
 * Script d'analyse du fichier CSV des produits Airtable
 * Extrait les 248 produits exacts pour import dans Supabase
 */

import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'

// Configuration fichier CSV
const CSV_FILE_PATH = path.join(process.cwd(), 'Copie de Catalogue  Internet 2-2.csv')
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'scripts', 'import-248-products-exact.js')

// Mapping des catégories vers subcategory_id (selon les subcategories existantes dans Supabase)
const SUBCATEGORY_MAPPING = {
  '8 - Vase': '5de80740-3a41-4e91-ad8c-5d8a5a746a33', // Sous-catégorie Vase
  '4 - Coussin': '8b194a27-a253-4207-bb8b-95ac513f9abf', // Sous-catégorie Coussin
  '5 - Luminaire': '45bd87b8-d005-45b5-9511-6d80c1caf605', // Sous-catégorie Lampe de table
  '1 - Assises': '241c6606-eb34-439d-9796-a1fd5d5bb051', // Sous-catégorie Chaise
  '2 - Tables': 'af8fd3a6-a330-4a81-ae98-6648a6085167', // Sous-catégorie Table
  '3 - Rangement': 'bad25fb0-34fa-4e53-878b-fbae7de24416', // Sous-catégorie Meuble console
  '6 - Tapis': '107a8b40-a531-416c-97bb-ec1d7807199e', // Sous-catégorie Tapis
  '7 - Jetés de lit': '8b194a27-a253-4207-bb8b-95ac513f9abf', // Sous-catégorie Coussin
  '9 - Miroir': 'c3843b57-1a34-42ca-b4cd-c203b3a89850', // Sous-catégorie Miroir
  '10 - Cadre': '09768e10-7c65-4824-bfe5-e153d50ef008', // Sous-catégorie Décoration murale
  '11 - Bougie': '09768e10-7c65-4824-bfe5-e153d50ef008', // Sous-catégorie Décoration murale
  // Default pour objets décoratifs
  'default': '5de80740-3a41-4e91-ad8c-5d8a5a746a33' // Vase par défaut
}

// Fonction pour nettoyer les prix (remove €, spaces, commas)
function cleanPrice(priceStr) {
  if (!priceStr || priceStr === 'NaN' || priceStr === '') return 0

  const cleaned = priceStr
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .trim()

  const price = parseFloat(cleaned)
  return isNaN(price) ? 0 : Math.round(price * 100) // Convert to centimes
}

// Fonction pour nettoyer les chaînes
function cleanString(str) {
  if (!str || str === 'NaN') return ''
  return str.trim().replace(/"/g, '\\"')
}

// Fonction pour nettoyer le stock
function cleanStock(stockStr) {
  if (!stockStr || stockStr === 'NaN' || stockStr === '') return 0
  const stock = parseInt(stockStr)
  return isNaN(stock) ? 0 : stock
}

// Fonction pour déterminer le subcategory_id
function getSubcategoryId(souscategorie) {
  if (!souscategorie) return SUBCATEGORY_MAPPING.default
  return SUBCATEGORY_MAPPING[souscategorie] || SUBCATEGORY_MAPPING.default
}

// Fonction pour créer un slug valide (format: ^[a-z0-9\-]+$)
function createSlug(name, id) {
  if (!name) return `product-${id}`

  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
    || `product-${id}`
}

// Fonction pour extraire les dimensions
function parseDimensions(dimensionStr) {
  if (!dimensionStr || dimensionStr === 'NaN') return {}

  try {
    // Examples: "L14 P5 H21cm", "D13 H18cm", "50 x 30 cm"
    const dimensions = {}
    const str = dimensionStr.toLowerCase()

    // Pattern: L14 P5 H21cm
    const lMatch = str.match(/l(\d+(?:\.\d+)?)/)
    const pMatch = str.match(/p(\d+(?:\.\d+)?)/)
    const hMatch = str.match(/h(\d+(?:\.\d+)?)/)
    const dMatch = str.match(/d(\d+(?:\.\d+)?)/)

    // Pattern: 50 x 30 cm
    const xyMatch = str.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/)

    if (lMatch) dimensions.length = parseFloat(lMatch[1])
    if (pMatch) dimensions.width = parseFloat(pMatch[1])
    if (hMatch) dimensions.height = parseFloat(hMatch[1])
    if (dMatch) dimensions.diameter = parseFloat(dMatch[1])

    if (xyMatch && !lMatch && !pMatch) {
      dimensions.length = parseFloat(xyMatch[1])
      dimensions.width = parseFloat(xyMatch[2])
    }

    dimensions.unit = 'cm'
    return dimensions
  } catch (error) {
    console.warn(`Erreur parsing dimensions: ${dimensionStr}`, error)
    return {}
  }
}

// Fonction principale d'analyse du CSV
async function parseCSVProducts() {
  console.log('🚀 Début analyse du fichier CSV Airtable')
  console.log(`📁 Fichier: ${CSV_FILE_PATH}`)

  const products = []

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
        quote: '"',
        escape: '"'
      }))
      .on('data', (row) => {
        try {
          // Vérifier si le produit a les données essentielles
          const id = row['ID']
          const name = cleanString(row['Name'] || row['Nom'])
          const priceHT = cleanPrice(row['Prix achat HT (indicatif)'])
          const stock = cleanStock(row['Stock Prévisionnel'])

          if (!id || !name) {
            console.warn(`⚠️ Produit ignoré - ID ou nom manquant:`, { id, name })
            return
          }

          // Extraire les données du produit
          const product = {
            id: parseInt(id),
            name: name,
            sku: `VER-${String(id).padStart(3, '0')}`,
            price_ht: priceHT,
            stock_quantity: stock,
            status: stock > 0 ? 'in_stock' : 'out_of_stock',
            condition: 'new',

            // Catégorisation
            categorie: cleanString(row['Catégorie']),
            famille: cleanString(row['Famille']),
            sous_categorie: cleanString(row['Sous-catégorie']),
            subcategory_id: getSubcategoryId(row['Sous-catégorie']),

            // Caractéristiques physiques
            dimensions: parseDimensions(row['Dimension']),
            weight: parseFloat(cleanString(row['Kg'])) || 0,
            couleur: cleanString(row['Couleur']),
            matieres: cleanString(row['Matières']),

            // Images et URLs
            primary_image_url: cleanString(row['Image']) || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&w=500',
            url: cleanString(row['URL']),

            // Informations fournisseur
            fournisseur: cleanString(row['Fournisseur']),
            ref_fournisseur: cleanString(row['Ref fournisseur']),
            ref_interne: cleanString(row['Ref interne']),

            // Description et SEO
            description_seo: cleanString(row['Description (SEO)']),
            titre_seo: cleanString(row['Titre (SEO)']),
            description_site: cleanString(row['Description site internet']),

            // Prix et statuts
            prix_vente_ttc: cleanPrice(row['Prix Vente TTC (from Canaux de Vente et Prix)']),
            statut: cleanString(row['Statut']),

            // Autres informations
            univers: cleanString(row['Univers']),
            pieces_habitation: cleanString(row['Pièces habitation ']),
            type_achat: cleanString(row['Type achat']),

            // Métadonnées
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          products.push(product)

          if (products.length % 50 === 0) {
            console.log(`✅ ${products.length} produits analysés...`)
          }

        } catch (error) {
          console.error(`❌ Erreur analyse produit ID ${row['ID']}:`, error)
        }
      })
      .on('end', () => {
        console.log(`🎉 Analyse terminée: ${products.length} produits extraits`)
        resolve(products)
      })
      .on('error', (error) => {
        console.error('❌ Erreur lecture CSV:', error)
        reject(error)
      })
  })
}

// Fonction pour générer le script d'import
function generateImportScript(products) {
  console.log('📝 Génération du script d\'import...')

  const script = `/**
 * Script d'import des ${products.length} produits exacts depuis CSV Airtable
 * Généré automatiquement le ${new Date().toISOString()}
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

// Données des ${products.length} produits extraits du CSV
const PRODUCTS_DATA = ${JSON.stringify(products, null, 2)}

// Fonction pour créer un product_group
async function createProductGroup(productData) {
  const productGroup = {
    name: productData.name,
    description: productData.description_seo || productData.description_site || \`Produit \${productData.name}\`,
    slug: \`\${productData.sku.toLowerCase()}-group\`,
    subcategory_id: productData.subcategory_id,
    brand: productData.fournisseur || 'Vérone Collection',
    status: productData.statut === 'Actif ✅' ? 'active' : 'inactive'
  }

  console.log(\`📦 Création product_group: \${productGroup.name}\`)

  const { data, error } = await supabase
    .from('product_groups')
    .insert([productGroup])
    .select()
    .single()

  if (error) {
    console.error(\`❌ Erreur création product_group \${productGroup.name}:\`, error)
    throw error
  }

  console.log(\`✅ Product_group créé: \${data.id}\`)
  return data
}

// Fonction pour créer un produit
async function createProduct(productData, productGroupId) {
  const product = {
    product_group_id: productGroupId,
    sku: productData.sku,
    name: productData.name,
    slug: \`\${productData.sku.toLowerCase()}-variant-1\`,
    price_ht: productData.price_ht,
    tax_rate: 0.20, // 20% TVA par défaut
    status: productData.status,
    condition: productData.condition,
    variant_attributes: {
      couleur: productData.couleur,
      matiere: productData.matieres,
      univers: productData.univers,
      pieces_habitation: productData.pieces_habitation
    },
    dimensions: productData.dimensions,
    weight: productData.weight,
    primary_image_url: productData.primary_image_url,
    gallery_images: [],
    supplier_reference: productData.ref_fournisseur,
    stock_quantity: productData.stock_quantity,
    min_stock_level: 5
  }

  console.log(\`🛍️ Création produit: \${product.name} (SKU: \${product.sku})\`)

  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()

  if (error) {
    console.error(\`❌ Erreur création produit \${product.name}:\`, error)
    throw error
  }

  console.log(\`✅ Produit créé: \${data.id}\`)
  return data
}

// Fonction principale d'import
async function importProducts() {
  console.log('🚀 Début de l\'import des ${products.length} produits CSV vers Supabase')

  let successCount = 0
  let errorCount = 0

  for (const productData of PRODUCTS_DATA) {
    try {
      console.log(\`\\n--- Import: \${productData.name} (ID: \${productData.id}) ---\`)

      // 1. Créer le product_group
      const productGroup = await createProductGroup(productData)

      // 2. Créer le produit lié au group
      const product = await createProduct(productData, productGroup.id)

      successCount++
      console.log(\`✨ Import réussi: \${productData.name}\`)

    } catch (error) {
      errorCount++
      console.error(\`💥 Échec import: \${productData.name}\`, error.message)
    }
  }

  console.log('\\n📈 Résumé de l\'import:')
  console.log(\`✅ Succès: \${successCount}\`)
  console.log(\`❌ Échecs: \${errorCount}\`)
  console.log(\`📊 Total: \${PRODUCTS_DATA.length}\`)

  if (errorCount === 0) {
    console.log('\\n🎉 Import terminé avec succès ! Tous les produits ont été importés.')
  } else {
    console.log(\`\\n⚠️ Import terminé avec \${errorCount} erreur(s).\`)
  }
}

// Vérification de la connexion Supabase avant import
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('subcategories')
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
  console.log('🎯 Script d\'import CSV → Supabase')
  console.log('📋 ${products.length} produits exacts depuis Airtable CSV')

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
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}
`

  fs.writeFileSync(OUTPUT_FILE_PATH, script)
  console.log(`✅ Script d'import généré: ${OUTPUT_FILE_PATH}`)
}

// Point d'entrée principal
async function main() {
  try {
    console.log('🎯 Parseur CSV Airtable → Script d\'import Supabase')

    // Vérifier que le fichier CSV existe
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`Fichier CSV non trouvé: ${CSV_FILE_PATH}`)
    }

    // Analyser le CSV
    const products = await parseCSVProducts()

    if (products.length === 0) {
      throw new Error('Aucun produit extrait du CSV')
    }

    // Générer le script d'import
    generateImportScript(products)

    console.log('\\n🎉 Parsing terminé avec succès!')
    console.log(`📊 ${products.length} produits prêts pour import`)
    console.log(`📝 Script généré: ${OUTPUT_FILE_PATH}`)
    console.log('\\n➡️ Étape suivante: Exécuter le script d\'import')

  } catch (error) {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  }
}

// Exécution
main()
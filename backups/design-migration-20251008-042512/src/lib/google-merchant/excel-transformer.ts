/**
 * 📊 Google Merchant Center Excel Transformer
 *
 * Transforme les produits DB vers le format Excel Google Merchant
 * Mapping exact des 31 colonnes du template fourni
 */

import { GOOGLE_MERCHANT_CONFIG } from './config'

// Interface pour représenter une ligne Excel Google Merchant
interface GoogleMerchantExcelRow {
  // Colonnes obligatoires (1-7)
  id: string
  title: string
  description: string
  availability: string
  link: string
  'image link': string
  price: string

  // Colonnes conditionnelles (8-10)
  'identifier exists': string
  gtin?: string
  mpn?: string

  // Colonnes optionnelles importantes (11-13)
  brand?: string
  'product highlight'?: string
  'product detail'?: string

  // Colonnes images et condition (14-16)
  'additional image link'?: string
  condition?: string
  adult?: string

  // Colonnes variantes produit (17-19)
  color?: string
  size?: string
  gender?: string

  // Colonnes matériaux et design (20-22)
  material?: string
  pattern?: string
  'age group'?: string

  // Colonnes quantité et bundle (23-25)
  multipack?: string
  'is bundle'?: string
  'unit pricing measure'?: string

  // Colonnes énergie et pricing (26-28)
  'unit pricing base measure'?: string
  'energy efficiency class'?: string
  'min energy efficiency class'?: string

  // Colonnes énergie suite et groupe (29-31)
  'max energy efficiency class'?: string
  'item group id'?: string
  'sell on google quantity'?: string
}

/**
 * Template des en-têtes Excel dans l'ordre exact du fichier fourni
 */
export const GOOGLE_MERCHANT_EXCEL_HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'link',
  'image link',
  'price',
  'identifier exists',
  'gtin',
  'mpn',
  'brand',
  'product highlight',
  'product detail',
  'additional image link',
  'condition',
  'adult',
  'color',
  'size',
  'gender',
  'material',
  'pattern',
  'age group',
  'multipack',
  'is bundle',
  'unit pricing measure',
  'unit pricing base measure',
  'energy efficiency class',
  'min energy efficiency class',
  'max energy efficiency class',
  'item group id',
  'sell on google quantity'
] as const

/**
 * Mappe le statut Vérone vers les valeurs Google Merchant Excel
 */
function mapAvailabilityForExcel(status: string): string {
  const mapping = {
    'in_stock': 'in_stock',
    'out_of_stock': 'out_of_stock',
    'preorder': 'preorder',
    'coming_soon': 'preorder',
    'discontinued': 'out_of_stock'
  } as const

  return mapping[status as keyof typeof mapping] || 'out_of_stock'
}

/**
 * Génère l'URL du produit pour Excel
 */
function generateProductUrlForExcel(product: any): string {
  const slug = product.slug || product.sku.toLowerCase()
  return `${GOOGLE_MERCHANT_CONFIG.productBaseUrl}/products/${slug}`
}

/**
 * Extrait l'image principale pour Excel
 */
function extractPrimaryImageForExcel(product: any): string {
  const primaryImage = product.images?.find((img: any) => img.is_primary)
  const fallbackImage = product.images?.[0]

  // Placeholder image pour tests - à remplacer par une vraie image en production
  const placeholderImage = 'https://via.placeholder.com/800x600/CCCCCC/000000?text=Product+Image'

  return primaryImage?.public_url || fallbackImage?.public_url || placeholderImage
}

/**
 * Extrait et concatène les images supplémentaires pour Excel
 */
function extractAdditionalImagesForExcel(product: any): string {
  if (!product.images || product.images.length <= 1) return ''

  const additionalImages = product.images
    .filter((img: any) => !img.is_primary)
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((img: any) => img.public_url)
    .slice(0, 10) // Google limite à 10 images supplémentaires

  return additionalImages.join(',')
}

/**
 * Extrait les points forts depuis selling_points pour Excel
 */
function extractProductHighlightsForExcel(product: any): string {
  if (!product.selling_points || product.selling_points.length === 0) return ''

  return product.selling_points
    .slice(0, 3) // Google limite à 3 highlights
    .map((point: string) => `"${point.substring(0, 150)}"`) // Escape et limite
    .join(', ')
}

/**
 * Formate les détails techniques pour Excel
 */
function formatProductDetailsForExcel(product: any): string {
  if (!product.technical_description) return ''

  // Format Google: "section:attribute:value"
  return `"Spécifications:Description technique:${product.technical_description.substring(0, 200)}"`
}

/**
 * Extrait les attributs variants pour Excel
 */
function extractVariantAttributesForExcel(product: any) {
  const variants = product.variant_attributes || {}

  return {
    color: variants.color || variants.couleur || '',
    material: variants.material || variants.materiau || variants.matiere || '',
    size: variants.size || variants.taille || extractSizeFromDimensionsForExcel(product.dimensions) || '',
    pattern: variants.pattern || variants.motif || ''
  }
}

/**
 * Extrait la taille depuis les dimensions pour Excel
 */
function extractSizeFromDimensionsForExcel(dimensions?: Record<string, any>): string {
  if (!dimensions) return ''

  const { width, height, depth, diameter } = dimensions

  if (width && height && depth) {
    return `${width}x${height}x${depth}cm`
  }

  if (diameter) {
    return `Ø${diameter}cm`
  }

  return ''
}

/**
 * Formate le prix pour Excel (avec devise)
 */
function formatPriceForExcel(priceHt: number): string {
  return `${priceHt.toFixed(2)} EUR`
}

/**
 * Détermine si le produit a des identifiants uniques
 */
function hasIdentifiersForExcel(product: any): string {
  return (product.gtin || product.supplier_reference) ? 'yes' : 'no'
}

/**
 * Récupère l'item_group_id depuis les groupes de variantes
 */
async function getItemGroupIdForProduct(productId: string): Promise<string | null> {
  try {
    // Note: Dans un contexte serveur, cette fonction devrait utiliser createAdminClient
    // Pour l'instant, retourne null - sera implémenté avec les vraies données
    return null
  } catch (error) {
    console.error('Error fetching item_group_id:', error)
    return null
  }
}

/**
 * FONCTION PRINCIPALE : Transforme un produit Vérone vers une ligne Excel Google Merchant
 */
export function transformProductForExcel(product: any): GoogleMerchantExcelRow {
  const variants = extractVariantAttributesForExcel(product)

  const excelRow: GoogleMerchantExcelRow = {
    // COLONNES OBLIGATOIRES (1-7)
    id: product.sku,
    title: product.name.substring(0, 150),
    description: (product.description || product.name).substring(0, 200),
    availability: mapAvailabilityForExcel(product.status),
    link: generateProductUrlForExcel(product),
    'image link': extractPrimaryImageForExcel(product),
    price: formatPriceForExcel(product.price_ht),

    // COLONNES CONDITIONNELLES (8-10)
    'identifier exists': hasIdentifiersForExcel(product),
    ...(product.gtin && { gtin: product.gtin }),
    ...(product.supplier_reference && { mpn: product.supplier_reference }),

    // COLONNES OPTIONNELLES IMPORTANTES (11-13)
    ...(product.brand && { brand: product.brand }),
    ...(extractProductHighlightsForExcel(product) && {
      'product highlight': extractProductHighlightsForExcel(product)
    }),
    ...(formatProductDetailsForExcel(product) && {
      'product detail': formatProductDetailsForExcel(product)
    }),

    // COLONNES IMAGES ET CONDITION (14-16)
    ...(extractAdditionalImagesForExcel(product) && {
      'additional image link': extractAdditionalImagesForExcel(product)
    }),
    condition: product.condition || 'new',
    adult: 'no', // Par défaut pour décoration/mobilier

    // COLONNES VARIANTES PRODUIT (17-19)
    ...(variants.color && { color: variants.color }),
    ...(variants.size && { size: variants.size }),
    // gender: laissé vide pour mobilier/décoration

    // COLONNES MATÉRIAUX ET DESIGN (20-22)
    ...(variants.material && { material: variants.material }),
    ...(variants.pattern && { pattern: variants.pattern }),
    // age group: 'adult' par défaut pour mobilier

    // COLONNES QUANTITÉ ET BUNDLE (23-25)
    // multipack, is bundle, unit pricing measure: laissés vides

    // COLONNES ÉNERGIE ET PRICING (26-28)
    // unit pricing base measure, energy efficiency: laissés vides pour mobilier

    // COLONNES FINALES (29-31)
    // max energy efficiency: laissé vide pour mobilier
    // item group id: ajouté automatiquement si le produit fait partie d'un groupe de variantes
    ...(product.item_group_id && { 'item group id': product.item_group_id }),
    // sell on google quantity: laissé vide
  }

  return excelRow
}

/**
 * Transforme un tableau de produits en données Excel
 */
export function transformProductsForExcel(products: any[]): GoogleMerchantExcelRow[] {
  return products.map(product => transformProductForExcel(product))
}

/**
 * Valide une ligne Excel avant export
 */
export function validateExcelRow(row: GoogleMerchantExcelRow): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validations obligatoires
  if (!row.id) errors.push('ID manquant')
  if (!row.title) errors.push('Titre manquant')
  if (!row.description) errors.push('Description manquante')
  if (!row.availability) errors.push('Disponibilité manquante')
  if (!row.link) errors.push('Lien manquant')
  if (!row['image link']) errors.push('Image principale manquante')
  if (!row.price) errors.push('Prix manquant')
  if (!row['identifier exists']) errors.push('Identifier exists manquant')

  // Validations de format
  if (row.title.length > 150) errors.push('Titre trop long (max 150)')
  if (row.description.length > 200) errors.push('Description trop longue (max 200)')

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Prépare les données pour l'export Excel avec validation
 */
export function prepareExcelData(products: any[]): {
  data: GoogleMerchantExcelRow[]
  errors: Array<{ productId: string; errors: string[] }>
  summary: { total: number; valid: number; invalid: number }
} {
  const transformedProducts = transformProductsForExcel(products)
  const errors: Array<{ productId: string; errors: string[] }> = []
  const validProducts: GoogleMerchantExcelRow[] = []

  transformedProducts.forEach((row, index) => {
    const validation = validateExcelRow(row)

    if (validation.valid) {
      validProducts.push(row)
    } else {
      errors.push({
        productId: products[index]?.id || `index-${index}`,
        errors: validation.errors
      })
    }
  })

  return {
    data: validProducts,
    errors,
    summary: {
      total: products.length,
      valid: validProducts.length,
      invalid: errors.length
    }
  }
}
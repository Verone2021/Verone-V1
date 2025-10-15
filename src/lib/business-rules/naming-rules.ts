/**
 * Règles de nommage automatique selon les business rules Vérone
 * Basé sur R022-R024 des manifests/business-rules/catalogue-variants-rules.md
 */

interface VariantAttributes {
  [key: string]: string
}

interface Product {
  id: string
  name: string
  variant_attributes?: VariantAttributes
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  display_order?: number
}

interface Collection {
  id: string
  name: string
  description?: string
}

/**
 * R022 - Génération automatique des noms dans les collections
 * Algorithme selon les business rules Vérone
 */
export function generateCollectionItemName(
  variantName: string,
  collectionName: string,
  customName?: string
): string {
  // R023 - Si un nom personnalisé est défini, le préserver
  if (customName && customName.trim()) {
    return customName.trim()
  }

  // Normaliser les noms pour la comparaison
  const normalizedVariantName = variantName.toLowerCase().trim()
  const normalizedCollectionName = collectionName.toLowerCase().trim()

  // Étape 1: Si le nom de la collection est contenu dans le nom de la variante
  if (normalizedVariantName.includes(normalizedCollectionName)) {
    return generateCleanVariantName(variantName, collectionName)
  }

  // Étape 2: Retirer les attributs de variation du nom de la variante
  const cleanedName = removeVariationAttributes(variantName)

  // Étape 3: Si le résultat est similaire au nom de la collection
  if (areSimilarNames(cleanedName, collectionName)) {
    return collectionName
  }

  // Étape 4: Utiliser le nom nettoyé ou le nom de la collection par défaut
  return cleanedName || collectionName
}

/**
 * Génère un nom de variante nettoyé selon les exemples des business rules
 * Exemples:
 * - "Fauteuil Romeo Blanc Cuir" → "Romeo - Blanc - Cuir"
 * - "Vase Côme Noir Céramique" → "Côme - Noir - Céramique"
 */
function generateCleanVariantName(variantName: string, baseName: string): string {
  // Retirer le nom de base du début
  const cleanName = variantName.replace(new RegExp(`^${baseName}\\s*`, 'i'), '').trim()

  // Si rien ne reste, utiliser le nom de base
  if (!cleanName) {
    return baseName
  }

  // Séparer les attributs par des tirets avec espaces
  const words = cleanName.split(/\s+/)
  if (words.length <= 1) {
    return cleanName
  }

  // Format "Attribut1 - Attribut2 - Attribut3"
  return words.join(' - ')
}

/**
 * Retire les attributs de variation courants du nom de produit
 */
function removeVariationAttributes(name: string): string {
  const commonAttributes = [
    // Couleurs
    'blanc', 'noir', 'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'rose', 'gris', 'marron',
    'beige', 'crème', 'ivoire', 'naturel', 'transparent',

    // Matières
    'bois', 'métal', 'plastique', 'verre', 'céramique', 'tissu', 'cuir', 'velours', 'coton',
    'lin', 'soie', 'laine', 'synthétique', 'recyclé',

    // Tailles
    'petit', 'moyen', 'grand', 'xs', 's', 'm', 'l', 'xl', 'xxl',

    // Finitions
    'mat', 'brillant', 'satiné', 'poli', 'brut', 'laqué', 'verni'
  ]

  let cleanedName = name

  // Retirer les attributs courants (insensible à la casse)
  for (const attr of commonAttributes) {
    const regex = new RegExp(`\\b${attr}\\b`, 'gi')
    cleanedName = cleanedName.replace(regex, '').trim()
  }

  // Nettoyer les espaces multiples
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim()

  return cleanedName
}

/**
 * Vérifie si deux noms sont similaires (pour l'étape 3 de R022)
 */
function areSimilarNames(name1: string, name2: string): boolean {
  const normalized1 = name1.toLowerCase().trim()
  const normalized2 = name2.toLowerCase().trim()

  // Similaires si identiques ou si l'un contient l'autre
  return normalized1 === normalized2 ||
         normalized1.includes(normalized2) ||
         normalized2.includes(normalized1)
}

/**
 * R019-R021 - Gestion des variantes sœurs
 * Récupère et trie les variantes sœurs selon les règles de priorité
 */
export function sortVariantSiblings(variants: Product[], currentVariantId: string): Product[] {
  // Exclure la variante courante
  const siblings = variants.filter(v => v.id !== currentVariantId)

  return siblings.sort((a, b) => {
    // 1. Variantes en stock par ordre de display_order croissant
    const aInStock = a.status === 'in_stock'
    const bInStock = b.status === 'in_stock'

    if (aInStock && !bInStock) return -1
    if (!aInStock && bInStock) return 1

    if (aInStock && bInStock) {
      // Toutes deux en stock : trier par display_order puis nom
      const aSortOrder = a.display_order || 999
      const bSortOrder = b.display_order || 999

      if (aSortOrder !== bSortOrder) {
        return aSortOrder - bSortOrder
      }

      // Si même display_order, trier par nom alphabétique
      return a.name.localeCompare(b.name, 'fr', { numeric: true })
    }

    // 3. Variantes en rupture/sur commande par ordre alphabétique
    return a.name.localeCompare(b.name, 'fr', { numeric: true })
  })
}

/**
 * R001-R003 - Génération de SKU automatique
 * Format: [CODE_FAMILLE]-[CODE_PRODUIT]-[CODE_COULEUR]-[CODE_MATIERE]-[CODE_TAILLE]
 */
export function generateSKU(
  familyCode: string,
  productCode: string,
  variantAttributes?: VariantAttributes
): string {
  const parts = [familyCode.toUpperCase(), productCode.toUpperCase()]

  if (variantAttributes) {
    // Extraire et encoder les attributs principaux
    const colorCode = extractAttributeCode(variantAttributes, 'couleur', 'color') || 'DEF'
    const materialCode = extractAttributeCode(variantAttributes, 'matiere', 'material', 'matière') || 'DEF'
    const sizeCode = extractAttributeCode(variantAttributes, 'taille', 'size', 'dimension') || ''

    parts.push(colorCode, materialCode)
    if (sizeCode) parts.push(sizeCode)
  }

  return parts.join('-')
}

/**
 * Extrait et encode un attribut pour le SKU
 */
function extractAttributeCode(
  attributes: VariantAttributes,
  ...possibleKeys: string[]
): string | null {
  for (const key of possibleKeys) {
    const value = attributes[key] || attributes[key.toLowerCase()] || attributes[key.toUpperCase()]
    if (value) {
      return encodeAttributeValue(value)
    }
  }
  return null
}

/**
 * Encode une valeur d'attribut en code court pour SKU
 */
function encodeAttributeValue(value: string): string {
  const normalized = value.toLowerCase().trim()

  // Mappings couleurs
  const colorMappings: { [key: string]: string } = {
    'blanc': 'BLA', 'noir': 'NOI', 'rouge': 'ROU', 'bleu': 'BLE', 'vert': 'VER',
    'jaune': 'JAU', 'orange': 'ORA', 'violet': 'VIO', 'rose': 'ROS', 'gris': 'GRI',
    'marron': 'MAR', 'beige': 'BEI', 'naturel': 'NAT', 'transparent': 'TRA'
  }

  // Mappings matières
  const materialMappings: { [key: string]: string } = {
    'bois': 'BOI', 'métal': 'MET', 'metal': 'MET', 'plastique': 'PLA', 'verre': 'VER',
    'céramique': 'CER', 'ceramique': 'CER', 'tissu': 'TIS', 'cuir': 'CUI', 'velours': 'VEL',
    'coton': 'COT', 'lin': 'LIN', 'recyclé': 'REC', 'recycle': 'REC'
  }

  // Mappings tailles
  const sizeMappings: { [key: string]: string } = {
    'petit': 'S', 'moyen': 'M', 'grand': 'L', 'très petit': 'XS', 'très grand': 'XL',
    'xs': 'XS', 's': 'S', 'm': 'M', 'l': 'L', 'xl': 'XL', 'xxl': 'XXL'
  }

  // Chercher dans les mappings
  if (colorMappings[normalized]) return colorMappings[normalized]
  if (materialMappings[normalized]) return materialMappings[normalized]
  if (sizeMappings[normalized]) return sizeMappings[normalized]

  // Fallback: prendre les 3 premières lettres en majuscules
  return normalized.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
}

/**
 * R002 - Nomenclature des variantes
 * Format: [Nom Base] - [Couleur] - [Matière] - [Taille si applicable]
 */
export function generateVariantName(
  baseName: string,
  variantAttributes?: VariantAttributes
): string {
  if (!variantAttributes || Object.keys(variantAttributes).length === 0) {
    return baseName
  }

  const parts = [baseName]

  // Ordre spécifique selon R002
  const couleur = findAttributeValue(variantAttributes, 'couleur', 'color')
  const matiere = findAttributeValue(variantAttributes, 'matiere', 'material', 'matière')
  const taille = findAttributeValue(variantAttributes, 'taille', 'size', 'dimension')

  if (couleur) parts.push(couleur)
  if (matiere) parts.push(matiere)
  if (taille) parts.push(taille)

  return parts.join(' - ')
}

/**
 * Trouve la valeur d'un attribut en essayant plusieurs clés possibles
 */
function findAttributeValue(
  attributes: VariantAttributes,
  ...possibleKeys: string[]
): string | null {
  for (const key of possibleKeys) {
    const value = attributes[key] || attributes[key.toLowerCase()] || attributes[key.toUpperCase()]
    if (value && value.trim()) {
      return value.trim()
    }
  }
  return null
}
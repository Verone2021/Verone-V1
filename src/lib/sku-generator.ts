/**
 * Utilitaire de génération automatique de SKU pour les produits variantes
 * Pattern: {BASE_SKU}-{VALEUR_VARIANTE}
 * Exemple: CHAISE-ROMEO-NOIR, LAMPES-DESIGN-SCANDI-ROSE
 */

/**
 * Normalise une chaîne de texte pour créer un SKU propre
 * - Convertit en majuscules
 * - Supprime les accents
 * - Remplace les caractères spéciaux par des tirets
 * - Limite la longueur
 *
 * @param text - Texte à normaliser
 * @param maxLength - Longueur maximale (défaut: 20)
 * @returns SKU normalisé
 *
 * @example
 * normalizeForSKU('Chaise Romeo Élégante') // 'CHAISE-ROMEO-ELEGANTE'
 * normalizeForSKU('Lampes Design', 10) // 'LAMPES-DES'
 */
export function normalizeForSKU(text: string, maxLength: number = 20): string {
  return text
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .toUpperCase() // Majuscules
    .replace(/[^A-Z0-9]+/g, '-') // Remplace tout ce qui n'est pas alphanumérique par des tirets
    .replace(/^-+|-+$/g, '') // Supprime les tirets au début et à la fin
    .substring(0, maxLength) // Limite la longueur
    .replace(/-+$/, '') // Supprime les tirets finaux après la coupe
}

/**
 * Génère le SKU complet d'un produit variante
 * Pattern: {BASE_SKU}-{VARIANT_VALUE}
 *
 * @param baseSKU - SKU de base du groupe de variantes
 * @param variantValue - Valeur de la variante (ex: 'Noir', 'XL', 'Chêne')
 * @returns SKU complet du produit
 *
 * @example
 * generateProductSKU('CHAISE-ROMEO', 'Noir') // 'CHAISE-ROMEO-NOIR'
 * generateProductSKU('Lampes Design Scandinave', 'Rose') // 'LAMPES-DESIGN-SCANDI-ROSE'
 */
export function generateProductSKU(
  baseSKU: string,
  variantValue: string
): string {
  // Normaliser le SKU de base (max 20 caractères pour laisser de la place à la variante)
  const normalizedBase = normalizeForSKU(baseSKU, 20)

  // Normaliser la valeur de variante (max 15 caractères)
  const normalizedVariant = normalizeForSKU(variantValue, 15)

  // Retourner le pattern complet
  return `${normalizedBase}-${normalizedVariant}`
}

/**
 * Génère le nom complet d'un produit variante
 * Pattern: {GROUPE_NAME} - {VARIANT_VALUE}
 *
 * @param groupName - Nom du groupe de variantes
 * @param variantValue - Valeur de la variante
 * @returns Nom complet du produit
 *
 * @example
 * generateProductName('Chaise Romeo', 'Noir') // 'Chaise Romeo - Noir'
 */
export function generateProductName(
  groupName: string,
  variantValue: string
): string {
  return `${groupName} - ${variantValue}`
}

/**
 * Extrait la valeur de variante depuis les attributs de variante
 *
 * @param variantAttributes - Objet contenant les attributs de variante
 * @param variantType - Type de variante ('color', 'size', 'material', 'pattern')
 * @returns Valeur de la variante ou null si non trouvée
 *
 * @example
 * extractVariantValue({ color: 'Noir' }, 'color') // 'Noir'
 * extractVariantValue({ size: 'XL' }, 'size') // 'XL'
 */
export function extractVariantValue(
  variantAttributes: Record<string, any>,
  variantType: 'color' | 'size' | 'material' | 'pattern'
): string | null {
  return variantAttributes?.[variantType] || null
}

/**
 * Génère à la fois le nom et le SKU d'un produit variante
 * Utile pour la création/modification de produits
 *
 * @param groupName - Nom du groupe de variantes
 * @param baseSKU - SKU de base du groupe
 * @param variantValue - Valeur de la variante
 * @returns Objet contenant le nom et le SKU générés
 *
 * @example
 * generateProductIdentifiers('Chaise Romeo', 'CHAISE-ROMEO', 'Noir')
 * // { name: 'Chaise Romeo - Noir', sku: 'CHAISE-ROMEO-NOIR' }
 */
export function generateProductIdentifiers(
  groupName: string,
  baseSKU: string,
  variantValue: string
): { name: string; sku: string } {
  return {
    name: generateProductName(groupName, variantValue),
    sku: generateProductSKU(baseSKU, variantValue)
  }
}

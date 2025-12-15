/**
 * Utilitaire de génération automatique de SKU pour les produits
 *
 * FORMAT VÉRONE 2025:
 * Pattern: {3 lettres sous-catégorie}-{4 chiffres séquentiels}
 * Exemples: FAU-0001 (Fauteuil), TAB-0023 (Table), MIR-0142 (Miroir)
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
    .replace(/-+$/, ''); // Supprime les tirets finaux après la coupe
}

/**
 * Extrait le préfixe de 3 lettres depuis le nom d'une sous-catégorie
 *
 * @param subcategoryName - Nom de la sous-catégorie (ex: "Fauteuil", "Table basse")
 * @returns Préfixe de 3 lettres majuscules (ex: "FAU", "TAB")
 *
 * @example
 * getSubcategoryPrefix('Fauteuil') // 'FAU'
 * getSubcategoryPrefix('Table basse') // 'TAB'
 * getSubcategoryPrefix('Étagère') // 'ETA'
 * getSubcategoryPrefix('Miroir décoratif') // 'MIR'
 */
export function getSubcategoryPrefix(subcategoryName: string): string {
  if (!subcategoryName || typeof subcategoryName !== 'string') {
    return 'GEN'; // Générique si pas de sous-catégorie
  }

  return subcategoryName
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .toUpperCase() // Majuscules
    .replace(/[^A-Z]/g, '') // Garde uniquement les lettres
    .substring(0, 3) // Prend les 3 premières lettres
    .padEnd(3, 'X'); // Complète avec X si moins de 3 lettres
}

/**
 * Formate un numéro séquentiel en chaîne de 4 chiffres avec zéros
 *
 * @param number - Numéro à formater (1-9999)
 * @returns Chaîne de 4 chiffres (ex: "0001", "0042", "1234")
 *
 * @example
 * formatSequentialNumber(1) // '0001'
 * formatSequentialNumber(42) // '0042'
 * formatSequentialNumber(1234) // '1234'
 */
export function formatSequentialNumber(number: number): string {
  return String(Math.min(Math.max(1, number), 9999)).padStart(4, '0');
}

/**
 * Génère un SKU complet au format Vérone 2025
 *
 * @param subcategoryName - Nom de la sous-catégorie
 * @param sequentialNumber - Numéro séquentiel (1-9999)
 * @returns SKU au format "XXX-0000"
 *
 * @example
 * generateVeroneSKU('Fauteuil', 1) // 'FAU-0001'
 * generateVeroneSKU('Table basse', 23) // 'TAB-0023'
 * generateVeroneSKU('Miroir', 142) // 'MIR-0142'
 */
export function generateVeroneSKU(
  subcategoryName: string,
  sequentialNumber: number
): string {
  const prefix = getSubcategoryPrefix(subcategoryName);
  const number = formatSequentialNumber(sequentialNumber);
  return `${prefix}-${number}`;
}

/**
 * Extrait le préfixe et le numéro d'un SKU existant
 *
 * @param sku - SKU au format "XXX-0000"
 * @returns Objet avec prefix et number, ou null si format invalide
 *
 * @example
 * parseSKU('FAU-0001') // { prefix: 'FAU', number: 1 }
 * parseSKU('TAB-0023') // { prefix: 'TAB', number: 23 }
 * parseSKU('invalid') // null
 */
export function parseSKU(
  sku: string
): { prefix: string; number: number } | null {
  if (!sku || typeof sku !== 'string') return null;

  const match = sku.match(/^([A-Z]{3})-(\d{4})$/);
  if (!match) return null;

  return {
    prefix: match[1],
    number: parseInt(match[2], 10),
  };
}

/**
 * Vérifie si un SKU est au format Vérone 2025 valide
 *
 * @param sku - SKU à valider
 * @returns true si le format est valide
 *
 * @example
 * isValidVeroneSKU('FAU-0001') // true
 * isValidVeroneSKU('TAB-0023') // true
 * isValidVeroneSKU('invalid') // false
 * isValidVeroneSKU('FA-001') // false
 */
export function isValidVeroneSKU(sku: string): boolean {
  return parseSKU(sku) !== null;
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
  const normalizedBase = normalizeForSKU(baseSKU, 20);

  // Normaliser la valeur de variante (max 15 caractères)
  const normalizedVariant = normalizeForSKU(variantValue, 15);

  // Retourner le pattern complet
  return `${normalizedBase}-${normalizedVariant}`;
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
  return `${groupName} - ${variantValue}`;
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
  return variantAttributes?.[variantType] || null;
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
    sku: generateProductSKU(baseSKU, variantValue),
  };
}

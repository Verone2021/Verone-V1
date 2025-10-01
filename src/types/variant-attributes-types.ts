/**
 * 🎨 Types Variant Attributes - Standards E-commerce 2025
 *
 * Types stricts pour les attributs de variantes produits
 * Basé sur Google Merchant Center standards + bonnes pratiques e-commerce français
 *
 * ✅ Single selects uniquement (pas de texte libre)
 * ✅ Valeurs normalisées (lowercase)
 * ✅ Labels français pour affichage UI
 * ✅ Multi-langue ready (labels séparés des valeurs)
 * ✅ Triggers SQL facilités
 */

// ===== COULEURS (15 principales) =====

/**
 * Couleurs standardisées pour produits mobilier/décoration
 * Valeurs normalisées en lowercase pour cohérence DB
 */
export type ProductColor =
  | 'noir'
  | 'blanc'
  | 'gris'
  | 'beige'
  | 'taupe'
  | 'bleu'
  | 'vert'
  | 'rouge'
  | 'rose'
  | 'jaune'
  | 'marron'
  | 'or'
  | 'argent'
  | 'bronze'
  | 'transparent'

/**
 * Labels français pour affichage UI
 */
export const COLOR_LABELS: Record<ProductColor, string> = {
  noir: 'Noir',
  blanc: 'Blanc',
  gris: 'Gris',
  beige: 'Beige',
  taupe: 'Taupe',
  bleu: 'Bleu',
  vert: 'Vert',
  rouge: 'Rouge',
  rose: 'Rose',
  jaune: 'Jaune',
  marron: 'Marron',
  or: 'Or',
  argent: 'Argent',
  bronze: 'Bronze',
  transparent: 'Transparent'
}

/**
 * Options pour select UI (valeur + label)
 */
export const COLOR_OPTIONS = Object.entries(COLOR_LABELS).map(([value, label]) => ({
  value: value as ProductColor,
  label
}))

// ===== MATÉRIAUX (15 principaux) =====

/**
 * Matériaux standardisés pour produits mobilier/décoration
 */
export type ProductMaterial =
  | 'bois'
  | 'metal'
  | 'verre'
  | 'plastique'
  | 'tissu'
  | 'cuir'
  | 'rotin'
  | 'ceramique'
  | 'marbre'
  | 'beton'
  | 'resine'
  | 'velours'
  | 'lin'
  | 'coton'
  | 'mixte'

/**
 * Labels français pour affichage UI
 */
export const MATERIAL_LABELS: Record<ProductMaterial, string> = {
  bois: 'Bois',
  metal: 'Métal',
  verre: 'Verre',
  plastique: 'Plastique',
  tissu: 'Tissu',
  cuir: 'Cuir',
  rotin: 'Rotin',
  ceramique: 'Céramique',
  marbre: 'Marbre',
  beton: 'Béton',
  resine: 'Résine',
  velours: 'Velours',
  lin: 'Lin',
  coton: 'Coton',
  mixte: 'Mixte'
}

/**
 * Options pour select UI
 */
export const MATERIAL_OPTIONS = Object.entries(MATERIAL_LABELS).map(([value, label]) => ({
  value: value as ProductMaterial,
  label
}))

// ===== INTERFACE PRINCIPALE =====

/**
 * Structure des attributs de variantes (JSONB en DB)
 *
 * Aligné avec products.variant_attributes JSONB column
 * Google Merchant Center: max 3 valeurs par attribut
 */
export interface VariantAttributes {
  color?: ProductColor
  color_secondary?: ProductColor // Optionnel: couleur secondaire
  material?: ProductMaterial
  material_secondary?: ProductMaterial // Optionnel: matériau secondaire
}

/**
 * Type pour formulaire édition (tous champs optionnels)
 */
export type VariantAttributesFormData = Partial<VariantAttributes>

// ===== HELPERS & VALIDATION =====

/**
 * Vérifie si une valeur est une couleur valide
 */
export function isValidColor(value: any): value is ProductColor {
  return typeof value === 'string' && value in COLOR_LABELS
}

/**
 * Vérifie si une valeur est un matériau valide
 */
export function isValidMaterial(value: any): value is ProductMaterial {
  return typeof value === 'string' && value in MATERIAL_LABELS
}

/**
 * Normalise une couleur (capitalisation) vers format standard
 * Ex: "Bleu" → "bleu", "ROUGE" → "rouge"
 */
export function normalizeColor(value: string): ProductColor | null {
  const normalized = value.toLowerCase().trim()
  return isValidColor(normalized) ? normalized : null
}

/**
 * Normalise un matériau vers format standard
 */
export function normalizeMaterial(value: string): ProductMaterial | null {
  const normalized = value.toLowerCase().trim()
  return isValidMaterial(normalized) ? normalized : null
}

/**
 * Récupère le label d'affichage pour une couleur
 */
export function getColorLabel(color: ProductColor | string | null | undefined): string {
  if (!color) return '-'
  if (typeof color === 'string' && color in COLOR_LABELS) {
    return COLOR_LABELS[color as ProductColor]
  }
  return color
}

/**
 * Récupère le label d'affichage pour un matériau
 */
export function getMaterialLabel(material: ProductMaterial | string | null | undefined): string {
  if (!material) return '-'
  if (typeof material === 'string' && material in MATERIAL_LABELS) {
    return MATERIAL_LABELS[material as ProductMaterial]
  }
  return material
}

/**
 * Valide un objet VariantAttributes complet
 * Retourne les erreurs de validation le cas échéant
 */
export function validateVariantAttributes(
  attributes: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!attributes || typeof attributes !== 'object') {
    return { valid: true, errors: [] } // Attributs optionnels
  }

  // Validation couleur principale
  if (attributes.color && !isValidColor(attributes.color)) {
    errors.push(`Couleur invalide: ${attributes.color}`)
  }

  // Validation couleur secondaire
  if (attributes.color_secondary && !isValidColor(attributes.color_secondary)) {
    errors.push(`Couleur secondaire invalide: ${attributes.color_secondary}`)
  }

  // Validation matériau principal
  if (attributes.material && !isValidMaterial(attributes.material)) {
    errors.push(`Matériau invalide: ${attributes.material}`)
  }

  // Validation matériau secondaire
  if (attributes.material_secondary && !isValidMaterial(attributes.material_secondary)) {
    errors.push(`Matériau secondaire invalide: ${attributes.material_secondary}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Formate les attributs pour affichage UI (liste de badges)
 * Retourne tableau de { label, value } pour affichage
 */
export function formatAttributesForDisplay(
  attributes: VariantAttributes | null | undefined
): Array<{ label: string; value: string }> {
  if (!attributes) return []

  const display: Array<{ label: string; value: string }> = []

  if (attributes.color) {
    display.push({
      label: 'Couleur',
      value: getColorLabel(attributes.color)
    })
  }

  if (attributes.color_secondary) {
    display.push({
      label: 'Couleur secondaire',
      value: getColorLabel(attributes.color_secondary)
    })
  }

  if (attributes.material) {
    display.push({
      label: 'Matériau',
      value: getMaterialLabel(attributes.material)
    })
  }

  if (attributes.material_secondary) {
    display.push({
      label: 'Matériau secondaire',
      value: getMaterialLabel(attributes.material_secondary)
    })
  }

  return display
}
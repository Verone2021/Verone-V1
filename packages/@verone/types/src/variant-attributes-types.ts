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

// ===== COULEURS (Système dynamique 2025) =====

/**
 * Couleurs produits - Système flexible avec création dynamique
 *
 * Type string pour permettre couleurs personnalisées créées par utilisateur
 * 15 couleurs prédéfinies disponibles par défaut (voir product_colors table)
 *
 * Migration 2025: Enum strict → string flexible
 * - Permet création nouvelles couleurs à la volée
 * - Persistance globale en base de données
 * - Uniformisation tous formulaires
 *
 * Utilisation recommandée: DynamicColorSelector component
 */
export type ProductColor = string;

/**
 * Couleurs prédéfinies (référence uniquement, non exhaustif)
 * Utilisées pour fallback si table product_colors inexistante
 */
export const PREDEFINED_COLORS = [
  'Noir',
  'Blanc',
  'Gris',
  'Beige',
  'Taupe',
  'Bleu',
  'Vert',
  'Rouge',
  'Rose',
  'Jaune',
  'Marron',
  'Or',
  'Argent',
  'Bronze',
  'Transparent',
] as const;

/**
 * @deprecated Utiliser DynamicColorSelector + useProductColors hook
 * Labels statiques conservés pour rétrocompatibilité uniquement
 */
export const COLOR_LABELS: Record<string, string> = {
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
  transparent: 'Transparent',
};

/**
 * @deprecated Utiliser DynamicColorSelector component à la place
 * Options statiques conservées pour rétrocompatibilité uniquement
 */
export const COLOR_OPTIONS = PREDEFINED_COLORS.map(color => ({
  value: color,
  label: color,
}));

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
  | 'mixte';

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
  mixte: 'Mixte',
};

/**
 * Options pour select UI
 */
export const MATERIAL_OPTIONS = Object.entries(MATERIAL_LABELS).map(
  ([value, label]) => ({
    value: value as ProductMaterial,
    label,
  })
);

// ===== INTERFACE PRINCIPALE =====

/**
 * Structure des attributs de variantes (JSONB en DB)
 *
 * Aligné avec products.variant_attributes JSONB column
 * Google Merchant Center: max 3 valeurs par attribut
 */
export interface VariantAttributes {
  color?: ProductColor;
  color_secondary?: ProductColor; // Optionnel: couleur secondaire
  material?: ProductMaterial;
  material_secondary?: ProductMaterial; // Optionnel: matériau secondaire
}

/**
 * Type pour formulaire édition (tous champs optionnels)
 */
export type VariantAttributesFormData = Partial<VariantAttributes>;

// ===== HELPERS & VALIDATION =====

/**
 * Vérifie si une valeur est une couleur valide
 * Système dynamique: toute chaîne non-vide est valide
 */
export function isValidColor(value: unknown): value is ProductColor {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Vérifie si une valeur est un matériau valide
 */
export function isValidMaterial(value: unknown): value is ProductMaterial {
  return typeof value === 'string' && value in MATERIAL_LABELS;
}

/**
 * Normalise une couleur (capitalisation) vers format standard
 * Ex: "bleu" → "Bleu", "ROUGE" → "Rouge"
 * Système dynamique: Capitalise première lettre
 */
export function normalizeColor(value: string): ProductColor | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Normalise un matériau vers format standard
 */
export function normalizeMaterial(value: string): ProductMaterial | null {
  const normalized = value.toLowerCase().trim();
  return isValidMaterial(normalized) ? normalized : null;
}

/**
 * Récupère le label d'affichage pour une couleur
 * Système dynamique: retourne la couleur telle quelle (déjà formatée)
 */
export function getColorLabel(
  color: ProductColor | string | null | undefined
): string {
  if (!color) return '-';
  return typeof color === 'string' ? color : '-';
}

/**
 * Récupère le label d'affichage pour un matériau
 */
export function getMaterialLabel(
  material: ProductMaterial | string | null | undefined
): string {
  if (!material) return '-';
  if (typeof material === 'string' && material in MATERIAL_LABELS) {
    return MATERIAL_LABELS[material as ProductMaterial];
  }
  return material;
}

/**
 * Valide un objet VariantAttributes complet
 * Retourne les erreurs de validation le cas échéant
 */
export function validateVariantAttributes(attributes: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!attributes || typeof attributes !== 'object') {
    return { valid: true, errors: [] }; // Attributs optionnels
  }

  const attrs = attributes as Record<string, unknown>;

  // Validation couleur principale
  if (attrs.color && !isValidColor(attrs.color)) {
    errors.push(`Couleur invalide: ${String(attrs.color)}`);
  }

  // Validation couleur secondaire
  if (attrs.color_secondary && !isValidColor(attrs.color_secondary)) {
    errors.push(
      `Couleur secondaire invalide: ${String(attrs.color_secondary)}`
    );
  }

  // Validation matériau principal
  if (attrs.material && !isValidMaterial(attrs.material)) {
    errors.push(`Matériau invalide: ${String(attrs.material)}`);
  }

  // Validation matériau secondaire
  if (attrs.material_secondary && !isValidMaterial(attrs.material_secondary)) {
    errors.push(
      `Matériau secondaire invalide: ${String(attrs.material_secondary)}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formate les attributs pour affichage UI (liste de badges)
 * Retourne tableau de { label, value } pour affichage
 */
export function formatAttributesForDisplay(
  attributes: VariantAttributes | null | undefined
): Array<{ label: string; value: string }> {
  if (!attributes) return [];

  const display: Array<{ label: string; value: string }> = [];

  if (attributes.color) {
    display.push({
      label: 'Couleur',
      value: getColorLabel(attributes.color),
    });
  }

  if (attributes.color_secondary) {
    display.push({
      label: 'Couleur secondaire',
      value: getColorLabel(attributes.color_secondary),
    });
  }

  if (attributes.material) {
    display.push({
      label: 'Matériau',
      value: getMaterialLabel(attributes.material),
    });
  }

  if (attributes.material_secondary) {
    display.push({
      label: 'Matériau secondaire',
      value: getMaterialLabel(attributes.material_secondary),
    });
  }

  return display;
}

/**
 * Règle de complétude d'un produit en sourcing — [BO-SOURCING-COMPLETUDE-001]
 *
 * Source de vérité UNIQUE côté écran. Son miroir exact en base est la fonction
 * `public.sourcing_missing_fields(uuid, text)` : les deux doivent toujours
 * renvoyer le même jeu de clés (test de parité
 * `__tests__/sourcing-completeness.test.ts`).
 *
 * Deux portes, décidées par Roméo le 2026-09-16 :
 *   - « Commander l'échantillon » : fournisseur + prix d'achat.
 *   - « Valider au catalogue »     : + sous-catégorie + une photo + référence fournisseur.
 *
 * Le poids est *conseillé* et ne bloque rien : il est utile au transport mais
 * n'empêche pas de vendre.
 *
 * Avant cette règle, le blocage n'était affiché que dans une bulle d'aide HTML
 * (`title`), invisible au toucher : les boutons semblaient cassés.
 */

/** Porte à franchir. */
export type SourcingRequirementScope = 'sample' | 'catalogue';

/** Clés échangées avec la base (`DETAIL` des erreurs VS002 / VL004). */
export type SourcingRequirementKey =
  | 'supplier_id'
  | 'cost_price'
  | 'subcategory_id'
  | 'images'
  | 'supplier_reference'
  | 'weight';

/** Endroit de la fiche où le champ se remplit. */
export type SourcingFieldSection =
  | 'general'
  | 'pricing'
  | 'supplier'
  | 'details'
  | 'photos';

export interface SourcingRequirement {
  key: SourcingRequirementKey;
  /** Libellé court, affiché tel quel dans la checklist et dans les messages. */
  label: string;
  /** Phrase d'aide, au présent, qui dit quoi faire. */
  hint: string;
  /** Section de la fiche à ouvrir quand on clique sur la ligne. */
  section: SourcingFieldSection;
  /** `true` = bloque l'action, `false` = simplement conseillé. */
  blocking: boolean;
}

/** Ce que la règle a besoin de lire sur un produit. */
export interface SourcingCompletenessProduct {
  supplier_id?: string | null;
  cost_price?: number | null;
  subcategory_id?: string | null;
  supplier_reference?: string | null;
  weight?: number | null;
  /** Images jointes depuis `product_images` (jointure de la liste sourcing). */
  product_images?: ReadonlyArray<unknown> | null;
  /** Repli quand la jointure n'est pas chargée (colonne `products.has_images`). */
  has_images?: boolean | null;
}

interface RequirementDefinition extends SourcingRequirement {
  /** `true` quand le champ est renseigné. */
  isSatisfied: (product: SourcingCompletenessProduct) => boolean;
  /** Portes auxquelles s'applique l'exigence. */
  scopes: ReadonlyArray<SourcingRequirementScope>;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasImage(product: SourcingCompletenessProduct): boolean {
  if (Array.isArray(product.product_images)) {
    return product.product_images.length > 0;
  }
  return product.has_images === true;
}

/**
 * Définitions, dans l'ordre d'affichage de la checklist : d'abord ce qui
 * bloque l'échantillon, puis ce qui bloque le catalogue, puis les conseils.
 */
const DEFINITIONS: ReadonlyArray<RequirementDefinition> = [
  {
    key: 'supplier_id',
    label: 'Fournisseur',
    hint: 'Reliez le fournisseur chez qui vous achetez ce produit.',
    section: 'supplier',
    blocking: true,
    scopes: ['sample', 'catalogue'],
    isSatisfied: p => hasText(p.supplier_id),
  },
  {
    key: 'cost_price',
    label: "Prix d'achat",
    hint: "Renseignez le prix d'achat hors taxes négocié avec le fournisseur.",
    section: 'pricing',
    blocking: true,
    scopes: ['sample', 'catalogue'],
    isSatisfied: p => typeof p.cost_price === 'number' && p.cost_price > 0,
  },
  {
    key: 'subcategory_id',
    label: 'Sous-catégorie',
    hint: 'Classez le produit : sans sous-catégorie, il ne peut être vendu nulle part.',
    section: 'general',
    blocking: true,
    scopes: ['catalogue'],
    isSatisfied: p => hasText(p.subcategory_id),
  },
  {
    key: 'images',
    label: 'Au moins une photo',
    hint: 'Ajoutez une photo du produit : elle est reprise sur tous les canaux.',
    section: 'photos',
    blocking: true,
    scopes: ['catalogue'],
    isSatisfied: hasImage,
  },
  {
    key: 'supplier_reference',
    label: 'Référence fournisseur',
    hint: 'Notez la référence du produit chez le fournisseur, pour recommander sans erreur.',
    section: 'general',
    blocking: true,
    scopes: ['catalogue'],
    isSatisfied: p => hasText(p.supplier_reference),
  },
  {
    key: 'weight',
    label: 'Poids',
    hint: "Conseillé : le poids sert au calcul des frais de port. N'empêche pas la validation.",
    section: 'details',
    blocking: false,
    scopes: ['catalogue'],
    isSatisfied: p => typeof p.weight === 'number' && p.weight > 0,
  },
];

function toRequirement(definition: RequirementDefinition): SourcingRequirement {
  const { key, label, hint, section, blocking } = definition;
  return { key, label, hint, section, blocking };
}

/** Toutes les exigences d'une porte, dans l'ordre d'affichage. */
export function requirementsFor(
  scope: SourcingRequirementScope
): SourcingRequirement[] {
  return DEFINITIONS.filter(d => d.scopes.includes(scope)).map(toRequirement);
}

/** Exigences non satisfaites, conseils compris. */
export function missingRequirements(
  product: SourcingCompletenessProduct,
  scope: SourcingRequirementScope
): SourcingRequirement[] {
  return DEFINITIONS.filter(
    d => d.scopes.includes(scope) && !d.isSatisfied(product)
  ).map(toRequirement);
}

/** Seules les exigences qui bloquent réellement l'action. */
export function blockingRequirements(
  product: SourcingCompletenessProduct,
  scope: SourcingRequirementScope
): SourcingRequirement[] {
  return missingRequirements(product, scope).filter(r => r.blocking);
}

/**
 * Clés bloquantes manquantes, triées — format d'échange avec la base.
 * `sourcing_missing_fields(produit, portée)` renvoie exactement ce tableau.
 */
export function missingFieldKeys(
  product: SourcingCompletenessProduct,
  scope: SourcingRequirementScope
): SourcingRequirementKey[] {
  return blockingRequirements(product, scope)
    .map(r => r.key)
    .sort((a, b) => a.localeCompare(b));
}

/** `true` quand l'action est possible. */
export function canPassGate(
  product: SourcingCompletenessProduct,
  scope: SourcingRequirementScope
): boolean {
  return blockingRequirements(product, scope).length === 0;
}

/** Traduit les clés renvoyées par la base en exigences affichables. */
export function requirementsFromKeys(
  keys: ReadonlyArray<string>
): SourcingRequirement[] {
  return keys
    .map(key => DEFINITIONS.find(d => d.key === key))
    .filter((d): d is RequirementDefinition => d !== undefined)
    .map(toRequirement);
}

/**
 * Phrase affichée sous un bouton désactivé.
 * Retourne `null` quand rien ne bloque.
 */
export function blockingMessage(
  product: SourcingCompletenessProduct,
  scope: SourcingRequirementScope
): string | null {
  const missing = blockingRequirements(product, scope);
  if (missing.length === 0) return null;
  const labels = missing.map(r => r.label.toLowerCase());
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`;
  return `À renseigner avant : ${list}.`;
}

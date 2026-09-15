/**
 * Règle unique « vendable » (BO-CHANNELS-P7-001), miroir de la fonction SQL
 * public.product_is_sellable (migration 20260914020000).
 *
 * Décision de Roméo (13/09) : vendable = actif ou en précommande, non retiré,
 * sorti du sourcing. S'ajoute aux drapeaux propres à chaque canal (publication
 * site, catalogue LinkMe, Google, Meta…), ne les remplace pas.
 *
 * Pure : testée par __tests__/is-product-sellable.test.ts.
 */

export const SELLABLE_PRODUCT_STATUSES: readonly string[] = [
  'active',
  'preorder',
];

export interface SellableProductFields {
  archived_at?: string | null;
  product_status?: string | null;
  creation_mode?: string | null;
}

export function isProductSellable(product: SellableProductFields): boolean {
  return unsellableReasons(product).length === 0;
}

export interface ProposableProductFields extends SellableProductFields {
  sourcing_status?: string | null;
}

const CLOSED_SOURCING_STATUSES = [
  'refused',
  'cancelled',
  'archived',
  'validated',
];

/**
 * Produit proposable dans une consultation : vendable, ou encore en sourcing
 * (non refusé, non validé) pour pouvoir le présenter au client. Jamais retiré.
 * Miroir de get_consultation_eligible_products (migration 20260914020300).
 */
export function isProductProposableInConsultation(
  product: ProposableProductFields
): boolean {
  if (product.archived_at) return false;
  if (isProductSellable(product)) return true;
  return (
    product.creation_mode === 'sourcing' &&
    !CLOSED_SOURCING_STATUSES.includes(product.sourcing_status ?? '')
  );
}

/** Motifs lisibles par l'utilisateur, vide si le produit est vendable. */
export function unsellableReasons(product: SellableProductFields): string[] {
  const reasons: string[] = [];
  if (product.archived_at) reasons.push('Produit retiré');
  if (
    !product.product_status ||
    !SELLABLE_PRODUCT_STATUSES.includes(product.product_status)
  ) {
    reasons.push('Statut non vendable (ni actif ni en précommande)');
  }
  if ((product.creation_mode ?? 'complete') === 'sourcing') {
    reasons.push('Produit encore en sourcing');
  }
  return reasons;
}

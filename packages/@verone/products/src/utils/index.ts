/**
 * @verone/products/utils
 * Utilitaires produits
 */

export * from './product-status-utils';
export * from './sku-generator';
export * from './sourcing-stage';
export * from './sourcing-completeness';
export * from './sourcing-offer-cost';
export * from './sourcing-stage-playbook';
export * from './derive-sample-state';
export * from './sourcing-journal';
export * from './product-evaluation';
export * from './is-product-sellable';
export * from './pricing-governance';
// Calcul de marge par canal et coût figé à la vente (PROFIT-001/002) : jusqu'ici
// atteignable seulement depuis l'intérieur du paquet, alors que les écrans en ont
// besoin (résolution du prix de revient notamment).
export * from './product-sales-margin';
export * from './pricing-view';

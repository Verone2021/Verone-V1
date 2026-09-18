/**
 * catalogue-pricing-view.ts — adaptateur entre le produit du catalogue et la vue
 * prix partagée (`buildPricingView` de `@verone/products/utils`).
 *
 * La règle, les seuils et les libellés vivent dans le paquet : la liste du
 * catalogue et la liste du canal Site Internet n'ont pas le même type de produit
 * mais doivent rendre le même verdict. Ici, on ne fait que traduire.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import type { Product } from '@verone/categories';
import type { ProductChannelPrices } from '@verone/channels';
import {
  type PricingView,
  buildPricingView as buildSharedPricingView,
  coefficientHierarchyOf,
} from '@verone/products/utils';

export {
  LANDED_ORIGIN_LABEL,
  SITE_SOURCE_LABEL,
  highestSeverity,
} from '@verone/products/utils';
export type {
  PricingAlert,
  PricingSeverity,
  PricingView,
} from '@verone/products/utils';

/** Nom historique, conservé pour les écrans du catalogue. */
export type CataloguePricingView = PricingView;

/** Construit la vue prix d'une ligne du catalogue. */
export function buildPricingView(
  product: Product,
  prices: ProductChannelPrices
): CataloguePricingView {
  const subcategory = product.subcategories ?? null;
  const category = subcategory?.category ?? null;
  const family = category?.family ?? null;

  return buildSharedPricingView({
    costPrice: product.cost_price ?? null,
    costNetAvg: product.cost_net_avg ?? null,
    costNetManual: product.cost_net_manual ?? null,
    ecoTaxHt: product.eco_tax_default ?? null,
    isPublishedOnline: product.is_published_online === true,
    hierarchy: coefficientHierarchyOf({ subcategory, category, family }),
    sitePriceHt: prices.sitePriceHt,
    sitePriceSource: prices.sitePriceSource,
    sitePriceValidatedAt: prices.sitePriceValidatedAt,
    linkmePriceHt: prices.linkmePriceHt,
  });
}

'use client';

/**
 * Cellules de prix de la ligne catalogue : Revient HT, Prix site, Marge.
 *
 * Le contenu vient de `@verone/products` — la liste du canal Site Internet
 * affiche exactement le même verdict. Ici, on ne fait que poser les `<td>` et
 * leurs règles de masquage par largeur d'écran.
 *
 * La colonne « Achat HT » reste dans `CatalogueProductRow` : elle porte l'édition
 * rapide du prix d'achat, déjà en place.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import {
  LandedCostValue,
  MarginValue,
  SitePriceValue,
} from '@verone/products/components/pricing';

import type { CataloguePricingView } from '../_lib/catalogue-pricing-view';

export function LandedCostCell({ view }: { view: CataloguePricingView }) {
  return (
    <td className="py-2 px-2 text-right hidden lg:table-cell">
      <LandedCostValue view={view} />
    </td>
  );
}

export function SitePriceCell({ view }: { view: CataloguePricingView }) {
  return (
    <td className="py-2 px-2 text-right">
      <SitePriceValue view={view} />
    </td>
  );
}

export function MarginCell({ view }: { view: CataloguePricingView }) {
  return (
    <td className="py-2 px-2 text-right hidden lg:table-cell">
      <MarginValue view={view} />
    </td>
  );
}

/**
 * Coût rendu d'une offre fournisseur — [BO-SOURCING-OFFRES-004]
 *
 * Avant toute commande, une offre ne dit que son prix unitaire. Ce qui décide,
 * c'est le **coût rendu** : prix + éco-participation + transport et douane
 * annoncés, ramenés à l'unité. Sans lui, comparer deux fournisseurs revient à
 * comparer un prix départ usine et un prix livré.
 *
 * Même logique que la base sur les commandes fournisseurs
 * (`allocate_po_fees_and_calculate_unit_cost`) : les frais sont répartis au
 * prorata, puis divisés par la quantité. Ici il n'y a qu'une ligne par offre,
 * le prorata vaut donc 1 et seule la division par la quantité subsiste.
 *
 * Pur : aucune dépendance React, Supabase ou navigateur.
 */

/** Les frais annoncés valent pour le lot entier, ou pour chaque unité. */
export type OfferShippingScope = 'per_order' | 'per_unit';

export interface OfferCostInput {
  /** Prix unitaire annoncé par le fournisseur, hors taxes. */
  quotedPrice: number | null;
  /** Quantité minimale de commande. Sert de base au calcul « pour le lot ». */
  quotedMoq?: number | null;
  /** Transport annoncé, hors taxes. */
  quotedShippingHt?: number | null;
  /** Douane annoncée, hors taxes. */
  quotedCustomsHt?: number | null;
  /** Portée des frais annoncés. Par défaut : pour le lot. */
  shippingScope?: OfferShippingScope | null;
  /** Éco-participation du produit, par unité. */
  ecoTax?: number | null;
}

export interface OfferCost {
  /** Quantité retenue pour ramener les frais à l'unité (jamais < 1). */
  quantity: number;
  /** Total des frais annoncés, ramené à l'unité. */
  feesPerUnit: number;
  /** Prix + éco-participation + frais, par unité. `null` sans prix annoncé. */
  landedUnitCost: number | null;
  /** Vrai quand des frais ont été annoncés : sinon le coût rendu = le prix. */
  hasFees: boolean;
}

function positive(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/** Arrondi commercial au centime, comme la base sur `unit_cost_net`. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function offerLandedUnitCost(input: OfferCostInput): OfferCost {
  const shipping = positive(input.quotedShippingHt);
  const customs = positive(input.quotedCustomsHt);
  const ecoTax = positive(input.ecoTax);
  const quantity = Math.max(1, Math.trunc(positive(input.quotedMoq)) || 1);
  const scope: OfferShippingScope = input.shippingScope ?? 'per_order';

  const fees = shipping + customs;
  const feesPerUnit =
    scope === 'per_unit' ? round2(fees) : round2(fees / quantity);

  const price = input.quotedPrice;
  const landedUnitCost =
    typeof price === 'number' && Number.isFinite(price)
      ? round2(price + ecoTax + feesPerUnit)
      : null;

  return { quantity, feesPerUnit, landedUnitCost, hasFees: fees > 0 };
}

// ---------------------------------------------------------------------------
// Comparatif
// ---------------------------------------------------------------------------

/** Statuts d'une offre, alignés sur `sourcing_candidate_suppliers_status_check`. */
export type OfferStatus =
  | 'identified'
  | 'contacted'
  | 'responded'
  | 'shortlisted'
  | 'selected'
  | 'rejected';

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  identified: 'Identifié',
  contacted: 'Contacté',
  responded: 'Devis reçu',
  shortlisted: 'Présélectionné',
  selected: 'Retenu',
  rejected: 'Écarté',
};

/** Suite logique proposée par l'écran pour faire avancer une offre. */
export const OFFER_NEXT_STATUS: Partial<Record<OfferStatus, OfferStatus>> = {
  identified: 'contacted',
  contacted: 'responded',
  responded: 'shortlisted',
};

export interface ComparableOffer extends OfferCostInput {
  id: string;
  status: string;
}

export interface OfferComparison<T extends ComparableOffer> {
  offer: T;
  cost: OfferCost;
  /** Meilleur coût rendu parmi les offres encore en lice. */
  isBest: boolean;
  /** Écart au prix cible, en euros puis en pourcentage. `null` sans cible. */
  gapToTarget: number | null;
  gapToTargetPercent: number | null;
}

/** Une offre écartée ne participe ni au classement ni au « meilleur prix ». */
function isInPlay(status: string): boolean {
  return status !== 'rejected';
}

/**
 * Compare des offres : coût rendu, meilleure offre, écart au prix cible.
 * L'ordre d'entrée est conservé — c'est l'écran qui décide du tri.
 */
export function compareOffers<T extends ComparableOffer>(
  offers: ReadonlyArray<T>,
  targetPrice?: number | null
): Array<OfferComparison<T>> {
  const costs = offers.map(offer => ({
    offer,
    cost: offerLandedUnitCost(offer),
  }));

  const enLice = costs.filter(
    c => isInPlay(c.offer.status) && c.cost.landedUnitCost !== null
  );
  const meilleur =
    enLice.length > 0
      ? Math.min(...enLice.map(c => c.cost.landedUnitCost as number))
      : null;

  const cible =
    typeof targetPrice === 'number' &&
    Number.isFinite(targetPrice) &&
    targetPrice > 0
      ? targetPrice
      : null;

  return costs.map(({ offer, cost }) => {
    const landed = cost.landedUnitCost;
    const gap =
      cible !== null && landed !== null ? round2(landed - cible) : null;
    return {
      offer,
      cost,
      isBest:
        meilleur !== null &&
        landed === meilleur &&
        isInPlay(offer.status) &&
        landed !== null,
      gapToTarget: gap,
      gapToTargetPercent:
        gap !== null && cible !== null ? round2((gap / cible) * 100) : null,
    };
  });
}

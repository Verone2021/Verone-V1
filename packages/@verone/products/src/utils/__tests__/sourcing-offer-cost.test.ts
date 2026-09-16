/**
 * Tests unitaires — Coût rendu d'une offre fournisseur (BO-SOURCING-OFFRES-004)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/sourcing-offer-cost.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  compareOffers,
  offerLandedUnitCost,
  OFFER_NEXT_STATUS,
  OFFER_STATUS_LABELS,
  type ComparableOffer,
} from '../sourcing-offer-cost';

// ---------------------------------------------------------------------------
// Coût rendu d'une offre
// ---------------------------------------------------------------------------

// Sans frais annoncés, le coût rendu est le prix
assert.deepEqual(offerLandedUnitCost({ quotedPrice: 12.5 }), {
  quantity: 1,
  feesPerUnit: 0,
  landedUnitCost: 12.5,
  hasFees: false,
});

// Frais pour le lot : répartis sur la quantité minimale
assert.deepEqual(
  offerLandedUnitCost({
    quotedPrice: 10,
    quotedMoq: 100,
    quotedShippingHt: 250,
    quotedCustomsHt: 50,
  }),
  { quantity: 100, feesPerUnit: 3, landedUnitCost: 13, hasFees: true }
);

// Frais par unité : ajoutés tels quels
assert.deepEqual(
  offerLandedUnitCost({
    quotedPrice: 10,
    quotedMoq: 100,
    quotedShippingHt: 2,
    quotedCustomsHt: 1,
    shippingScope: 'per_unit',
  }),
  { quantity: 100, feesPerUnit: 3, landedUnitCost: 13, hasFees: true }
);

// L'éco-participation entre dans le coût rendu
assert.equal(
  offerLandedUnitCost({ quotedPrice: 10, ecoTax: 2.5 }).landedUnitCost,
  12.5
);

// Sans prix annoncé, pas de coût rendu — mais les frais restent calculés
assert.deepEqual(
  offerLandedUnitCost({
    quotedPrice: null,
    quotedMoq: 10,
    quotedShippingHt: 100,
  }),
  { quantity: 10, feesPerUnit: 10, landedUnitCost: null, hasFees: true }
);

// Quantité minimale absente, nulle ou absurde : on retombe sur 1, jamais de
// division par zéro
for (const moq of [null, undefined, 0, -5, 0.4]) {
  assert.equal(
    offerLandedUnitCost({
      quotedPrice: 10,
      quotedMoq: moq,
      quotedShippingHt: 20,
    }).landedUnitCost,
    30,
    `moq ${String(moq)}`
  );
}

// Valeurs négatives ou non finies ignorées plutôt que propagées
assert.equal(
  offerLandedUnitCost({
    quotedPrice: 10,
    quotedShippingHt: -50,
    quotedCustomsHt: Number.NaN,
    ecoTax: -1,
  }).landedUnitCost,
  10
);

// Arrondi au centime, comme la base
assert.equal(
  offerLandedUnitCost({ quotedPrice: 10, quotedMoq: 3, quotedShippingHt: 10 })
    .landedUnitCost,
  13.33
);

// ---------------------------------------------------------------------------
// Comparatif
// ---------------------------------------------------------------------------

const offres: ComparableOffer[] = [
  // Prix le plus bas, mais transport lourd : n'est PAS la meilleure offre
  {
    id: 'a',
    status: 'responded',
    quotedPrice: 9,
    quotedMoq: 50,
    quotedShippingHt: 400,
  },
  // Prix plus élevé, transport léger : meilleure une fois rendu
  {
    id: 'b',
    status: 'responded',
    quotedPrice: 11,
    quotedMoq: 50,
    quotedShippingHt: 50,
  },
  // Écartée : hors classement même si elle serait la moins chère
  {
    id: 'c',
    status: 'rejected',
    quotedPrice: 5,
    quotedMoq: 50,
    quotedShippingHt: 0,
  },
  // Sans prix : pas de coût rendu, jamais « meilleure »
  { id: 'd', status: 'contacted', quotedPrice: null },
];

const comparatif = compareOffers(offres, 10);
const parId = Object.fromEntries(comparatif.map(c => [c.offer.id, c]));

assert.equal(parId.a.cost.landedUnitCost, 17);
assert.equal(parId.b.cost.landedUnitCost, 12);
assert.equal(parId.c.cost.landedUnitCost, 5);
assert.equal(parId.d.cost.landedUnitCost, null);

// Le moins cher départ usine n'est pas le moins cher rendu
assert.equal(
  parId.a.isBest,
  false,
  'a a le prix le plus bas mais pas le coût rendu'
);
assert.equal(parId.b.isBest, true);
// Une offre écartée ne peut pas être « la meilleure », même moins chère
assert.equal(parId.c.isBest, false);
assert.equal(parId.d.isBest, false);

// Écart au prix cible (10 €)
assert.equal(parId.b.gapToTarget, 2);
assert.equal(parId.b.gapToTargetPercent, 20);
assert.equal(parId.a.gapToTarget, 7);
assert.equal(parId.a.gapToTargetPercent, 70);
assert.equal(parId.d.gapToTarget, null);

// Sans prix cible, aucun écart n'est inventé
for (const cible of [null, undefined, 0, -3]) {
  const sansCible = compareOffers(offres, cible);
  assert.ok(
    sansCible.every(
      c => c.gapToTarget === null && c.gapToTargetPercent === null
    ),
    `cible ${String(cible)}`
  );
}

// L'ordre d'entrée est conservé : c'est l'écran qui trie
assert.deepEqual(
  comparatif.map(c => c.offer.id),
  ['a', 'b', 'c', 'd']
);

// Aucune offre en lice : pas de « meilleure »
assert.ok(
  compareOffers([{ id: 'x', status: 'rejected', quotedPrice: 1 }]).every(
    c => !c.isBest
  )
);
assert.deepEqual(compareOffers([]), []);

// ---------------------------------------------------------------------------
// Libellés et suite logique
// ---------------------------------------------------------------------------

assert.equal(OFFER_STATUS_LABELS.responded, 'Devis reçu');
assert.equal(OFFER_STATUS_LABELS.selected, 'Retenu');
assert.equal(OFFER_NEXT_STATUS.identified, 'contacted');
assert.equal(OFFER_NEXT_STATUS.responded, 'shortlisted');
// Une offre déjà retenue ou écartée n'a pas de suite automatique
assert.equal(OFFER_NEXT_STATUS.selected, undefined);
assert.equal(OFFER_NEXT_STATUS.rejected, undefined);

console.log('sourcing-offer-cost: OK');

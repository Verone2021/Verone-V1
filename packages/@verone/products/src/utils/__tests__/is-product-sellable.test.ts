/**
 * Tests unitaires - Règle unique « vendable » (BO-CHANNELS-P7-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/is-product-sellable.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  isProductProposableInConsultation,
  isProductSellable,
  unsellableReasons,
} from '../is-product-sellable';

// Même table de vérité que public.product_is_sellable
const cases: Array<
  [string | null, string | null, string | null, boolean, number]
> = [
  // archived_at, product_status, creation_mode, vendable, nb de motifs
  [null, 'active', 'complete', true, 0],
  [null, 'preorder', 'complete', true, 0],
  [null, 'active', null, true, 0],
  [null, 'draft', 'complete', false, 1],
  [null, 'discontinued', 'complete', false, 1],
  [null, null, 'complete', false, 1],
  ['2026-09-14', 'active', 'complete', false, 1],
  [null, 'preorder', 'sourcing', false, 1],
  [null, 'draft', 'sourcing', false, 2],
  ['2026-09-14', 'discontinued', 'sourcing', false, 3],
];

for (const [
  archived_at,
  product_status,
  creation_mode,
  sellable,
  count,
] of cases) {
  const product = { archived_at, product_status, creation_mode };
  const label = JSON.stringify(product);
  assert.equal(isProductSellable(product), sellable, label);
  assert.equal(unsellableReasons(product).length, count, label);
}

assert.deepEqual(
  unsellableReasons({
    archived_at: '2026-09-14',
    product_status: 'draft',
    creation_mode: 'sourcing',
  }),
  [
    'Produit retiré',
    'Statut non vendable (ni actif ni en précommande)',
    'Produit encore en sourcing',
  ]
);

// Consultations : vendable, ou sourcing encore en cours ; jamais retiré
const proposable: Array<
  [string | null, string | null, string | null, string | null, boolean]
> = [
  [null, 'active', 'complete', null, true],
  [null, 'preorder', 'complete', 'need_identified', true],
  [null, 'draft', 'complete', null, false],
  [null, 'draft', 'sourcing', 'evaluation', true],
  [null, 'draft', 'sourcing', null, true],
  [null, 'draft', 'sourcing', 'refused', false],
  [null, 'draft', 'sourcing', 'validated', false],
  ['2026-09-14', 'draft', 'sourcing', 'evaluation', false],
  ['2026-09-14', 'active', 'complete', null, false],
];
for (const [
  archived_at,
  product_status,
  creation_mode,
  sourcing_status,
  expected,
] of proposable) {
  const product = {
    archived_at,
    product_status,
    creation_mode,
    sourcing_status,
  };
  assert.equal(
    isProductProposableInConsultation(product),
    expected,
    JSON.stringify(product)
  );
}

console.log('is-product-sellable: OK');

/**
 * Tests unitaires - Segments de la liste sourcing (BO-SOURCING-P5-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/sourcing-segments.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  SOURCING_LIST_SEGMENTS,
  SOURCING_STAGES,
  segmentOfProduct,
  segmentQuery,
  stageOfStatus,
  statusesOfStage,
  type SourcingSegmentProduct,
  type SourcingSegmentQuery,
} from '../sourcing-stage';

// Valeurs autorisées par la contrainte products_sourcing_status_check (+ vide)
const STATUSES: Array<string | null> = [
  null,
  'need_identified',
  'supplier_search',
  'initial_contact',
  'evaluation',
  'negotiation',
  'sample_requested',
  'sample_received',
  'sample_approved',
  'order_placed',
  'received',
  'on_hold',
  'cancelled',
  'archived',
  'refused',
  'validated',
];

/** Reproduit en mémoire le filtrage que use-sourcing-fetch envoie à la base. */
function matches(
  query: SourcingSegmentQuery,
  product: SourcingSegmentProduct
): boolean {
  if (query.creationMode && product.creation_mode !== query.creationMode) {
    return false;
  }
  if (query.withdrawn !== Boolean(product.archived_at)) return false;
  if (query.statuses === null) return true;
  if (product.sourcing_status == null) return query.includeNullStatus;
  return query.statuses.includes(product.sourcing_status);
}

const products: SourcingSegmentProduct[] = [];
for (const creation_mode of ['sourcing', 'complete']) {
  for (const archived_at of [null, '2026-09-14T00:00:00Z']) {
    for (const sourcing_status of STATUSES) {
      products.push({ creation_mode, archived_at, sourcing_status });
    }
  }
}

// Partition : chaque produit est dans le segment que la requête renvoie, et
// dans aucun autre
for (const product of products) {
  const expected = segmentOfProduct(product);
  for (const segment of SOURCING_LIST_SEGMENTS) {
    assert.equal(
      matches(segmentQuery(segment), product),
      expected === segment,
      `${segment} ${JSON.stringify(product)}`
    );
  }
}

// Filtre d'étape dans « En cours » : même regroupement que l'écran
for (const stage of SOURCING_STAGES) {
  for (const product of products) {
    const expected =
      segmentOfProduct(product) === 'in_progress' &&
      stageOfStatus(product.sourcing_status).stage === stage;
    assert.equal(
      matches(segmentQuery('in_progress', stage), product),
      expected,
      `${stage} ${JSON.stringify(product)}`
    );
  }
}

// Cas métier lisibles
assert.equal(
  segmentOfProduct({
    creation_mode: 'sourcing',
    sourcing_status: 'order_placed',
  }),
  'in_progress'
);
assert.equal(
  segmentOfProduct({
    creation_mode: 'sourcing',
    sourcing_status: 'evaluation',
    archived_at: '2026-09-14',
  }),
  'withdrawn'
);
// Validé : au catalogue, visible dans « Validés »
assert.equal(
  segmentOfProduct({ creation_mode: 'complete', sourcing_status: 'validated' }),
  'validated'
);
// Produit du catalogue sans historique sourcing : hors liste
assert.equal(
  segmentOfProduct({
    creation_mode: 'complete',
    sourcing_status: 'need_identified',
  }),
  null
);

assert.deepEqual(statusesOfStage('supplier_search'), [
  'need_identified',
  'supplier_search',
]);
assert.deepEqual(statusesOfStage('negotiation'), [
  'negotiation',
  'sample_requested',
  'sample_received',
  'sample_approved',
  'order_placed',
  'received',
]);

console.log('sourcing-segments: OK');

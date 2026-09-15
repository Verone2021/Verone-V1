/**
 * Tests unitaires - État de l'échantillon calculé depuis les commandes (BO-SOURCING-P4-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/derive-sample-state.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  deriveSampleState,
  type SamplePurchaseOrderStatus,
  type SampleOrderLine,
} from '../derive-sample-state';

function line(
  orderId: string,
  poStatus: SamplePurchaseOrderStatus,
  orderCreatedAt: string,
  overrides: Partial<SampleOrderLine> = {}
): SampleOrderLine {
  return {
    itemId: `item-${orderId}`,
    itemArchivedAt: null,
    orderId,
    poNumber: `PO-${orderId}`,
    poStatus,
    poType: 'sample',
    orderCreatedAt,
    ...overrides,
  };
}

// Aucune commande : aucun échantillon
assert.deepEqual(deriveSampleState([]), {
  state: 'none',
  order: null,
  itemId: null,
});

// Chaque statut de commande donne l'état attendu, et la ligne évaluable (BO-SOURCING-P4B-001)
const expected: Array<[SamplePurchaseOrderStatus, string]> = [
  ['draft', 'to_send'],
  ['validated', 'ordered'],
  ['partially_received', 'received'],
  ['received', 'received'],
  ['cancelled', 'cancelled'],
];
for (const [status, state] of expected) {
  const result = deriveSampleState([line('a', status, '2026-09-01')]);
  assert.equal(result.state, state, status);
  assert.deepEqual(result.order, { id: 'a', poNumber: 'PO-a', status });
  assert.equal(result.itemId, 'item-a', status);
}

// Une commande annulée n'empêche pas une nouvelle commande active
assert.deepEqual(
  deriveSampleState([
    line('old', 'cancelled', '2026-09-01'),
    line('new', 'validated', '2026-09-05'),
  ]),
  {
    state: 'ordered',
    order: { id: 'new', poNumber: 'PO-new', status: 'validated' },
    itemId: 'item-new',
  }
);

// L'active l'emporte même si une commande annulée est plus récente
assert.equal(
  deriveSampleState([
    line('active', 'draft', '2026-09-01'),
    line('cancelled', 'cancelled', '2026-09-05'),
  ]).state,
  'to_send'
);

// Ligne archivée : ne compte plus comme échantillon actif
assert.equal(
  deriveSampleState([
    line('a', 'validated', '2026-09-01', { itemArchivedAt: '2026-09-02' }),
  ]).state,
  'cancelled'
);

// Commandes standard ignorées (réapprovisionnement)
assert.deepEqual(
  deriveSampleState([
    line('std', 'received', '2026-09-01', { poType: 'standard' }),
  ]),
  { state: 'none', order: null, itemId: null }
);

// Plusieurs annulées : la plus récente est proposée
assert.equal(
  deriveSampleState([
    line('first', 'cancelled', '2026-09-01'),
    line('last', 'cancelled', '2026-09-09'),
  ]).order?.id,
  'last'
);

console.log('derive-sample-state: OK');

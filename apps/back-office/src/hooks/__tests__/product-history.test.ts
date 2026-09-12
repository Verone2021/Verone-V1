/**
 * Tests unitaires - Produits qui ont servi (suppression interdite)
 *
 * Exécution: npx tsx apps/back-office/src/hooks/__tests__/product-history.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  PRODUCT_USED_MESSAGE,
  productIdsWithHistory,
  type ProductHistoryRow,
} from '../product-history';

function row(
  id: string,
  counts: Partial<Record<Exclude<keyof ProductHistoryRow, 'id'>, number>>
): ProductHistoryRow {
  const rel = (n: number | undefined) => [{ count: n ?? 0 }];
  return {
    id,
    consultation_products: rel(counts.consultation_products),
    purchase_order_items: rel(counts.purchase_order_items),
    sales_order_items: rel(counts.sales_order_items),
    stock_movements: rel(counts.stock_movements),
  };
}

// Aucun historique : supprimable
assert.deepEqual([...productIdsWithHistory([row('a', {})])], []);

// Chaque table suffit à interdire la suppression
for (const key of [
  'consultation_products',
  'purchase_order_items',
  'sales_order_items',
  'stock_movements',
] as const) {
  assert.deepEqual([...productIdsWithHistory([row('b', { [key]: 1 })])], ['b']);
}

// Relations absentes ou vides = 0
assert.deepEqual(
  [
    ...productIdsWithHistory([
      {
        id: 'c',
        consultation_products: null,
        purchase_order_items: undefined,
        sales_order_items: [],
        stock_movements: [{ count: 0 }],
      },
    ]),
  ],
  []
);

// Liste mixte
assert.deepEqual(
  [
    ...productIdsWithHistory([
      row('d', {}),
      row('e', { sales_order_items: 3, stock_movements: 2 }),
      row('f', { consultation_products: 1 }),
    ]),
  ],
  ['e', 'f']
);

assert.equal(
  PRODUCT_USED_MESSAGE,
  'Ce produit a servi : retirez-le, ne le supprimez pas'
);

console.log('product-history: OK');

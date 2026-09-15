/**
 * Tests unitaires — filterBillableItems, countUnpricedLines, filterActiveItems
 *
 * Exécution : npx tsx packages/@verone/consultations/src/lib/__tests__/consultation-order-guards.test.ts
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { strict as assert } from 'node:assert';
import {
  filterBillableItems,
  countUnpricedLines,
  filterActiveItems,
  filterClientVisibleItems,
  isWithdrawnItem,
} from '../consultation-order-guards';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(err);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const item = (overrides: {
  status?: string;
  is_free?: boolean;
  unit_price?: number | null;
  id?: string;
  archived_at?: string | null;
}) => ({
  id: overrides.id ?? 'i1',
  status: overrides.status ?? 'pending',
  is_free: overrides.is_free ?? false,
  unit_price: overrides.unit_price !== undefined ? overrides.unit_price : 10,
  product: { archived_at: overrides.archived_at ?? null },
});

// ---------------------------------------------------------------------------
// filterBillableItems
// ---------------------------------------------------------------------------

console.log('\nfilterBillableItems');

test('include normal item with price', () => {
  const result = filterBillableItems([item({})]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.unit_price, 10);
});

test('exclude rejected item', () => {
  const result = filterBillableItems([item({ status: 'rejected' })]);
  assert.equal(result.length, 0);
});

test('exclude free item', () => {
  const result = filterBillableItems([item({ is_free: true })]);
  assert.equal(result.length, 0);
});

test('exclude item with null price', () => {
  const result = filterBillableItems([item({ unit_price: null })]);
  assert.equal(result.length, 0);
});

test('type predicate: unit_price typed as number in result', () => {
  const items = [item({ unit_price: 42 })];
  const billable = filterBillableItems(items);
  // Should compile without error (unit_price is number, not number | null)
  const total = billable.reduce((s, i) => s + i.unit_price * 1, 0);
  assert.equal(total, 42);
});

test('filter mixed array: 2 billable out of 5', () => {
  const items = [
    item({ id: 'a', status: 'pending', unit_price: 10 }),
    item({ id: 'b', status: 'rejected', unit_price: 10 }),
    item({ id: 'c', is_free: true, unit_price: 0 }),
    item({ id: 'd', unit_price: null }),
    item({ id: 'e', status: 'accepted', unit_price: 20 }),
  ];
  const result = filterBillableItems(items);
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map(i => i.id),
    ['a', 'e']
  );
});

// ---------------------------------------------------------------------------
// countUnpricedLines
// ---------------------------------------------------------------------------

console.log('\ncountUnpricedLines');

test('zero when all items priced', () => {
  const items = [item({ unit_price: 10 }), item({ unit_price: 20 })];
  assert.equal(countUnpricedLines(items), 0);
});

test('count null-priced non-free non-rejected items', () => {
  const items = [
    item({ unit_price: null }),
    item({ unit_price: null, status: 'rejected' }), // excluded
    item({ unit_price: null, is_free: true }), // excluded
    item({ unit_price: null }), // counted
  ];
  assert.equal(countUnpricedLines(items), 2);
});

test('free item with null price not counted', () => {
  const items = [item({ unit_price: null, is_free: true })];
  assert.equal(countUnpricedLines(items), 0);
});

// ---------------------------------------------------------------------------
// filterActiveItems
// ---------------------------------------------------------------------------

console.log('\nfilterActiveItems');

test('include pending, accepted, sample items', () => {
  const items = [
    item({ id: 'a', status: 'pending' }),
    item({ id: 'b', status: 'accepted' }),
    item({ id: 'c', status: 'sample' }),
  ];
  const result = filterActiveItems(items);
  assert.equal(result.length, 3);
});

test('exclude rejected items', () => {
  const items = [
    item({ id: 'a', status: 'rejected' }),
    item({ id: 'b', status: 'pending' }),
    item({ id: 'c', status: 'rejected' }),
  ];
  const result = filterActiveItems(items);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'b');
});

test('include free items with null price (visible in PDF)', () => {
  const items = [item({ is_free: true, unit_price: null })];
  const result = filterActiveItems(items);
  assert.equal(result.length, 1);
});

// ---------------------------------------------------------------------------
// Produits retirés (BO-PRODUCTS-P8-001, décision D5)
// ---------------------------------------------------------------------------

console.log('\nproduits retirés');

test('isWithdrawnItem reads product.archived_at', () => {
  assert.equal(isWithdrawnItem(item({ archived_at: '2026-09-14' })), true);
  assert.equal(isWithdrawnItem(item({})), false);
  assert.equal(
    isWithdrawnItem({ status: 'pending', is_free: false, unit_price: 1 }),
    false
  );
  assert.equal(
    isWithdrawnItem({
      status: 'pending',
      is_free: false,
      unit_price: 1,
      product: null,
    }),
    false
  );
});

test('withdrawn lines are not billable', () => {
  const items = [
    item({ id: 'a', archived_at: '2026-09-14' }),
    item({ id: 'b' }),
  ];
  const result = filterBillableItems(items);
  assert.deepEqual(
    result.map(i => i.id),
    ['b']
  );
});

test('withdrawn unpriced lines do not block the order', () => {
  const items = [
    item({ id: 'a', unit_price: null, archived_at: '2026-09-14' }),
    item({ id: 'b', unit_price: null }),
  ];
  assert.equal(countUnpricedLines(items), 1);
});

test('client PDF hides rejected and withdrawn lines', () => {
  const items = [
    item({ id: 'a', archived_at: '2026-09-14' }),
    item({ id: 'b', status: 'rejected' }),
    item({ id: 'c', is_free: true, unit_price: null }),
    item({ id: 'd' }),
  ];
  assert.deepEqual(
    filterClientVisibleItems(items).map(i => i.id),
    ['c', 'd']
  );
});

test('internal report keeps withdrawn lines (filterActiveItems unchanged)', () => {
  const items = [
    item({ id: 'a', archived_at: '2026-09-14' }),
    item({ id: 'b' }),
  ];
  assert.equal(filterActiveItems(items).length, 2);
});

// ---------------------------------------------------------------------------
// Résumé
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

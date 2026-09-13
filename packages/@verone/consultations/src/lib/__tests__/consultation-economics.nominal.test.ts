/**
 * Tests unitaires — cas nominaux (c9b18dc9 et 25fd2694)
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { strict as assert } from 'node:assert';
import { computeLineEconomics } from '../consultation-economics';
import {
  approxEqual,
  makeLine,
  createTestRunner,
} from './consultation-economics.test-utils';

const { test, report } = createTestRunner();

// ---------------------------------------------------------------------------
// (a) Ligne c9b18dc9 — cas nominal
// ---------------------------------------------------------------------------

console.log('\n--- (a) NOMINAL c9b18dc9 ---');

test('c9b18dc9 : cost 315, revenue 495, margin 180, marginPercent ≈ 57.142857, unitCostPrice 10.5', () => {
  const line = makeLine({
    id: 'c9b18dc9-line',
    quantity: 30,
    unitCost: 5,
    ecoTax: 0,
    shippingCost: 165,
    sellingShippingCost: 0,
    proposedPrice: 16.5,
    isFree: false,
    isSample: false,
    status: 'pending',
  });

  const r = computeLineEconomics(line);

  assert.equal(r.cost, 315, `cost attendu 315, obtenu ${r.cost}`);
  assert.equal(r.revenue, 495, `revenue attendu 495, obtenu ${r.revenue}`);
  assert.equal(r.margin, 180, `margin attendu 180, obtenu ${r.margin}`);
  assert.ok(
    r.marginPercent !== null && approxEqual(r.marginPercent, 57.142857, 0.001),
    `marginPercent attendu ≈57.142857, obtenu ${r.marginPercent}`
  );
  assert.ok(
    approxEqual(r.unitCostPrice, 10.5),
    `unitCostPrice attendu 10.5, obtenu ${r.unitCostPrice}`
  );
  assert.equal(r.included, true);
  assert.equal(r.costMissing, false);
  assert.equal(r.priceToFix, false);
  assert.equal(r.fees, 165);
});

// ---------------------------------------------------------------------------
// (b) Ligne 25fd2694
// ---------------------------------------------------------------------------

console.log('\n--- (b) LIGNE 25fd2694 ---');

test('25fd2694 : cost 7, revenue 15, margin 8, marginPercent ≈ 114.2857', () => {
  const line = makeLine({
    id: '25fd2694-line',
    quantity: 1,
    unitCost: 5,
    ecoTax: 0,
    shippingCost: 2,
    sellingShippingCost: 0,
    proposedPrice: 15,
    isFree: false,
    isSample: false,
    status: 'approved',
  });

  const r = computeLineEconomics(line);

  assert.equal(r.cost, 7, `cost attendu 7, obtenu ${r.cost}`);
  assert.equal(r.revenue, 15, `revenue attendu 15, obtenu ${r.revenue}`);
  assert.equal(r.margin, 8, `margin attendu 8, obtenu ${r.margin}`);
  assert.ok(
    r.marginPercent !== null && approxEqual(r.marginPercent, 114.2857, 0.001),
    `marginPercent attendu ≈114.2857, obtenu ${r.marginPercent}`
  );
  assert.equal(
    r.unitCostPrice,
    7,
    `unitCostPrice attendu 7, obtenu ${r.unitCostPrice}`
  );
});

// ---------------------------------------------------------------------------
// Cas supplémentaires — costMissing + sellingShippingCost
// ---------------------------------------------------------------------------

console.log('\n--- CAS SUPPLÉMENTAIRES ---');

test('costMissing si unitCost null', () => {
  const line = makeLine({ unitCost: null, proposedPrice: 20 });
  const r = computeLineEconomics(line);
  assert.equal(r.costMissing, true);
  assert.equal(r.unitCost, 0, 'unitCost forcé à 0 si null');
});

test('sellingShippingCost ajouté au revenue', () => {
  const line = makeLine({
    quantity: 2,
    unitCost: 5,
    proposedPrice: 10,
    shippingCost: 0,
    sellingShippingCost: 30,
    isFree: false,
    isSample: false,
  });
  const r = computeLineEconomics(line);
  // revenue = 10×2 + 30 = 50
  assert.equal(r.revenue, 50, `revenue attendu 50, obtenu ${r.revenue}`);
});

report('NOMINAL');

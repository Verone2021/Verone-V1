/**
 * Tests unitaires — lignes gratuites et échantillons
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
// (c) Échantillon gratuit Globe pm
// ---------------------------------------------------------------------------

console.log('\n--- (c) ÉCHANTILLON GRATUIT Globe pm ---');

test('Globe pm (isFree+isSample) : revenue 0, fees 0, cost 7.6, margin -7.6, marginPercent null', () => {
  const line = makeLine({
    id: 'globe-pm',
    quantity: 2,
    unitCost: 3.7,
    ecoTax: 0.1,
    shippingCost: 1.5,
    sellingShippingCost: 0,
    proposedPrice: 8.0,
    isFree: true,
    isSample: true,
    status: 'approved',
  });

  const r = computeLineEconomics(line);

  assert.equal(r.revenue, 0, `revenue attendu 0, obtenu ${r.revenue}`);
  assert.equal(r.fees, 0, `fees attendu 0, obtenu ${r.fees}`);
  assert.ok(approxEqual(r.cost, 7.6), `cost attendu 7.6, obtenu ${r.cost}`);
  assert.ok(
    approxEqual(r.margin, -7.6),
    `margin attendu -7.6, obtenu ${r.margin}`
  );
  assert.equal(r.marginPercent, null, `marginPercent doit être null`);
  assert.equal(r.priceToFix, false, 'isFree donc priceToFix = false');
});

// ---------------------------------------------------------------------------
// (j) Gratuit non-échantillon avec transport ⇒ fees 0
// ---------------------------------------------------------------------------

console.log('\n--- (j) GRATUIT NON-ÉCHANTILLON AVEC TRANSPORT ---');

test('isFree=true, isSample=false, shippingCost=50 → fees=0', () => {
  const line = makeLine({
    isFree: true,
    isSample: false,
    shippingCost: 50,
    sellingShippingCost: 10,
    proposedPrice: 99,
    unitCost: 20,
  });

  const r = computeLineEconomics(line);
  assert.equal(r.fees, 0, `fees doit être 0 pour isFree, obtenu ${r.fees}`);
  assert.equal(r.revenue, 0, 'revenue = 0 pour isFree');
  // cost = (20+0)×1 + 0 = 20
  assert.equal(r.cost, 20);
  assert.equal(r.marginPercent, null, 'marginPercent null pour isFree');
  assert.equal(r.priceToFix, false, 'isFree donc priceToFix=false');
});

report('FREE-SAMPLE');

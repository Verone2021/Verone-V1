/**
 * Tests unitaires — gardes de validation (rejets, frais, quantité invalide)
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { strict as assert } from 'node:assert';
import {
  computeLineEconomics,
  computeConsultationEconomics,
} from '../consultation-economics';
import {
  makeLine,
  createTestRunner,
} from './consultation-economics.test-utils';

const { test, report } = createTestRunner();

// ---------------------------------------------------------------------------
// (d) Ligne refusée exclue des totaux
// ---------------------------------------------------------------------------

console.log('\n--- (d) LIGNE REFUSÉE ---');

test('ligne rejected : included=false, exclue des totaux', () => {
  const rejected = makeLine({
    id: 'rejected-line',
    quantity: 5,
    unitCost: 10,
    proposedPrice: 20,
    status: 'rejected',
  });
  const active = makeLine({
    id: 'active-line',
    quantity: 1,
    unitCost: 5,
    proposedPrice: 15,
    shippingCost: 2,
    status: 'pending',
  });

  const r = computeLineEconomics(rejected);
  assert.equal(r.included, false, 'rejected doit être included=false');

  const { lines, totals } = computeConsultationEconomics([rejected, active]);
  assert.equal(lines[0].included, false);
  assert.equal(lines[1].included, true);
  // Seule la ligne active compte : revenue=15, cost=7, margin=8
  assert.equal(
    totals.revenue,
    15,
    `totaux revenue = 15 (hors rejected), obtenu ${totals.revenue}`
  );
  assert.equal(
    totals.cost,
    7,
    `totaux cost = 7 (hors rejected), obtenu ${totals.cost}`
  );
  assert.equal(totals.includedLines, 1);
});

// ---------------------------------------------------------------------------
// (e) Frais 0
// ---------------------------------------------------------------------------

console.log('\n--- (e) FRAIS 0 ---');

test('frais à 0 : fees=0, ne plante pas', () => {
  const line = makeLine({
    quantity: 5,
    unitCost: 10,
    ecoTax: 0,
    shippingCost: 0,
    sellingShippingCost: 0,
    proposedPrice: 20,
  });

  const r = computeLineEconomics(line);
  assert.equal(r.fees, 0);
  assert.equal(r.cost, 50);
  assert.equal(r.revenue, 100);
});

// ---------------------------------------------------------------------------
// (f) Quantité 0 ⇒ RangeError
// ---------------------------------------------------------------------------

console.log('\n--- (f) QUANTITÉ 0 ---');

test('quantity=0 lève RangeError', () => {
  const line = makeLine({ quantity: 0 });
  let threw = false;
  try {
    computeLineEconomics(line);
  } catch (e) {
    threw = true;
    assert.ok(e instanceof RangeError, `Doit être RangeError, reçu: ${e}`);
  }
  assert.ok(threw, 'Doit avoir lancé RangeError');
});

test('quantity négative lève RangeError', () => {
  const line = makeLine({ quantity: -3 });
  let threw = false;
  try {
    computeLineEconomics(line);
  } catch (e) {
    threw = true;
    assert.ok(e instanceof RangeError);
  }
  assert.ok(threw);
});

// ---------------------------------------------------------------------------
// Totaux multi-lignes
// ---------------------------------------------------------------------------

console.log('\n--- TOTAUX MULTI-LIGNES ---');

test('totaux computeConsultationEconomics sur plusieurs lignes incluses', () => {
  const lines = [
    makeLine({
      id: 'l1',
      quantity: 30,
      unitCost: 5,
      shippingCost: 165,
      proposedPrice: 16.5,
    }),
    makeLine({
      id: 'l2',
      quantity: 1,
      unitCost: 5,
      shippingCost: 2,
      proposedPrice: 15,
    }),
  ];

  const { totals } = computeConsultationEconomics(lines);

  // l1: revenue=495, cost=315
  // l2: revenue=15, cost=7
  assert.equal(
    totals.revenue,
    510,
    `totaux revenue=510, obtenu ${totals.revenue}`
  );
  assert.equal(totals.cost, 322, `totaux cost=322, obtenu ${totals.cost}`);
  assert.equal(totals.includedLines, 2);
  assert.equal(totals.linesToPrice, 0);
});

report('GUARDS');

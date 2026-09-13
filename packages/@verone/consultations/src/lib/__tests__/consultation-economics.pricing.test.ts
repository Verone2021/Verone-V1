/**
 * Tests unitaires — gestion des prix (null, marge par défaut, supplierCosts)
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { strict as assert } from 'node:assert';
import {
  computeLineEconomics,
  computeConsultationEconomics,
} from '../consultation-economics';
import {
  approxEqual,
  makeLine,
  createTestRunner,
} from './consultation-economics.test-utils';

const { test, report } = createTestRunner();

// ---------------------------------------------------------------------------
// (g) Prix null sans marge ⇒ priceToFix=true, revenue=0
// ---------------------------------------------------------------------------

console.log('\n--- (g) PRIX NULL SANS MARGE ---');

test('proposedPrice=null, pas de marge → unitPrice null, priceToFix true, revenue 0', () => {
  const line = makeLine({
    proposedPrice: null,
    marginPercentage: null,
  });

  const r = computeLineEconomics(line, { defaultMarginPercentage: null });

  assert.equal(r.unitPrice, null, `unitPrice doit être null`);
  assert.equal(r.priceToFix, true, `priceToFix doit être true`);
  assert.equal(r.revenue, 0, `revenue doit être 0`);
  assert.equal(r.defaultUnitPrice, null);
  assert.equal(r.marginPercent, null);
});

// ---------------------------------------------------------------------------
// (h) Marge par défaut 50%
// ---------------------------------------------------------------------------

console.log('\n--- (h) MARGE PAR DÉFAUT 50% ---');

test('defaultMarginPercentage=50, unitCost=10, ecoTax=0, shippingCost=0 → defaultUnitPrice=15', () => {
  const line = makeLine({
    proposedPrice: null,
    unitCost: 10,
    ecoTax: 0,
    shippingCost: 0,
    marginPercentage: null,
  });

  const r = computeLineEconomics(line, { defaultMarginPercentage: 50 });

  // unitCostPrice = 10 + 0 + 0/1 = 10
  // defaultUnitPrice = 10 × 1.5 = 15
  assert.ok(
    r.defaultUnitPrice !== null && approxEqual(r.defaultUnitPrice, 15),
    `defaultUnitPrice attendu 15, obtenu ${r.defaultUnitPrice}`
  );
  assert.ok(
    r.unitPrice !== null && approxEqual(r.unitPrice, 15),
    `unitPrice attendu 15, obtenu ${r.unitPrice}`
  );
  assert.equal(r.priceToFix, false);
});

test('marginPercentage ligne prioritaire sur defaultMarginPercentage', () => {
  const line = makeLine({
    proposedPrice: null,
    unitCost: 10,
    marginPercentage: 100, // 100% ligne, ignore 50% global
  });

  const r = computeLineEconomics(line, { defaultMarginPercentage: 50 });

  // defaultUnitPrice = 10 × 2 = 20
  assert.ok(
    r.defaultUnitPrice !== null && approxEqual(r.defaultUnitPrice, 20),
    `defaultUnitPrice attendu 20, obtenu ${r.defaultUnitPrice}`
  );
});

// ---------------------------------------------------------------------------
// (i) supplierCosts non vide ⇒ erreur
// ---------------------------------------------------------------------------

console.log('\n--- (i) SUPPLIER COSTS NON VIDE ---');

test('supplierCosts non vide → Error "phase P10"', () => {
  const line = makeLine();
  let threw = false;
  try {
    computeLineEconomics(line, {
      supplierCosts: [{ supplierId: 'sup-1', amount: 100 }],
    });
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error, 'Doit être Error');
    assert.ok(
      e.message.includes('P10'),
      `Message doit mentionner P10, reçu: ${e.message}`
    );
  }
  assert.ok(threw, 'Doit avoir lancé Error');
});

test('computeConsultationEconomics avec supplierCosts non vide → Error "phase P10"', () => {
  const line = makeLine();
  let threw = false;
  try {
    computeConsultationEconomics([line], {
      supplierCosts: [{ supplierId: 'sup-1', amount: 50 }],
    });
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error);
  }
  assert.ok(threw);
});

// ---------------------------------------------------------------------------
// linesToPrice
// ---------------------------------------------------------------------------

console.log('\n--- linesToPrice ---');

test('linesToPrice compte les lignes sans prix', () => {
  const lines = [
    makeLine({ id: 'l-fix', proposedPrice: null, marginPercentage: null }),
    makeLine({ id: 'l-ok', proposedPrice: 20 }),
    makeLine({ id: 'l-free', proposedPrice: null, isFree: true }), // isFree → priceToFix=false
  ];

  const { totals } = computeConsultationEconomics(lines);
  assert.equal(
    totals.linesToPrice,
    1,
    `linesToPrice=1, obtenu ${totals.linesToPrice}`
  );
});

test("totals.marginPercent null tant qu'un prix reste à fixer (pas de -100 %)", () => {
  // Cas c05a3a64 : une ligne à fixer + une ligne gratuite échantillon
  const lines = [
    makeLine({
      id: 'globe-gm',
      quantity: 1,
      unitCost: 5,
      ecoTax: 0.1,
      proposedPrice: null,
      marginPercentage: null,
    }),
    makeLine({
      id: 'globe-pm',
      quantity: 2,
      unitCost: 3.7,
      ecoTax: 0.1,
      proposedPrice: 8,
      shippingCost: 1.5,
      isFree: true,
      isSample: true,
    }),
  ];

  const { totals } = computeConsultationEconomics(lines);
  assert.equal(totals.linesToPrice, 1);
  assert.equal(
    totals.marginPercent,
    null,
    `marginPercent total doit être null, obtenu ${totals.marginPercent}`
  );
  assert.ok(
    approxEqual(totals.cost, 12.7),
    `cost attendu 12.7, obtenu ${totals.cost}`
  );
});

test('totals.marginPercent calculé quand tous les prix sont fixés', () => {
  // Cas c9b18dc9 : coût 315, CA 495 ⇒ 57,14 %
  const lines = [
    makeLine({
      id: 'plateaux',
      quantity: 30,
      unitCost: 5,
      ecoTax: 0,
      proposedPrice: 16.5,
      shippingCost: 165,
      sellingShippingCost: 0,
    }),
  ];

  const { totals } = computeConsultationEconomics(lines);
  assert.equal(totals.linesToPrice, 0);
  assert.ok(
    totals.marginPercent !== null &&
      approxEqual(totals.marginPercent, 57.142857, 0.001),
    `marginPercent total attendu ≈57.14, obtenu ${totals.marginPercent}`
  );
});

report('PRICING');

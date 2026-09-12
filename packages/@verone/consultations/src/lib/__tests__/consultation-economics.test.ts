/**
 * Tests unitaires — computeLineEconomics + computeConsultationEconomics
 *
 * Cas de test : plan dev-plan-2026-09-12-BO-CONSULT-P2-001.md § B2
 *
 * Exécution : npx tsx packages/@verone/consultations/src/lib/__tests__/consultation-economics.test.ts
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { strict as assert } from 'node:assert';
import {
  computeLineEconomics,
  computeConsultationEconomics,
} from '../consultation-economics';
import type { ConsultationEconomicsLineInput } from '../consultation-economics';

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
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function approxEqual(a: number, b: number, eps = 0.0001): boolean {
  return Math.abs(a - b) <= eps;
}

// Ligne de base réutilisable
function makeLine(
  overrides: Partial<ConsultationEconomicsLineInput> = {}
): ConsultationEconomicsLineInput {
  return {
    id: 'test-line',
    quantity: 1,
    unitCost: 10,
    ecoTax: 0,
    shippingCost: 0,
    sellingShippingCost: 0,
    proposedPrice: 20,
    isFree: false,
    isSample: false,
    status: 'pending',
    supplierId: null,
    marginPercentage: null,
    ...overrides,
  };
}

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

// ---------------------------------------------------------------------------
// Cas supplémentaires
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

// ---------------------------------------------------------------------------
// Rapport final
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════`);
console.log(
  `Résultats : ${passed} ✅ / ${failed} ❌ (total: ${passed + failed})`
);
console.log(`══════════════════════════════════════\n`);

if (failed > 0) {
  process.exit(1);
}

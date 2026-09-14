/**
 * Tests unitaires — frais par fournisseur (répartition, prix de revient, marge agrégée)
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-P9-001 — 2026-09-13
 */

import { strict as assert } from 'node:assert';
import {
  computeLineEconomics,
  computeConsultationEconomics,
} from '../consultation-economics';
import {
  allocateSupplierCosts,
  type SupplierCostInput,
} from '../consultation-supplier-costs';
import {
  approxEqual,
  makeLine,
  createTestRunner,
} from './consultation-economics.test-utils';

const { test, report } = createTestRunner();

function costs(
  supplierId: string,
  shippingCostHt: number,
  customsCostHt = 0,
  otherCostHt = 0
): SupplierCostInput {
  return { supplierId, shippingCostHt, customsCostHt, otherCostHt };
}

function assertApprox(
  actual: number | null,
  expected: number,
  label: string
): void {
  assert.ok(
    actual !== null && approxEqual(actual, expected),
    `${label} : attendu ${expected}, obtenu ${actual}`
  );
}

// ---------------------------------------------------------------------------
// (p) 2 fournisseurs × 2 lignes
// ---------------------------------------------------------------------------
// sup-a : frais 60 + 30 + 10 = 100 ; a1 valeur 5×10 = 50, a2 valeur 75×2 = 150
//         → parts 25 et 75
// sup-b : frais 40 ; b1 valeur 10×4 = 40, b2 valeur 60×1 = 60 → parts 16 et 24

console.log('\n--- (p) 2 FOURNISSEURS × 2 LIGNES ---');

const twoSuppliersLines = [
  makeLine({
    id: 'a1',
    supplierId: 'sup-a',
    quantity: 10,
    unitCost: 5,
    ecoTax: 0.5,
    shippingCost: 5,
    proposedPrice: null,
  }),
  makeLine({
    id: 'a2',
    supplierId: 'sup-a',
    quantity: 2,
    unitCost: 75,
    proposedPrice: null,
    marginPercentage: 20,
  }),
  makeLine({
    id: 'b1',
    supplierId: 'sup-b',
    quantity: 4,
    unitCost: 10,
    proposedPrice: null,
  }),
  makeLine({
    id: 'b2',
    supplierId: 'sup-b',
    quantity: 1,
    unitCost: 60,
    proposedPrice: 100,
  }),
];

const twoSuppliersSettings = {
  defaultMarginPercentage: 50,
  supplierCosts: [costs('sup-a', 60, 30, 10), costs('sup-b', 40)],
};

test('parts au prorata de la valeur de ligne, sur les seules lignes du fournisseur', () => {
  const { lines, totals } = computeConsultationEconomics(
    twoSuppliersLines,
    twoSuppliersSettings
  );

  assertApprox(lines[0].supplierFees, 25, 'a1');
  assertApprox(lines[1].supplierFees, 75, 'a2');
  assertApprox(lines[2].supplierFees, 16, 'b1');
  assertApprox(lines[3].supplierFees, 24, 'b2');
  assertApprox(totals.supplierFees, 140, 'total parts');
  assert.equal(totals.unallocatedSupplierFees, 0);
});

test('prix de revient = coût + éco-taxe + (part fournisseur + frais de ligne) / quantité', () => {
  const { lines, totals } = computeConsultationEconomics(
    twoSuppliersLines,
    twoSuppliersSettings
  );

  // a1 : 5 + 0,5 + (25 + 5) / 10 = 8,5
  assertApprox(lines[0].unitCostPrice, 8.5, 'a1 revient');
  // a2 : 75 + 75 / 2 = 112,5
  assertApprox(lines[1].unitCostPrice, 112.5, 'a2 revient');
  // b1 : 10 + 16 / 4 = 14 ; b2 : 60 + 24 = 84
  assertApprox(lines[2].unitCostPrice, 14, 'b1 revient');
  assertApprox(lines[3].unitCostPrice, 84, 'b2 revient');
  // coût total = 85 + 225 + 56 + 84 ; frais de ligne seuls = 5
  assertApprox(totals.cost, 450, 'coût total');
  assertApprox(totals.fees, 5, 'frais de ligne');
});

test('prix par défaut = revient × (1 + marge ligne ?? marge projet), prix manuel prioritaire', () => {
  const { lines, totals } = computeConsultationEconomics(
    twoSuppliersLines,
    twoSuppliersSettings
  );

  assertApprox(lines[0].defaultUnitPrice, 12.75, 'a1 (marge projet 50 %)');
  assertApprox(lines[1].defaultUnitPrice, 135, 'a2 (marge ligne 20 %)');
  assertApprox(lines[2].defaultUnitPrice, 21, 'b1 (marge projet 50 %)');
  assertApprox(lines[3].defaultUnitPrice, 126, 'b2 prix par défaut');
  assertApprox(lines[3].unitPrice, 100, 'b2 prix manuel');
  // CA = 127,5 + 270 + 84 + 100
  assertApprox(totals.revenue, 581.5, 'CA total');
});

test('marge agrégée par fournisseur calculée, jamais saisie', () => {
  const { suppliers } = computeConsultationEconomics(
    twoSuppliersLines,
    twoSuppliersSettings
  );

  assert.equal(suppliers.length, 2);
  const [a, b] = suppliers;

  assert.equal(a.supplierId, 'sup-a');
  assertApprox(a.supplierCosts, 100, 'sup-a frais');
  assert.equal(a.optionCount, 2);
  assertApprox(a.proposedTotal, 397.5, 'sup-a ventes');
  assertApprox(a.costPriceTotal, 310, 'sup-a revient');
  assertApprox(a.marginPercent, (87.5 / 310) * 100, 'sup-a marge');

  assert.equal(b.supplierId, 'sup-b');
  assertApprox(b.proposedTotal, 184, 'sup-b ventes');
  assertApprox(b.costPriceTotal, 140, 'sup-b revient');
  assertApprox(b.marginPercent, (44 / 140) * 100, 'sup-b marge');
});

// ---------------------------------------------------------------------------
// (q) Frais à 0
// ---------------------------------------------------------------------------

console.log('\n--- (q) FRAIS FOURNISSEUR À 0 ---');

test('frais à 0 : lignes et totaux identiques au calcul sans frais fournisseur', () => {
  const withZero = computeConsultationEconomics(twoSuppliersLines, {
    defaultMarginPercentage: 50,
    supplierCosts: [costs('sup-a', 0), costs('sup-b', 0)],
  });
  const without = computeConsultationEconomics(twoSuppliersLines, {
    defaultMarginPercentage: 50,
  });

  assert.deepEqual(withZero.lines, without.lines);
  assert.deepEqual(withZero.totals, without.totals);
  assert.equal(withZero.totals.supplierFees, 0);
});

// ---------------------------------------------------------------------------
// (r) Lignes exclues de la répartition
// ---------------------------------------------------------------------------

console.log('\n--- (r) LIGNES EXCLUES DE LA RÉPARTITION ---');

test('ligne refusée exclue de la répartition', () => {
  const lines = [
    makeLine({ id: 'a1', supplierId: 'sup-a', quantity: 10, unitCost: 5 }),
    makeLine({
      id: 'a2',
      supplierId: 'sup-a',
      quantity: 2,
      unitCost: 75,
      status: 'rejected',
    }),
  ];

  const r = computeConsultationEconomics(lines, {
    supplierCosts: [costs('sup-a', 100)],
  });

  assertApprox(r.lines[0].supplierFees, 100, 'a1 porte tous les frais');
  assert.equal(r.lines[1].supplierFees, 0);
  assert.equal(r.lines[1].included, false);
  assertApprox(r.totals.supplierFees, 100, 'total parts');
  assert.equal(r.suppliers[0].optionCount, 1);
});

test('lignes gratuite et échantillon exclues de la répartition', () => {
  const lines = [
    makeLine({ id: 'a1', supplierId: 'sup-a', quantity: 10, unitCost: 5 }),
    makeLine({
      id: 'a2',
      supplierId: 'sup-a',
      quantity: 2,
      unitCost: 75,
      isFree: true,
    }),
    makeLine({
      id: 'a3',
      supplierId: 'sup-a',
      quantity: 1,
      unitCost: 40,
      isSample: true,
    }),
  ];

  const r = computeConsultationEconomics(lines, {
    supplierCosts: [costs('sup-a', 60)],
  });

  assertApprox(r.lines[0].supplierFees, 60, 'a1');
  assert.equal(r.lines[1].supplierFees, 0);
  assert.equal(r.lines[2].supplierFees, 0);
});

test('ligne sans fournisseur : aucune part', () => {
  const lines = [
    makeLine({ id: 'x', supplierId: null, quantity: 2, unitCost: 10 }),
    makeLine({ id: 'a1', supplierId: 'sup-a', quantity: 2, unitCost: 10 }),
  ];

  const r = computeConsultationEconomics(lines, {
    supplierCosts: [costs('sup-a', 20)],
  });

  assert.equal(r.lines[0].supplierFees, 0);
  assertApprox(r.lines[1].supplierFees, 20, 'a1');
});

// ---------------------------------------------------------------------------
// (s) Frais non répartis
// ---------------------------------------------------------------------------

console.log('\n--- (s) FRAIS NON RÉPARTIS ---');

test('lignes toutes refusées : frais non répartis, séparés du coût total', () => {
  const lines = [
    makeLine({
      id: 'a1',
      supplierId: 'sup-a',
      quantity: 2,
      unitCost: 10,
      status: 'rejected',
    }),
    makeLine({ id: 'b1', supplierId: 'sup-b', quantity: 1, unitCost: 30 }),
  ];

  const withCosts = computeConsultationEconomics(lines, {
    supplierCosts: [costs('sup-a', 70)],
  });
  const without = computeConsultationEconomics(lines);

  assert.equal(withCosts.totals.unallocatedSupplierFees, 70);
  assert.equal(withCosts.totals.supplierFees, 0);
  assert.equal(withCosts.totals.cost, without.totals.cost);
  const a = withCosts.suppliers.find(s => s.supplierId === 'sup-a');
  assert.ok(a, 'sup-a doit apparaître dans la synthèse');
  assert.equal(a.supplierCosts, 70);
  assert.equal(a.optionCount, 0);
  assert.equal(a.marginPercent, null);
});

test('aucune base de répartition (quantités à 0, coûts absents) : non réparti, jamais NaN', () => {
  const allocation = allocateSupplierCosts(
    [
      makeLine({ id: 'a1', supplierId: 'sup-a', quantity: 0, unitCost: null }),
      makeLine({ id: 'a2', supplierId: 'sup-a', quantity: 0, unitCost: null }),
    ],
    [costs('sup-a', 40)]
  );

  assert.equal(allocation.unallocated, 40);
  assert.equal(allocation.shares.size, 0);
});

test('fournisseur saisi deux fois : frais additionnés, parts cohérentes avec la synthèse', () => {
  const lines = [
    makeLine({ id: 'a1', supplierId: 'sup-a', quantity: 1, unitCost: 10 }),
    makeLine({ id: 'a2', supplierId: 'sup-a', quantity: 1, unitCost: 30 }),
  ];

  const r = computeConsultationEconomics(lines, {
    supplierCosts: [costs('sup-a', 40), costs('sup-a', 20)],
  });

  assertApprox(r.lines[0].supplierFees, 15, 'a1 (60 × 10/40)');
  assertApprox(r.lines[1].supplierFees, 45, 'a2 (60 × 30/40)');
  assertApprox(r.totals.supplierFees, 60, 'total parts');
  assertApprox(r.suppliers[0].supplierCosts, 60, 'synthèse');
});

// ---------------------------------------------------------------------------
// (t) Cas limites
// ---------------------------------------------------------------------------

console.log('\n--- (t) CAS LIMITES ---');

test('coûts absents : répartition au prorata des quantités', () => {
  const lines = [
    makeLine({ id: 'a1', supplierId: 'sup-a', quantity: 1, unitCost: null }),
    makeLine({ id: 'a2', supplierId: 'sup-a', quantity: 3, unitCost: null }),
  ];

  const r = computeConsultationEconomics(lines, {
    supplierCosts: [costs('sup-a', 40)],
  });

  assertApprox(r.lines[0].supplierFees, 10, 'a1');
  assertApprox(r.lines[1].supplierFees, 30, 'a2');
});

test('computeLineEconomics : part fournisseur passée en paramètre', () => {
  const line = makeLine({
    quantity: 10,
    unitCost: 5,
    ecoTax: 0.5,
    shippingCost: 5,
    proposedPrice: null,
  });

  const r = computeLineEconomics(line, { defaultMarginPercentage: 50 }, 25);

  assertApprox(r.unitCostPrice, 8.5, 'revient');
  assertApprox(r.cost, 85, 'coût');
  assertApprox(r.defaultUnitPrice, 12.75, 'prix par défaut');
});

report('SUPPLIER COSTS');

/**
 * Tests unitaires — computeFinancialTotals
 *
 * 35+ cas couvrant la formule round-per-line, tous les taux TVA FR,
 * remises, écotaxes, frais, cas limites et erreurs.
 *
 * Exécution : npx tsx packages/@verone/finance/src/lib/finance-totals/__tests__/compute.test.ts
 *
 * Sprint BO-FIN-046 — 2026-05-06
 */

import { strict as assert } from 'node:assert';
import { computeFinancialTotals, FORMULA_VERSION } from '../index';
import type { FinancialItem, FinancialFees } from '../index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ZERO_FEES: FinancialFees = {
  shipping_cost_ht: 0,
  handling_cost_ht: 0,
  insurance_cost_ht: 0,
  fees_vat_rate: 0.2,
};

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

function approxEqual(a: number, b: number, eps = 0.001): boolean {
  return Math.abs(a - b) <= eps;
}

// ---------------------------------------------------------------------------
// Cas simples
// ---------------------------------------------------------------------------

console.log('\n--- CAS SIMPLES ---');

test('1 item × TVA 20%, 0 frais', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100, `totalHt devrait être 100, obtenu ${r.totalHt}`);
  assert.equal(
    r.totalTtc,
    120,
    `totalTtc devrait être 120, obtenu ${r.totalTtc}`
  );
  assert.equal(
    r.totalVat,
    20,
    `totalVat devrait être 20, obtenu ${r.totalVat}`
  );
  assert.equal(r.formulaVersion, FORMULA_VERSION);
});

test('1 item × TVA 0% (exonération LinkMe)', () => {
  const items: FinancialItem[] = [
    { quantity: 2, unit_price_ht: 50, tax_rate: 0 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100);
  assert.equal(r.totalTtc, 100);
  assert.equal(r.totalVat, 0);
});

test('1 item × TVA 5,5%', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.055 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100);
  assert.equal(r.totalTtc, 105.5);
  assert.equal(r.totalVat, 5.5);
});

test('1 item × TVA 10%', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 200, tax_rate: 0.1 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 200);
  assert.equal(r.totalTtc, 220);
  assert.equal(r.totalVat, 20);
});

test('1 item × TVA 2,1% (presse)', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.021 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100);
  assert.equal(r.totalTtc, 102.1);
});

// ---------------------------------------------------------------------------
// Multi-taux TVA
// ---------------------------------------------------------------------------

console.log('\n--- MULTI-TAUX TVA ---');

test('3 items à 20% / 10% / 5.5%', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.1 },
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.055 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 300);
  // 120 + 110 + 105.5 = 335.5
  assert.equal(
    r.totalTtc,
    335.5,
    `totalTtc attendu 335.5, obtenu ${r.totalTtc}`
  );
  assert.equal(r.totalVat, 35.5);
  // vatByRate doit avoir 3 entrées
  assert.equal(Object.keys(r.vatByRate).length, 3);
});

test('vatByRate contient les bons taux (clés décimales)', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 1000, tax_rate: 0.2 },
    { quantity: 1, unit_price_ht: 500, tax_rate: 0.1 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.ok('0.200' in r.vatByRate, 'doit avoir taux 0.200');
  assert.ok('0.100' in r.vatByRate, 'doit avoir taux 0.100');
  assert.equal(r.vatByRate['0.200'], 200);
  assert.equal(r.vatByRate['0.100'], 50);
});

// ---------------------------------------------------------------------------
// Remises
// ---------------------------------------------------------------------------

console.log('\n--- REMISES ---');

test('1 item avec remise 10%', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2, discount_percentage: 10 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  // lineHt = 100 × 0.9 = 90 ; lineTtc = 90 × 1.2 = 108
  assert.equal(r.totalHt, 90);
  assert.equal(r.totalTtc, 108);
  assert.equal(r.totalVat, 18);
});

test('item avec remise 100% (gratuit)', () => {
  const items: FinancialItem[] = [
    {
      quantity: 1,
      unit_price_ht: 100,
      tax_rate: 0.2,
      discount_percentage: 100,
    },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 0);
  assert.equal(r.totalTtc, 0);
  assert.equal(r.totalVat, 0);
});

// ---------------------------------------------------------------------------
// Écotaxe
// ---------------------------------------------------------------------------

console.log('\n--- ÉCOTAXE ---');

test('1 item avec écotaxe', () => {
  const items: FinancialItem[] = [
    { quantity: 2, unit_price_ht: 100, tax_rate: 0.2, eco_tax: 1.5 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  // lineHt = (2*100 + 2*1.5) = 203 ; lineTtc = 203 * 1.2 = 243.6
  assert.equal(r.totalHt, 203);
  assert.equal(
    r.totalTtc,
    243.6,
    `totalTtc attendu 243.6, obtenu ${r.totalTtc}`
  );
});

// ---------------------------------------------------------------------------
// Frais
// ---------------------------------------------------------------------------

console.log('\n--- FRAIS ---');

test('avec frais livraison seulement', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 10,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0.2,
  };
  const r = computeFinancialTotals(items, fees);
  assert.equal(r.itemsHt, 100);
  assert.equal(r.feesHt, 10);
  assert.equal(r.totalHt, 110);
  // 120 (items) + 12 (frais) = 132
  assert.equal(r.totalTtc, 132);
});

test('avec les 3 types de frais', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 10,
    handling_cost_ht: 5,
    insurance_cost_ht: 3,
    fees_vat_rate: 0.2,
  };
  const r = computeFinancialTotals(items, fees);
  assert.equal(r.feesHt, 18);
  assert.equal(r.totalHt, 118);
  // items TTC: 120 ; frais TTC: 10*1.2 + 5*1.2 + 3*1.2 = 12 + 6 + 3.6 = 21.6
  assert.equal(r.totalTtc, 141.6, `attendu 141.6, obtenu ${r.totalTtc}`);
});

test('frais avec TVA différente des items (items 20%, frais 10%)', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 10,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0.1,
  };
  const r = computeFinancialTotals(items, fees);
  // items TTC: 120 ; frais TTC: 10*1.1 = 11
  assert.equal(r.totalTtc, 131, `attendu 131, obtenu ${r.totalTtc}`);
  // vatByRate doit avoir 2 entrées
  assert.equal(Object.keys(r.vatByRate).length, 2);
});

test('frais à 0 mais fees_vat_rate 20% : pas de TVA fantôme', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 0,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0.2,
  };
  const r = computeFinancialTotals(items, fees);
  // 1 seul taux dans vatByRate (les frais à 0 n'ajoutent rien)
  assert.equal(Object.keys(r.vatByRate).length, 1);
  assert.equal(r.feesHt, 0);
});

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------

console.log('\n--- CAS LIMITES ---');

test('montants à virgule complexe (83.33€, vérif round-per-line)', () => {
  const items: FinancialItem[] = [
    { quantity: 3, unit_price_ht: 83.33, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  // lineHt = ROUND(3*83.33, 2) = 249.99
  // lineTtc = ROUND(3*83.33*1.2, 2) = ROUND(299.988, 2) = 299.99
  assert.equal(
    r.totalHt,
    249.99,
    `totalHt attendu 249.99, obtenu ${r.totalHt}`
  );
  assert.equal(
    r.totalTtc,
    299.99,
    `totalTtc attendu 299.99, obtenu ${r.totalTtc}`
  );
});

test('montant 1234.56€ × TVA 20%', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 1234.56, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 1234.56);
  assert.equal(r.totalTtc, 1481.47, `attendu 1481.47, obtenu ${r.totalTtc}`);
});

test('item à tax_rate = 0 ne plante pas', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalVat, 0);
  assert.equal(r.totalTtc, 100);
});

test('0 items (devis vide) : retourne tous zéros', () => {
  const r = computeFinancialTotals([], ZERO_FEES);
  assert.equal(r.totalHt, 0);
  assert.equal(r.totalTtc, 0);
  assert.equal(r.totalVat, 0);
  assert.equal(r.itemsHt, 0);
  assert.equal(r.feesHt, 0);
});

test('0 frais : ne plante pas', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 0,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0,
  };
  const r = computeFinancialTotals(items, fees);
  assert.equal(r.feesHt, 0);
  assert.equal(r.totalTtc, 120);
});

test('quantité 0 : item ignoré', () => {
  const items: FinancialItem[] = [
    { quantity: 0, unit_price_ht: 100, tax_rate: 0.2 },
    { quantity: 2, unit_price_ht: 50, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100); // seul l'item qty=2 est compté
  assert.equal(r.totalTtc, 120);
});

test('DOM-TOM : tax_rate = 0.085 (8,5% Corse/DOM)', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.085 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100);
  assert.equal(r.totalTtc, 108.5, `attendu 108.5, obtenu ${r.totalTtc}`);
});

test('multi-items mêmes taux : totalVat = somme des TVAs par ligne', () => {
  // Vérifie que round-per-line ≠ round-sur-total-global
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 10.03, tax_rate: 0.2 },
    { quantity: 1, unit_price_ht: 10.03, tax_rate: 0.2 },
    { quantity: 1, unit_price_ht: 10.03, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  // Chaque ligne : 10.03 * 1.2 = 12.036 → arrondi à 12.04
  // Total TTC = 12.04 * 3 = 36.12
  assert.equal(r.totalTtc, 36.12, `attendu 36.12, obtenu ${r.totalTtc}`);
});

// ---------------------------------------------------------------------------
// Cas erreur
// ---------------------------------------------------------------------------

console.log('\n--- CAS ERREUR ---');

test('tax_rate null → Error en mode strict', () => {
  const items: FinancialItem[] = [
    {
      quantity: 1,
      unit_price_ht: 100,
      tax_rate: null,
      description: 'Article test',
    },
  ];
  let threw = false;
  try {
    computeFinancialTotals(items, ZERO_FEES);
  } catch (e) {
    threw = true;
    assert.ok(
      e instanceof Error && e.message.includes('tax_rate manquant'),
      `Message doit mentionner "tax_rate manquant", reçu: ${e instanceof Error ? e.message : e}`
    );
  }
  assert.ok(threw, 'Devrait avoir lancé une Error');
});

test('tax_rate undefined → Error en mode strict', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: undefined },
  ];
  let threw = false;
  try {
    computeFinancialTotals(items, ZERO_FEES);
  } catch (_) {
    threw = true;
  }
  assert.ok(threw, 'Devrait avoir lancé une Error');
});

test('tax_rate null avec strict: false → fallback 0 (mode permissif)', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: null },
  ];
  let threw = false;
  let result;
  try {
    result = computeFinancialTotals(items, ZERO_FEES, { strict: false });
  } catch (_) {
    threw = true;
  }
  assert.ok(!threw, 'Ne doit PAS lancer avec strict: false');
  assert.equal(result?.totalVat, 0, 'TVA doit être 0 avec taux par défaut 0');
  assert.equal(result?.totalTtc, 100);
});

test('montants négatifs → Error', () => {
  const items: FinancialItem[] = [
    { quantity: -1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  let threw = false;
  try {
    computeFinancialTotals(items, ZERO_FEES);
  } catch (_) {
    threw = true;
  }
  assert.ok(threw, 'Devrait rejeter les montants négatifs');
});

test('items non-entiers : quantity décimale (prestation au prorata)', () => {
  const items: FinancialItem[] = [
    { quantity: 0.5, unit_price_ht: 200, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 100);
  assert.equal(r.totalTtc, 120);
});

test('plusieurs frais sans items : feesHt correct', () => {
  const fees: FinancialFees = {
    shipping_cost_ht: 15,
    handling_cost_ht: 8,
    insurance_cost_ht: 2,
    fees_vat_rate: 0.2,
  };
  const r = computeFinancialTotals([], fees);
  assert.equal(r.feesHt, 25);
  assert.equal(r.itemsHt, 0);
  assert.equal(r.totalHt, 25);
  assert.equal(r.totalTtc, 30, `attendu 30, obtenu ${r.totalTtc}`);
});

test('grand volume : 100 items TVA 20% (performance et précision)', () => {
  const items: FinancialItem[] = Array.from({ length: 100 }, () => ({
    quantity: 1,
    unit_price_ht: 10,
    tax_rate: 0.2,
  }));
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.totalHt, 1000);
  assert.equal(r.totalTtc, 1200);
  assert.equal(r.totalVat, 200);
});

// ---------------------------------------------------------------------------
// formulaVersion
// ---------------------------------------------------------------------------

console.log('\n--- FORMULA VERSION ---');

test('formulaVersion est toujours "round-per-line-v1"', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 100, tax_rate: 0.2 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  assert.equal(r.formulaVersion, 'round-per-line-v1');
});

// ---------------------------------------------------------------------------
// Snapshots réels Vérone (anonymisés)
// ---------------------------------------------------------------------------

console.log('\n--- SNAPSHOTS RÉELS VÉRONE ---');

test('Snapshot 1 : commande simple 2 articles TVA 20%', () => {
  const items: FinancialItem[] = [
    { quantity: 1, unit_price_ht: 450, tax_rate: 0.2, description: 'Canapé A' },
    { quantity: 2, unit_price_ht: 125, tax_rate: 0.2, description: 'Table B' },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 50,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0.2,
  };
  const r = computeFinancialTotals(items, fees);
  // itemsHt = 450 + 250 = 700 ; feesHt = 50 ; totalHt = 750
  // itemsTtc = 540 + 300 = 840 ; feesTtc = 60 ; totalTtc = 900
  assert.equal(r.totalHt, 750);
  assert.equal(r.totalTtc, 900);
});

test('Snapshot 2 : commande avec remise 15% et frais 3 types', () => {
  const items: FinancialItem[] = [
    { quantity: 3, unit_price_ht: 200, tax_rate: 0.2, discount_percentage: 15 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 20,
    handling_cost_ht: 10,
    insurance_cost_ht: 5,
    fees_vat_rate: 0.2,
  };
  const r = computeFinancialTotals(items, fees);
  // lineHt = ROUND(3*200*0.85, 2) = 510 ; lineTtc = ROUND(510*1.2, 2) = 612
  // feesHt = 35 ; feesTtc = 35*1.2 = 42
  assert.equal(r.itemsHt, 510);
  assert.equal(r.feesHt, 35);
  assert.equal(r.totalHt, 545);
  assert.equal(r.totalTtc, 654, `attendu 654, obtenu ${r.totalTtc}`);
});

test('Snapshot 3 : commande multi-taux (mobilier + services)', () => {
  const items: FinancialItem[] = [
    {
      quantity: 1,
      unit_price_ht: 1200,
      tax_rate: 0.2,
      description: 'Fauteuil',
    },
    {
      quantity: 1,
      unit_price_ht: 300,
      tax_rate: 0.1,
      description: 'Livraison spéciale',
    },
    { quantity: 1, unit_price_ht: 80, tax_rate: 0.055, description: 'Textile' },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  // 1440 + 330 + 84.4 = 1854.4
  assert.ok(
    approxEqual(r.totalTtc, 1854.4),
    `attendu ~1854.4, obtenu ${r.totalTtc}`
  );
});

test('Snapshot 4 : commande avec écotaxe produit', () => {
  const items: FinancialItem[] = [
    { quantity: 4, unit_price_ht: 80, tax_rate: 0.2, eco_tax: 0.5 },
  ];
  const r = computeFinancialTotals(items, ZERO_FEES);
  // lineHt = ROUND(4*80 + 4*0.5, 2) = ROUND(322, 2) = 322
  // lineTtc = ROUND(322 * 1.2, 2) = 386.4
  assert.equal(r.totalHt, 322);
  assert.equal(r.totalTtc, 386.4, `attendu 386.4, obtenu ${r.totalTtc}`);
});

test('Snapshot 5 : commande à zéro TVA (B2B autoliquidation)', () => {
  const items: FinancialItem[] = [
    { quantity: 2, unit_price_ht: 500, tax_rate: 0 },
    { quantity: 1, unit_price_ht: 200, tax_rate: 0 },
  ];
  const fees: FinancialFees = {
    shipping_cost_ht: 30,
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0,
  };
  const r = computeFinancialTotals(items, fees);
  assert.equal(r.totalHt, 1230);
  assert.equal(r.totalTtc, 1230); // TVA 0
  assert.equal(r.totalVat, 0);
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

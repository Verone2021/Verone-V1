/**
 * Tests unitaires — billedAmount, purchaseAmount, salesAmount
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
// billedAmount — décision 5 BO-CONSULT-P2-001
// ---------------------------------------------------------------------------

console.log('\n--- billedAmount (décision 5) ---');

test('échantillon non gratuit : billedAmount = unitPrice × quantity', () => {
  const line = makeLine({
    isSample: true,
    isFree: false,
    proposedPrice: 5,
    quantity: 2,
  });
  const r = computeLineEconomics(line);
  assert.equal(
    r.billedAmount,
    10,
    `billedAmount attendu 10, obtenu ${r.billedAmount}`
  );
});

test('gratuit (isFree) : billedAmount = 0', () => {
  const line = makeLine({ isFree: true, proposedPrice: 20 });
  const r = computeLineEconomics(line);
  assert.equal(r.billedAmount, 0, `billedAmount doit être 0 pour isFree`);
});

test('prix à fixer (unitPrice null) : billedAmount = 0', () => {
  const line = makeLine({ proposedPrice: null, marginPercentage: null });
  const r = computeLineEconomics(line, { defaultMarginPercentage: null });
  assert.equal(r.unitPrice, null);
  assert.equal(r.billedAmount, 0, `billedAmount doit être 0 si unitPrice null`);
});

test('refusée exclue de totals.billed', () => {
  const lines = [
    makeLine({ id: 'rej', status: 'rejected', proposedPrice: 20, quantity: 5 }),
    makeLine({ id: 'ok', proposedPrice: 15, quantity: 2 }),
  ];
  const { totals } = computeConsultationEconomics(lines);
  // Seule la ligne ok compte : 15 × 2 = 30
  assert.equal(
    totals.billed,
    30,
    `totals.billed = 30, obtenu ${totals.billed}`
  );
});

test('c9b18dc9 : billedAmount = 495 (facturé = revenue sans sellingShipping)', () => {
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
  assert.equal(
    r.billedAmount,
    495,
    `billedAmount attendu 495, obtenu ${r.billedAmount}`
  );
});

test('25fd2694 : billedAmount = 15', () => {
  const line = makeLine({
    id: '25fd2694-line',
    quantity: 1,
    unitCost: 5,
    shippingCost: 2,
    proposedPrice: 15,
  });
  const r = computeLineEconomics(line);
  assert.equal(
    r.billedAmount,
    15,
    `billedAmount attendu 15, obtenu ${r.billedAmount}`
  );
});

// ---------------------------------------------------------------------------
// purchaseAmount et salesAmount — sous-totaux affichés
// ---------------------------------------------------------------------------

console.log('\n--- purchaseAmount / salesAmount ---');

test('purchaseAmount = unitCost × quantity (ligne nominale)', () => {
  const line = makeLine({ quantity: 3, unitCost: 10, proposedPrice: 20 });
  const r = computeLineEconomics(line);
  assert.equal(
    r.purchaseAmount,
    30,
    `purchaseAmount attendu 30, obtenu ${r.purchaseAmount}`
  );
});

test('purchaseAmount avec unitCost null → 0 × quantity = 0', () => {
  const line = makeLine({ quantity: 5, unitCost: null, proposedPrice: 20 });
  const r = computeLineEconomics(line);
  assert.equal(
    r.purchaseAmount,
    0,
    `purchaseAmount attendu 0 si unitCost null, obtenu ${r.purchaseAmount}`
  );
});

test('salesAmount = unitPrice × quantity (ligne nominale)', () => {
  const line = makeLine({ quantity: 4, unitCost: 5, proposedPrice: 12 });
  const r = computeLineEconomics(line);
  assert.equal(
    r.salesAmount,
    48,
    `salesAmount attendu 48, obtenu ${r.salesAmount}`
  );
});

test('salesAmount = null si prix à fixer (unitPrice null)', () => {
  const line = makeLine({ proposedPrice: null, marginPercentage: null });
  const r = computeLineEconomics(line, { defaultMarginPercentage: null });
  assert.equal(r.unitPrice, null, 'unitPrice doit être null');
  assert.equal(
    r.salesAmount,
    null,
    `salesAmount doit être null si unitPrice null, obtenu ${r.salesAmount}`
  );
});

test('purchaseAmount c9b18dc9 = 5 × 30 = 150 (unitCost seul, sans transport)', () => {
  const line = makeLine({
    quantity: 30,
    unitCost: 5,
    shippingCost: 165,
    proposedPrice: 16.5,
  });
  const r = computeLineEconomics(line);
  assert.equal(
    r.purchaseAmount,
    150,
    `purchaseAmount attendu 150, obtenu ${r.purchaseAmount}`
  );
});

test('salesAmount c9b18dc9 = 16.5 × 30 = 495', () => {
  const line = makeLine({
    quantity: 30,
    unitCost: 5,
    shippingCost: 165,
    proposedPrice: 16.5,
  });
  const r = computeLineEconomics(line);
  assert.equal(
    r.salesAmount,
    495,
    `salesAmount attendu 495, obtenu ${r.salesAmount}`
  );
});

report('AMOUNTS');

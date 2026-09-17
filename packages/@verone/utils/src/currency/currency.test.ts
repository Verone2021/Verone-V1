/**
 * Tests unitaires — utilitaires de conversion monétaire
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-CURRENCY-001 — 2026-09-17
 */

import { strict as assert } from 'node:assert';

import {
  convertToEur,
  defaultRateFor,
  SUPPORTED_PURCHASE_CURRENCIES,
  USD_TO_EUR_DEFAULT,
} from './index';

// ---------------------------------------------------------------------------
// Harness minimal (même pattern que consultation-economics.test-utils.ts)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    process.stdout.write(`  ✅ ${name}\n`);
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
// Constantes
// ---------------------------------------------------------------------------

console.log('\n--- CONSTANTES ---');

test('USD_TO_EUR_DEFAULT est 0.87', () => {
  assert.equal(USD_TO_EUR_DEFAULT, 0.87);
});

test('SUPPORTED_PURCHASE_CURRENCIES contient EUR et USD', () => {
  assert.ok(SUPPORTED_PURCHASE_CURRENCIES.includes('EUR'));
  assert.ok(SUPPORTED_PURCHASE_CURRENCIES.includes('USD'));
  assert.equal(SUPPORTED_PURCHASE_CURRENCIES.length, 2);
});

// ---------------------------------------------------------------------------
// convertToEur
// ---------------------------------------------------------------------------

console.log('\n--- convertToEur ---');

test('EUR → inchangé, identité exacte', () => {
  assert.equal(convertToEur(100, 'EUR', 1), 100);
  assert.equal(convertToEur(250.5, 'EUR', 0.87), 250.5);
});

test('USD à taux 0.87 → arrondi au centime', () => {
  // 100 × 0.87 = 87.00
  assert.equal(convertToEur(100, 'USD', 0.87), 87.0);
  // 10 × 0.87 = 8.70
  assert.ok(
    approxEqual(convertToEur(10, 'USD', 0.87), 8.7),
    `got ${convertToEur(10, 'USD', 0.87)}`
  );
});

test('USD arrondi au centime — pas de décimale parasite', () => {
  // 1 × 0.87 = 0.87 (exact)
  assert.equal(convertToEur(1, 'USD', 0.87), 0.87);
  // 3 × 0.87 = 2.61
  assert.equal(convertToEur(3, 'USD', 0.87), 2.61);
  // 7 × 0.87 = 6.09
  assert.equal(convertToEur(7, 'USD', 0.87), 6.09);
});

test('taux invalide (0) → montant inchangé (safe fallback)', () => {
  assert.equal(convertToEur(100, 'USD', 0), 100);
});

test('taux négatif → montant inchangé (safe fallback)', () => {
  assert.equal(convertToEur(100, 'USD', -0.5), 100);
});

test('taux NaN → montant inchangé (safe fallback)', () => {
  assert.equal(convertToEur(100, 'USD', NaN), 100);
});

test('monnaie inconnue avec taux valide → convertit quand même', () => {
  // La fonction ne filtre pas les monnaies inconnues : rate valide = conversion
  assert.equal(convertToEur(100, 'GBP', 0.85), 85);
});

test('montant 0 → reste 0 quelle que soit la monnaie', () => {
  assert.equal(convertToEur(0, 'USD', 0.87), 0);
  assert.equal(convertToEur(0, 'EUR', 1), 0);
});

// ---------------------------------------------------------------------------
// defaultRateFor
// ---------------------------------------------------------------------------

console.log('\n--- defaultRateFor ---');

test('EUR → taux 1', () => {
  assert.equal(defaultRateFor('EUR'), 1);
});

test('USD → USD_TO_EUR_DEFAULT', () => {
  assert.equal(defaultRateFor('USD'), USD_TO_EUR_DEFAULT);
});

test('monnaie inconnue → taux 1 (safe fallback)', () => {
  assert.equal(defaultRateFor('GBP'), 1);
  assert.equal(defaultRateFor(''), 1);
});

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

console.log('\n══════════════════════════════════════');
console.log(
  `currency.test — ${passed} ✅ / ${failed} ❌ (total: ${passed + failed})`
);
console.log('══════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}

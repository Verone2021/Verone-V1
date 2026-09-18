/**
 * Tests unitaires — fermeture provisoire du site public
 *
 * Verrouille trois choses qui, si elles cassaient, coûteraient cher :
 *   1. seule la valeur exacte '1' ferme le site (pas 'true', pas '0') ;
 *   2. le webhook de paiement et les tâches planifiées restent joignables ;
 *   3. la page d'attente répond bien en 503 avec `Retry-After` — c'est ce qui
 *      empêche Google de désindexer le site pendant la fermeture.
 *
 * Exécution :
 *   npx tsx apps/site-internet/src/lib/__tests__/maintenance.test.ts
 *
 * Sprint SI-MAINT-001 — 2026-09-18
 */

import { strict as assert } from 'node:assert';

import {
  isMaintenanceExempt,
  isMaintenanceMode,
  maintenanceResponse,
} from '../maintenance';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      throw new Error('Les tests de ce fichier doivent rester synchrones');
    }
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(`       ${String(error)}`);
  }
}

console.log('Interrupteur de fermeture');

test('absente, la variable laisse le site ouvert', () => {
  delete process.env.SITE_MAINTENANCE;
  assert.equal(isMaintenanceMode(), false);
});

test("'0' laisse le site ouvert", () => {
  process.env.SITE_MAINTENANCE = '0';
  assert.equal(isMaintenanceMode(), false);
});

test("'true' laisse le site ouvert — seule la valeur '1' ferme", () => {
  process.env.SITE_MAINTENANCE = 'true';
  assert.equal(isMaintenanceMode(), false);
});

test("'1' ferme le site", () => {
  process.env.SITE_MAINTENANCE = '1';
  assert.equal(isMaintenanceMode(), true);
});

console.log('Chemins qui doivent continuer de répondre');

test('le webhook de paiement Stripe reste joignable', () => {
  assert.equal(isMaintenanceExempt('/api/webhooks/stripe'), true);
});

test('les tâches planifiées restent joignables', () => {
  assert.equal(isMaintenanceExempt('/api/cron/abandoned-cart-check'), true);
});

console.log('Chemins qui doivent être fermés');

for (const path of [
  '/',
  '/produits/lampe-boule-gm-naturelle',
  '/api/checkout',
  '/api/contact',
  '/api/feeds/products.xml',
]) {
  test(`${path} est fermé`, () => {
    assert.equal(isMaintenanceExempt(path), false);
  });
}

console.log("Page d'attente");

const response = maintenanceResponse();

test('répond 503 (indisponibilité temporaire, pas une page normale)', () => {
  assert.equal(response.status, 503);
});

test('porte un Retry-After — Google conserve alors l’indexation', () => {
  assert.equal(response.headers.get('retry-after'), '3600');
});

test("n'est jamais mise en cache", () => {
  assert.ok((response.headers.get('cache-control') ?? '').includes('no-store'));
});

console.log(`\n${passed} réussis, ${failed} échoués`);
if (failed > 0) process.exit(1);

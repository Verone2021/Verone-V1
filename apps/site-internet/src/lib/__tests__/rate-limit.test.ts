/**
 * Tests unitaires — limitation du formulaire de contact public
 *
 * Exécution :
 *   npx tsx apps/site-internet/src/lib/__tests__/rate-limit.test.ts
 *
 * Sprint SI-CHECKOUT-PRICE-001 — 2026-09-19
 */

import { strict as assert } from 'node:assert';

import { clientIpFromHeaders, createRateLimiter } from '../rate-limit';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(`       ${String(error)}`);
  }
}

console.log('Limitation de débit');

test('les premières tentatives passent, la suivante est refusée', () => {
  const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
  const t0 = 1_000_000;
  assert.equal(limiter.check('1.2.3.4', t0).allowed, true);
  assert.equal(limiter.check('1.2.3.4', t0 + 100).allowed, true);
  assert.equal(limiter.check('1.2.3.4', t0 + 200).allowed, true);
  assert.equal(limiter.check('1.2.3.4', t0 + 300).allowed, false);
});

test('une adresse bloquée ne bloque pas les autres', () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
  const t0 = 1_000_000;
  assert.equal(limiter.check('1.2.3.4', t0).allowed, true);
  assert.equal(limiter.check('1.2.3.4', t0 + 1).allowed, false);
  assert.equal(limiter.check('5.6.7.8', t0 + 2).allowed, true);
});

test('la fenêtre glisse : après expiration, on repasse', () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1_000 });
  const t0 = 1_000_000;
  limiter.check('1.2.3.4', t0);
  limiter.check('1.2.3.4', t0 + 10);
  assert.equal(limiter.check('1.2.3.4', t0 + 20).allowed, false);
  assert.equal(limiter.check('1.2.3.4', t0 + 1_500).allowed, true);
});

test('le délai annoncé au visiteur est au moins d’une seconde', () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
  const t0 = 1_000_000;
  limiter.check('1.2.3.4', t0);
  const refus = limiter.check('1.2.3.4', t0 + 59_999);
  assert.equal(refus.allowed, false);
  assert.ok(refus.retryAfterSeconds >= 1);
});

test('l’adresse du visiteur est la première de la chaîne de relais', () => {
  const headers = new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' });
  assert.equal(clientIpFromHeaders(headers), '9.9.9.9');
});

test('sans en-tête connu, la clé est explicite plutôt que vide', () => {
  assert.equal(clientIpFromHeaders(new Headers()), 'inconnue');
});

console.log(`\n${passed} réussis, ${failed} échoués`);
if (failed > 0) process.exit(1);

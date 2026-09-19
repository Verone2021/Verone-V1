/**
 * Tests unitaires — la garde des appels machine ne se désactive jamais seule
 *
 * Règle verrouillée ici : **variable absente = la route refuse**. C'est le
 * défaut qui laissait passer n'importe qui sur deux tâches planifiées avant
 * BO-SEC-MW-001 (`if (cronSecret) { … }` : pas de secret, pas de contrôle).
 *
 * Exécution :
 *   npx tsx apps/back-office/src/lib/__tests__/require-cron-secret.test.ts
 *
 * Sprint BO-SEC-MW-001 — 2026-09-19
 */

import { strict as assert } from 'node:assert';

import type { NextRequest } from 'next/server';

import {
  cronAuthHeader,
  isCronCall,
  requireCronSecret,
} from '../guards/require-cron-secret';

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

/** Requête minimale : la garde ne lit que l'en-tête `authorization`. */
function requete(authorization?: string): NextRequest {
  return {
    headers: new Headers(authorization ? { authorization } : {}),
  } as NextRequest;
}

console.log('Garde des appels machine');

test('sans secret configuré, un appel non signé est refusé', () => {
  delete process.env.CRON_SECRET;
  assert.equal(isCronCall(requete()), false);
});

test('sans secret configuré, même un en-tête est refusé', () => {
  delete process.env.CRON_SECRET;
  assert.equal(isCronCall(requete('Bearer nimportequoi')), false);
});

test('sans secret configuré, la garde stricte renvoie 503 (jamais un passage)', () => {
  delete process.env.CRON_SECRET;
  const reponse = requireCronSecret(requete('Bearer nimportequoi'));
  assert.ok(reponse !== null, 'la garde doit refuser');
  assert.equal(reponse.status, 503);
});

test('avec secret configuré, le bon en-tête passe', () => {
  process.env.CRON_SECRET = 'secret-de-test';
  assert.equal(isCronCall(requete('Bearer secret-de-test')), true);
  assert.equal(requireCronSecret(requete('Bearer secret-de-test')), null);
});

test('avec secret configuré, un mauvais en-tête est refusé en 401', () => {
  process.env.CRON_SECRET = 'secret-de-test';
  const reponse = requireCronSecret(requete('Bearer mauvais'));
  assert.ok(reponse !== null);
  assert.equal(reponse.status, 401);
});

test('avec secret configuré, aucun en-tête est refusé en 401', () => {
  process.env.CRON_SECRET = 'secret-de-test';
  const reponse = requireCronSecret(requete());
  assert.ok(reponse !== null);
  assert.equal(reponse.status, 401);
});

test("l'en-tête d'appel interne porte bien le secret", () => {
  process.env.CRON_SECRET = 'secret-de-test';
  assert.deepEqual(cronAuthHeader(), {
    Authorization: 'Bearer secret-de-test',
  });
});

test("sans secret, l'en-tête d'appel interne est vide plutôt que faux", () => {
  delete process.env.CRON_SECRET;
  assert.deepEqual(cronAuthHeader(), {});
});

console.log(`\n${passed} réussis, ${failed} échoués`);
if (failed > 0) process.exit(1);

/**
 * Tests unitaires — le verrou général des routes API du back-office
 *
 * Ce test est le vrai livrable du sprint : il parcourt les fichiers de routes
 * RÉELS du dépôt et vérifie que l'ensemble des portes joignables sans session
 * est exactement la liste blanche justifiée. Le jour où quelqu'un ajoute une
 * route, elle est fermée par défaut ; s'il l'ouvre, ce test le lui fait dire.
 *
 * Exécution :
 *   npx tsx apps/back-office/src/lib/__tests__/public-api-routes.test.ts
 *
 * Sprint BO-SEC-MW-001 — 2026-09-19
 */

import { strict as assert } from 'node:assert';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  PUBLIC_API_ROUTES,
  isPublicApiRoute,
} from '../security/public-api-routes';

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

/** Les chemins `/api/...` réellement servis, lus sur le disque. */
function listApiRoutes(): string[] {
  const root = join(process.cwd(), 'apps/back-office/src/app/api');
  const routes: string[] = [];

  function walk(dir: string, prefix: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}/${entry}`);
      } else if (entry === 'route.ts') {
        routes.push(`/api${prefix}`);
      }
    }
  }

  walk(root, '');
  return routes.sort();
}

/** Ce qui doit rester joignable sans session — et rien d'autre. */
const OUVERTES_ATTENDUES = [
  '/api/cron/google-merchant-poll',
  '/api/cron/meta-commerce-sync',
  '/api/cron/sync-comptabilite',
  '/api/csp-report',
  '/api/emails/linkme-info-completed',
  '/api/gmail/inbound',
  '/api/gmail/watch/refresh',
  '/api/health',
  '/api/webhooks/packlink',
];

console.log('Verrou general des routes API');

test('les routes du dépôt sont bien lues', () => {
  const routes = listApiRoutes();
  assert.ok(
    routes.length > 100,
    `attendu plus de 100 routes, trouvé ${routes.length}`
  );
  assert.ok(routes.includes('/api/qonto/invoices'));
});

test('les portes ouvertes sont EXACTEMENT celles justifiées', () => {
  const ouvertes = listApiRoutes().filter(isPublicApiRoute).sort();
  assert.deepEqual(
    ouvertes,
    OUVERTES_ATTENDUES,
    'une route a été ouverte ou fermée sans mettre ce test à jour'
  );
});

test('les routes financières sont fermées', () => {
  for (const route of [
    '/api/qonto/invoices',
    '/api/qonto/invoices/abc/cancel',
    '/api/qonto/invoices/abc/delete',
    '/api/qonto/invoices/abc/sync-to-order',
    '/api/qonto/sync-invoices',
    '/api/qonto/quotes',
    '/api/qonto/quotes/service',
    '/api/qonto/quotes/abc/convert',
    '/api/qonto/quotes/from-invoice/abc',
    '/api/quotes/abc/finalize',
    '/api/quotes/abc/link-qonto',
    '/api/quotes/abc/push-to-qonto',
    '/api/qonto/sync',
    '/api/packlink/shipments/sync',
    '/api/sales-orders/abc/customer-address',
  ]) {
    assert.equal(
      isPublicApiRoute(route),
      false,
      `${route} ne doit pas être ouverte`
    );
  }
});

test("les routes d'envoi d'e-mail sont fermées, sauf la notification interne", () => {
  for (const route of [
    '/api/emails/send-consultation',
    '/api/emails/send-document',
    '/api/emails/send-order-documents',
    '/api/emails/linkme-info-request',
    '/api/emails/linkme-order-approved',
    '/api/emails/linkme-order-rejected',
    '/api/emails/linkme-step4-confirmed',
    '/api/emails/form-reply',
  ]) {
    assert.equal(
      isPublicApiRoute(route),
      false,
      `${route} ne doit pas être ouverte`
    );
  }
  // Seule exception : destinataire fixe et interne, appel serveur à serveur.
  assert.equal(isPublicApiRoute('/api/emails/linkme-info-completed'), true);
});

test('les tâches planifiées et les webhooks restent joignables', () => {
  assert.equal(isPublicApiRoute('/api/cron/sync-comptabilite'), true);
  assert.equal(isPublicApiRoute('/api/cron/meta-commerce-sync'), true);
  assert.equal(isPublicApiRoute('/api/gmail/watch/refresh'), true);
  assert.equal(isPublicApiRoute('/api/gmail/inbound'), true);
  assert.equal(isPublicApiRoute('/api/webhooks/packlink'), true);
});

test("l'extension Chrome du sourcing n'est PAS dans la liste blanche", () => {
  // Elle passe par son jeton porteur, vérifié par le middleware, pas par une
  // exemption de chemin : une porte de moins à surveiller.
  assert.equal(isPublicApiRoute('/api/sourcing/import'), false);
  assert.equal(isPublicApiRoute('/api/sourcing/auth'), false);
  assert.equal(isPublicApiRoute('/api/brands'), false);
});

test('chaque porte ouverte porte une justification écrite', () => {
  for (const route of PUBLIC_API_ROUTES) {
    assert.ok(
      route.justification.length > 40,
      `justification trop courte pour ${String(route.pattern)}`
    );
  }
});

test('une route voisine ne passe pas par accident', () => {
  assert.equal(isPublicApiRoute('/api/health-check'), false);
  assert.equal(isPublicApiRoute('/api/csp-report/all'), false);
  assert.equal(isPublicApiRoute('/api/gmail/watch/init'), false);
  assert.equal(isPublicApiRoute('/api/webhooks/packlink/replay'), false);
});

console.log(`\n${passed} réussis, ${failed} échoués`);
if (failed > 0) process.exit(1);

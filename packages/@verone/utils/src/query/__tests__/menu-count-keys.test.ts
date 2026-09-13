/**
 * Tests unitaires - Invalidation des pastilles du menu
 *
 * Exécution: npx tsx packages/@verone/utils/src/query/__tests__/menu-count-keys.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  MENU_COUNT_QUERY_KEYS,
  invalidateMenuCounts,
  menuCountKeysFor,
  type MenuCountInvalidator,
} from '../menu-count-keys';

function fakeClient(): MenuCountInvalidator & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  return {
    calls,
    invalidateQueries(filters) {
      calls.push([...filters.queryKey]);
      return Promise.resolve();
    },
  };
}

async function run(): Promise<void> {
  // Sourcing : seulement l'agrégat du menu
  assert.deepEqual(menuCountKeysFor(['sourcing']), [
    MENU_COUNT_QUERY_KEYS.sidebar,
  ]);

  // Aucun domaine : l'agrégat reste invalidé
  assert.deepEqual(menuCountKeysFor([]), [MENU_COUNT_QUERY_KEYS.sidebar]);

  // Domaine avec compteur individuel : agrégat + compteur
  assert.deepEqual(menuCountKeysFor(['consultations']), [
    MENU_COUNT_QUERY_KEYS.sidebar,
    MENU_COUNT_QUERY_KEYS.consultations,
  ]);

  // Plusieurs domaines, doublons ignorés
  assert.deepEqual(
    menuCountKeysFor([
      'formSubmissions',
      'consultations',
      'formSubmissions',
      'sourcing',
    ]),
    [
      MENU_COUNT_QUERY_KEYS.sidebar,
      MENU_COUNT_QUERY_KEYS.formSubmissions,
      MENU_COUNT_QUERY_KEYS.consultations,
    ]
  );

  // Les clés sont des préfixes des clés réellement utilisées par les hooks
  assert.deepEqual(MENU_COUNT_QUERY_KEYS.consultations, [
    'consultations',
    'count',
  ]);
  assert.deepEqual(MENU_COUNT_QUERY_KEYS.sidebar, [
    'notifications',
    'sidebar_counts',
  ]);

  // invalidateMenuCounts appelle le client une fois par clé
  const client = fakeClient();
  await invalidateMenuCounts(client, 'bankTransactions', 'linkmeInfoRequests');
  assert.deepEqual(client.calls, [
    ['notifications', 'sidebar_counts'],
    ['bank_transactions', 'unreconciled_count'],
    ['linkme_info_requests', 'pending_count'],
  ]);

  console.log('menu-count-keys: 6 assertions groups OK');
}

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

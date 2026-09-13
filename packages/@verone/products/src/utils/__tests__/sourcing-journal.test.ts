/**
 * Tests unitaires - Lecture du journal sourcing (BO-SOURCING-P4-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/sourcing-journal.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  sourcingStatusLabel,
  statusChangeReason,
  statusChangeTitle,
} from '../sourcing-journal';

// Libellés
assert.equal(sourcingStatusLabel('negotiation'), 'Négociation');
assert.equal(sourcingStatusLabel('validated'), 'Validé au catalogue');
assert.equal(sourcingStatusLabel(null), 'Aucun statut');
assert.equal(sourcingStatusLabel('inconnu'), 'inconnu');

// Résumés tels qu'écrits par apply_product_lifecycle_action
const entry = (from: string | null, to: string, summary: string) => ({
  from_status: from,
  to_status: to,
  summary,
});

const stage = entry(
  'sample_requested',
  'evaluation',
  'Étape : sample_requested → evaluation'
);
assert.equal(statusChangeTitle(stage), 'Échantillon demandé → Évaluation');
assert.equal(statusChangeReason(stage), null);

const refused = entry('evaluation', 'refused', 'Refusé : prix trop élevé');
assert.equal(statusChangeTitle(refused), 'Refusé');
assert.equal(statusChangeReason(refused), 'prix trop élevé');

const withdrawn = entry(
  'negotiation',
  'withdrawn',
  'Retiré : fournisseur injoignable : relancé 3 fois'
);
assert.equal(statusChangeTitle(withdrawn), 'Retiré');
// Seul le premier séparateur compte : le motif peut contenir « : »
assert.equal(
  statusChangeReason(withdrawn),
  'fournisseur injoignable : relancé 3 fois'
);

assert.equal(
  statusChangeTitle(entry('negotiation', 'restored', 'Restauré')),
  'Restauré'
);
assert.equal(
  statusChangeReason(entry('negotiation', 'restored', 'Restauré')),
  null
);

const paused = entry(
  'evaluation',
  'on_hold',
  'Mis en pause — attente du salon'
);
assert.equal(statusChangeTitle(paused), 'En pause');
assert.equal(statusChangeReason(paused), 'attente du salon');

// Reprise / réouverture : « : » du résumé n'est pas un motif
const resumed = entry('on_hold', 'evaluation', 'Reprise : evaluation');
assert.equal(statusChangeTitle(resumed), 'En pause → Évaluation');
assert.equal(statusChangeReason(resumed), null);

const reopened = entry(
  'refused',
  'supplier_search',
  'Réouvert : supplier_search — nouveau fournisseur trouvé'
);
assert.equal(statusChangeTitle(reopened), 'Refusé → Recherche');
assert.equal(statusChangeReason(reopened), 'nouveau fournisseur trouvé');

assert.equal(
  statusChangeTitle(entry('evaluation', 'validated', 'Validé au catalogue')),
  'Validé au catalogue'
);

// Motif vide après séparateur : aucun motif
assert.equal(statusChangeReason(entry('a', 'refused', 'Refusé :  ')), null);

console.log('sourcing-journal: OK');

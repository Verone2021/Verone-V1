/**
 * Tests unitaires - Étape affichée d'un produit sourcing (BO-SOURCING-P4-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/sourcing-stage.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  SOURCING_IN_PROGRESS_STATUSES,
  SOURCING_STAGES,
  availableLifecycleActions,
  stageOfStatus,
} from '../sourcing-stage';

// Les 4 étapes restent elles-mêmes
for (const stage of SOURCING_STAGES) {
  assert.deepEqual(stageOfStatus(stage), { stage, group: 'in_progress' });
}

// Début du parcours : besoin identifié, vide ou inconnu
for (const status of ['need_identified', null, undefined, '', 'inconnu']) {
  assert.deepEqual(stageOfStatus(status), {
    stage: 'supplier_search',
    group: 'in_progress',
  });
}

// Anciens statuts échantillon / commande : regroupés sur Négociation
for (const status of [
  'sample_requested',
  'sample_received',
  'sample_approved',
  'order_placed',
  'received',
]) {
  assert.deepEqual(stageOfStatus(status), {
    stage: 'negotiation',
    group: 'in_progress',
  });
}

// États hors parcours : pastille, aucune étape
assert.deepEqual(stageOfStatus('on_hold'), { stage: null, group: 'on_hold' });
for (const status of ['refused', 'cancelled', 'archived']) {
  assert.deepEqual(stageOfStatus(status), { stage: null, group: 'refused' });
}
assert.deepEqual(stageOfStatus('validated'), {
  stage: null,
  group: 'validated',
});

// Tous les statuts « en cours » de la base s'affichent sur une étape
for (const status of SOURCING_IN_PROGRESS_STATUSES) {
  const info = stageOfStatus(status);
  assert.equal(info.group, 'in_progress', status);
  assert.notEqual(info.stage, null, status);
}

// Actions proposées = actions acceptées par la base
assert.deepEqual(availableLifecycleActions('evaluation', false), [
  'set_stage',
  'pause',
  'refuse',
  'validate',
  'withdraw',
]);
assert.deepEqual(availableLifecycleActions('sample_requested', false), [
  'set_stage',
  'pause',
  'refuse',
  'validate',
  'withdraw',
]);
assert.deepEqual(availableLifecycleActions('on_hold', false), [
  'resume',
  'refuse',
  'withdraw',
]);
assert.deepEqual(availableLifecycleActions('refused', false), [
  'reopen',
  'withdraw',
]);
assert.deepEqual(availableLifecycleActions('cancelled', false), [
  'reopen',
  'withdraw',
]);
assert.deepEqual(availableLifecycleActions('validated', false), ['withdraw']);
// Statut vide : la base refuse tout changement d'étape
assert.deepEqual(availableLifecycleActions(null, false), ['withdraw']);
// Produit retiré : seule la restauration est possible
assert.deepEqual(availableLifecycleActions('evaluation', true), ['restore']);
assert.deepEqual(availableLifecycleActions('refused', true), ['restore']);

console.log('sourcing-stage: OK');

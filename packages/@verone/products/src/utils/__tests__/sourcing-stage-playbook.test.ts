/**
 * Tests unitaires — Contenu des 4 étapes (BO-SOURCING-ETAPES-003)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/sourcing-stage-playbook.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  isOverdueFollowUp,
  SOURCING_STAGE_PLAYBOOK,
  stageCounter,
  type SourcingStageProgressInput,
} from '../sourcing-stage-playbook';
import { SOURCING_STAGES, SOURCING_STAGE_LABELS } from '../sourcing-stage';

// ---------------------------------------------------------------------------
// Le carnet couvre exactement les 4 étapes, avec les mêmes libellés
// ---------------------------------------------------------------------------

assert.deepEqual(Object.keys(SOURCING_STAGE_PLAYBOOK), [...SOURCING_STAGES]);
for (const stage of SOURCING_STAGES) {
  const fiche = SOURCING_STAGE_PLAYBOOK[stage];
  assert.equal(fiche.stage, stage);
  assert.equal(
    fiche.title,
    SOURCING_STAGE_LABELS[stage],
    `libellé de ${stage} aligné sur la frise`
  );
  assert.ok(fiche.goal.length > 20, `but de ${stage}`);
  assert.ok(fiche.exit.length > 20, `sortie de ${stage}`);
  assert.ok(fiche.sections.length > 0, `sections de ${stage}`);
  assert.ok(fiche.actions.length > 0, `actions de ${stage}`);
  // Chaque action porte une aide : un bouton seul n'apprend rien.
  assert.ok(
    fiche.actions.every(a => a.hint.length > 15),
    `aides de ${stage}`
  );
}

// Les clés d'action ne se répètent pas dans une même étape
for (const stage of SOURCING_STAGES) {
  const cles = SOURCING_STAGE_PLAYBOOK[stage].actions.map(a => a.key);
  assert.equal(new Set(cles).size, cles.length, `actions uniques ${stage}`);
}

// ---------------------------------------------------------------------------
// Compteurs
// ---------------------------------------------------------------------------

const vide: SourcingStageProgressInput = {
  linkCount: 0,
  photoCount: 0,
  offerStatuses: [],
  exchangeCount: 0,
  overdueFollowUps: 0,
  priceEntryCount: 0,
  hasSample: false,
  hasEvaluation: false,
};

// Rien à dire = pas de compteur (plutôt qu'un « 0 » partout)
for (const stage of SOURCING_STAGES) {
  assert.equal(stageCounter(stage, vide), null, `compteur vide ${stage}`);
}

assert.equal(
  stageCounter('supplier_search', {
    ...vide,
    offerStatuses: ['identified', 'contacted'],
    linkCount: 3,
  }),
  '2 fournisseurs · 3 liens'
);
assert.equal(
  stageCounter('supplier_search', { ...vide, offerStatuses: ['identified'] }),
  '1 fournisseur'
);

// « Contacté » = tout ce qui a dépassé l'identification, hors écartés
assert.equal(
  stageCounter('initial_contact', {
    ...vide,
    offerStatuses: ['identified', 'contacted', 'responded', 'rejected'],
    exchangeCount: 4,
    overdueFollowUps: 1,
  }),
  '2 contactés · 4 échanges · 1 relance en retard'
);

assert.equal(
  stageCounter('evaluation', {
    ...vide,
    offerStatuses: ['responded', 'shortlisted', 'identified'],
    hasSample: true,
    hasEvaluation: true,
  }),
  '2 devis · échantillon · noté'
);

assert.equal(
  stageCounter('negotiation', { ...vide, priceEntryCount: 1 }),
  '1 prix noté'
);
assert.equal(
  stageCounter('negotiation', { ...vide, priceEntryCount: 5 }),
  '5 prix notés'
);

// ---------------------------------------------------------------------------
// Relances en retard
// ---------------------------------------------------------------------------

const aujourdhui = new Date('2026-09-16T10:00:00Z');

assert.equal(
  isOverdueFollowUp(
    { follow_up_date: '2026-09-15', is_resolved: false },
    aujourdhui
  ),
  true
);
// Une relance prévue aujourd'hui n'est pas en retard
assert.equal(
  isOverdueFollowUp(
    { follow_up_date: '2026-09-16', is_resolved: false },
    aujourdhui
  ),
  false
);
assert.equal(
  isOverdueFollowUp(
    { follow_up_date: '2026-09-20', is_resolved: false },
    aujourdhui
  ),
  false
);
// Résolue ou sans date : jamais en retard
assert.equal(
  isOverdueFollowUp(
    { follow_up_date: '2020-01-01', is_resolved: true },
    aujourdhui
  ),
  false
);
assert.equal(
  isOverdueFollowUp({ follow_up_date: null, is_resolved: false }, aujourdhui),
  false
);
// Date illisible : ignorée plutôt que comptée en retard
assert.equal(
  isOverdueFollowUp(
    { follow_up_date: 'pas-une-date', is_resolved: false },
    aujourdhui
  ),
  false
);

console.log('sourcing-stage-playbook: OK');

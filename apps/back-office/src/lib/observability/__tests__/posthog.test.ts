/**
 * Tests unitaires — masquage des donnees clients dans les rejeus de session.
 *
 * C'est le controle le plus important de ce sprint : un rejeu sert a voir un
 * plantage, jamais a lire la fiche d'un client. Si ce fichier casse, on ne
 * livre pas.
 *
 * Execution :
 *   npx tsx apps/back-office/src/lib/observability/__tests__/posthog.test.ts
 *
 * Sprint BO-OBS-001 — 2026-09-18
 */

import { strict as assert } from 'node:assert';

import { isSensitiveText, shouldInitPosthog } from '../posthog';

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

console.log('Textes qui DOIVENT etre masques');

const aMasquer = [
  'elisabete@exemple.fr',
  'contact@veronecollections.fr',
  '06 12 34 56 78',
  '+33 6 12 34 56 78',
  '01.42.55.66.77',
  '12 rue des Lilas',
  '3 avenue de la Republique',
  '75011 Paris',
  '1 970,29 €',
  '557.28 EUR',
  'FR76 3000 4008 2800 0123 4567 890',
];

for (const texte of aMasquer) {
  test(`« ${texte} »`, () => {
    assert.equal(isSensitiveText(texte), true);
  });
}

console.log('Textes qui doivent rester lisibles (sinon le rejeu est inutile)');

const aGarder = [
  'Facturation',
  'Nouvelle facture',
  'Commandes a expedier',
  'Erreur systeme Verone',
  'Recharger completement la page',
  'SO-2026-00199',
  'Statut : Validee',
  '',
];

for (const texte of aGarder) {
  test(`« ${texte} »`, () => {
    assert.equal(isSensitiveText(texte), false);
  });
}

console.log('Aucun envoi hors production');

test('sans cle, rien ne demarre', () => {
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  assert.equal(shouldInitPosthog(), false);
});

test('avec une cle mais hors production, rien ne demarre', () => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
  assert.notEqual(process.env.NODE_ENV, 'production');
  assert.equal(shouldInitPosthog(), false);
});

console.log(`\n${passed} reussis, ${failed} echoues`);
if (failed > 0) process.exit(1);

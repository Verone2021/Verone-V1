/**
 * Garde-fou — le PDF client ne laisse fuiter aucune donnée interne
 * Exécution standalone : npx tsx <ce-fichier>
 *
 * Le PDF client part vers le client : il ne doit jamais afficher un prix
 * d'achat, un prix de revient, une marge, ni le nom d'un fournisseur.
 * Les frais fournisseur entrent dans le calcul (ils portent le prix de vente
 * quand il vient de la marge), mais rien de tout cela ne doit être rendu.
 *
 * Ce test lit le rendu du composant (la partie JSX) et refuse tout
 * identifiant économique interne. Il ne remplace pas une relecture, il
 * empêche la fuite ajoutée par inadvertance.
 *
 * Sprint BO-CONSULT-MULTI-001 — 2026-09-16
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createTestRunner } from '../../lib/__tests__/consultation-economics.test-utils';

const { test, report } = createTestRunner();

const here = dirname(fileURLToPath(import.meta.url));
const clientPdfPath = join(here, '..', 'ConsultationSummaryPdf.tsx');
const source = readFileSync(clientPdfPath, 'utf8');

/** Partie rendue du composant — ce que le client voit. */
const renderStart = source.indexOf('  return (');
const rendered = renderStart === -1 ? '' : source.slice(renderStart);

/** Identifiants qui exposeraient une donnée interne s'ils étaient rendus. */
const FORBIDDEN_IN_RENDER = [
  'unitCost',
  'unitCostPrice',
  'purchaseAmount',
  'supplierFees',
  'supplier_name',
  'supplierCosts',
  'marginPercent',
  'econ.margin',
  'econ.cost',
  'cost_price',
  'costMissing',
];

console.log('\n--- PDF CLIENT : AUCUNE DONNÉE INTERNE RENDUE ---');

test('le rendu du PDF client a bien été trouvé', () => {
  assert.notEqual(renderStart, -1, 'bloc `return (` introuvable');
  assert.ok(rendered.length > 500, 'rendu anormalement court');
});

for (const token of FORBIDDEN_IN_RENDER) {
  test(`le PDF client n'affiche jamais « ${token} »`, () => {
    assert.ok(
      !rendered.includes(token),
      `« ${token} » apparaît dans le rendu du PDF client : donnée interne exposée`
    );
  });
}

test('le PDF client affiche bien un prix de vente', () => {
  assert.ok(
    rendered.includes('unitPrice') || rendered.includes('billedAmount'),
    'aucun prix de vente rendu — le test de fuite serait trompeur'
  );
});

report('client-pdf-no-leak');

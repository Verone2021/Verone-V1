/**
 * Tests unitaires - Logique d'affichage du bouton « Évaluer l'échantillon »
 * (BO-SOURCING-P4B-001)
 *
 * Exécution: npx tsx --test packages/@verone/products/src/utils/__tests__/product-evaluation-display.test.ts
 */

import { strict as assert } from 'node:assert';

import { shouldShowEvaluateButton } from '../product-evaluation';

// Réception sans évaluation : bouton visible
assert.equal(shouldShowEvaluateButton('received', false), true);

// Réception avec évaluation : bouton masqué (mode modification via la carte)
assert.equal(shouldShowEvaluateButton('received', true), false);

// Autres états de l'échantillon : bouton masqué
assert.equal(shouldShowEvaluateButton('ordered', false), false);
assert.equal(shouldShowEvaluateButton('none', false), false);
assert.equal(shouldShowEvaluateButton('cancelled', false), false);
assert.equal(shouldShowEvaluateButton('to_send', false), false);

// Cas limites
assert.equal(shouldShowEvaluateButton('', false), false);
assert.equal(shouldShowEvaluateButton('received', true), false);

console.log('shouldShowEvaluateButton: OK');

/**
 * Tests unitaires - Grille d'évaluation produit (BO-SOURCING-P4B-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/product-evaluation.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  evaluationAverage,
  evaluationJournalSummary,
  evaluationSuggestion,
  formatEvaluationAverage,
  isEvaluationScore,
  type ProductEvaluationScores,
  type SafetyCheck,
} from '../product-evaluation';

function scores(
  conformity: number | null,
  build: number | null,
  packaging: number | null,
  safety: SafetyCheck = 'ok'
): ProductEvaluationScores {
  return {
    score_conformity: conformity,
    score_build_finish: build,
    score_packaging: packaging,
    safety_check: safety,
  };
}

// Rien de noté : ni moyenne ni suggestion
assert.equal(evaluationAverage(scores(null, null, null)), null);
assert.equal(evaluationSuggestion(scores(null, null, null)), null);
assert.equal(evaluationSuggestion(scores(null, null, null, 'to_check')), null);

// Moyenne simple des critères notés, arrondie au dixième
assert.equal(evaluationAverage(scores(5, 5, 5)), 5);
assert.equal(evaluationAverage(scores(4, 4, 3)), 3.7);
assert.equal(evaluationAverage(scores(2, 3, 3)), 2.7);
assert.equal(evaluationAverage(scores(4, null, null)), 4);
assert.equal(evaluationAverage(scores(5, null, 4)), 4.5);

// Seuils : ≥ 4 Valider, 3 à 3,9 À revoir, < 3 Refuser
assert.equal(evaluationSuggestion(scores(4, 4, 4)), 'validate');
assert.equal(evaluationSuggestion(scores(5, 4, 3)), 'validate'); // 4,0
assert.equal(evaluationSuggestion(scores(4, 4, 3)), 'review'); // 3,7
assert.equal(evaluationSuggestion(scores(3, 3, 3)), 'review'); // 3,0
assert.equal(evaluationSuggestion(scores(2, 3, 3)), 'refuse'); // 2,7
assert.equal(evaluationSuggestion(scores(1, 1, 1)), 'refuse');

// Sécurité non conforme : refus proposé quelles que soient les notes
assert.equal(evaluationSuggestion(scores(5, 5, 5, 'ko')), 'refuse');
assert.equal(evaluationSuggestion(scores(null, null, null, 'ko')), 'refuse');
// « À vérifier » ne change pas la suggestion
assert.equal(evaluationSuggestion(scores(5, 5, 5, 'to_check')), 'validate');

// Notes hors grille ignorées (la base les refuse aussi)
for (const invalid of [0, 6, 2.5, -1, Number.NaN]) {
  assert.equal(isEvaluationScore(invalid), false, String(invalid));
}
for (const valid of [1, 2, 3, 4, 5]) {
  assert.equal(isEvaluationScore(valid), true, String(valid));
}
assert.equal(evaluationAverage(scores(6, 4, 0)), 4);

// Affichage et résumé du journal, en français
assert.equal(formatEvaluationAverage(3.7), '3,7/5');
assert.equal(formatEvaluationAverage(5), '5,0/5');
assert.equal(
  evaluationJournalSummary(scores(4, 4, 3)),
  'Évaluation échantillon : 3,7/5 — sécurité conforme — suggestion : À revoir'
);
assert.equal(
  evaluationJournalSummary(scores(5, 5, 5, 'ko')),
  'Évaluation échantillon : 5,0/5 — sécurité non conforme — suggestion : Refuser'
);
assert.equal(
  evaluationJournalSummary(scores(null, null, null, 'to_check')),
  'Évaluation échantillon : non notée — sécurité à vérifier'
);

console.log('product-evaluation: OK');

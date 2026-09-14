/**
 * Grille d'évaluation produit simplifiée (BO-SOURCING-P4B-001).
 *
 * Décisions de Roméo : une seule évaluation, à la réception de l'échantillon ;
 * 3 critères notés de 1 à 5 + un contrôle sécurité ; moyenne simple des critères
 * notés ; le score PROPOSE (Valider / À revoir / Refuser), Roméo décide.
 * Moyenne et suggestion sont calculées ici, jamais stockées en base.
 *
 * Pure : testée par __tests__/product-evaluation.test.ts.
 */

export type SafetyCheck = 'ok' | 'ko' | 'to_check';

export type EvaluationScore = 1 | 2 | 3 | 4 | 5;

export const EVALUATION_CRITERIA = [
  { key: 'score_conformity', label: "Conformité à l'annonce" },
  { key: 'score_build_finish', label: 'Fabrication et finitions' },
  { key: 'score_packaging', label: 'Emballage' },
] as const;

export type EvaluationCriterionKey =
  (typeof EVALUATION_CRITERIA)[number]['key'];

export const SAFETY_CHECK_LABELS: Record<SafetyCheck, string> = {
  ok: 'Conforme',
  ko: 'Non conforme',
  to_check: 'À vérifier',
};

export type ProductEvaluationScores = Record<
  EvaluationCriterionKey,
  number | null
> & {
  safety_check: SafetyCheck;
};

export type EvaluationSuggestion = 'validate' | 'review' | 'refuse';

export const EVALUATION_SUGGESTION_LABELS: Record<
  EvaluationSuggestion,
  string
> = {
  validate: 'Valider',
  review: 'À revoir',
  refuse: 'Refuser',
};

export function isEvaluationScore(value: unknown): value is EvaluationScore {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

/** Moyenne des critères notés, arrondie au dixième ; null si aucun n'est noté. */
export function evaluationAverage(
  scores: ProductEvaluationScores
): number | null {
  const rated = EVALUATION_CRITERIA.map(({ key }) => scores[key]).filter(
    isEvaluationScore
  );
  if (rated.length === 0) return null;
  const sum = rated.reduce<number>((total, score) => total + score, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

/**
 * Suggestion : sécurité non conforme ⇒ Refuser ; sinon moyenne ≥ 4 ⇒ Valider,
 * de 3 à 3,9 ⇒ À revoir, < 3 ⇒ Refuser ; null tant que rien n'est noté.
 */
export function evaluationSuggestion(
  scores: ProductEvaluationScores
): EvaluationSuggestion | null {
  if (scores.safety_check === 'ko') return 'refuse';
  const average = evaluationAverage(scores);
  if (average === null) return null;
  if (average >= 4) return 'validate';
  if (average >= 3) return 'review';
  return 'refuse';
}

export function formatEvaluationAverage(average: number): string {
  return `${average.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}/5`;
}

/**
 * Indique si le bouton « Évaluer l'échantillon » doit être affiché.
 * Visible uniquement quand l'échantillon est reçu ET qu'aucune évaluation
 * n'a encore été enregistrée.
 *
 * Pure : testée par __tests__/product-evaluation-display.test.ts.
 */
export function shouldShowEvaluateButton(
  sampleState: string,
  hasEvaluation: boolean
): boolean {
  return sampleState === 'received' && !hasEvaluation;
}

/**
 * Résumé écrit dans le journal sourcing à l'enregistrement de l'évaluation
 * (entrée « note »), dans les mots de l'écran.
 */
export function evaluationJournalSummary(
  scores: ProductEvaluationScores
): string {
  const average = evaluationAverage(scores);
  const suggestion = evaluationSuggestion(scores);
  const parts = [
    `Évaluation échantillon : ${average === null ? 'non notée' : formatEvaluationAverage(average)}`,
    `sécurité ${SAFETY_CHECK_LABELS[scores.safety_check].toLowerCase()}`,
  ];
  if (suggestion) {
    parts.push(`suggestion : ${EVALUATION_SUGGESTION_LABELS[suggestion]}`);
  }
  return parts.join(' — ');
}

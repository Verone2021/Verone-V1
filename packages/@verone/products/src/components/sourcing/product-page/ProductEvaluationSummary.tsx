'use client';

/**
 * Carte récapitulative de l'évaluation de l'échantillon (BO-SOURCING-P4B-001).
 *
 * - Évaluation existante → affiche les scores, sécurité, suggestion + bouton Modifier
 * - Échantillon reçu sans évaluation → bouton Évaluer
 * - Autres cas → null (rien affiché)
 */

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { cn } from '@verone/utils';
import { ClipboardCheck, Star } from 'lucide-react';

import type { ProductEvaluationRow } from '../../../hooks/sourcing/use-product-evaluation';
import {
  EVALUATION_CRITERIA,
  EVALUATION_SUGGESTION_LABELS,
  SAFETY_CHECK_LABELS,
  evaluationAverage,
  evaluationSuggestion,
  formatEvaluationAverage,
  shouldShowEvaluateButton,
  type SafetyCheck,
} from '../../../utils/product-evaluation';

interface ProductEvaluationSummaryProps {
  evaluation: ProductEvaluationRow | null;
  sampleState: string;
  onEvaluate: () => void;
}

function StarDisplay({ score }: { score: number | null }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={score !== null ? `${score}/5` : 'Non noté'}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            'h-4 w-4',
            score !== null && i < score
              ? 'fill-amber-400 text-amber-500'
              : 'text-gray-200'
          )}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">
        {score !== null ? `${score}/5` : '—'}
      </span>
    </div>
  );
}

function SafetyBadge({ value }: { value: string }) {
  const label = SAFETY_CHECK_LABELS[value as SafetyCheck] ?? value;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        value === 'ok' && 'bg-green-100 text-green-700',
        value === 'ko' && 'bg-red-100 text-red-700',
        value === 'to_check' && 'bg-gray-100 text-gray-700'
      )}
    >
      {label}
    </span>
  );
}

export function ProductEvaluationSummary({
  evaluation,
  sampleState,
  onEvaluate,
}: ProductEvaluationSummaryProps) {
  if (!evaluation) {
    if (!shouldShowEvaluateButton(sampleState, false)) return null;
    return (
      <Card className="border-black">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClipboardCheck className="h-4 w-4 shrink-0 text-gray-400" />
            <span>
              L&apos;échantillon a été reçu — évaluez-le pour continuer.
            </span>
          </div>
          <ButtonV2
            variant="primary"
            size="sm"
            onClick={onEvaluate}
            className="h-11 shrink-0 md:h-9"
          >
            Évaluer l&apos;échantillon
          </ButtonV2>
        </CardContent>
      </Card>
    );
  }

  const scores = {
    score_conformity: evaluation.score_conformity,
    score_build_finish: evaluation.score_build_finish,
    score_packaging: evaluation.score_packaging,
    safety_check: evaluation.safety_check as SafetyCheck,
  };
  const average = evaluationAverage(scores);
  const suggestion = evaluationSuggestion(scores);

  return (
    <Card className="border-black">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-black">
            Évaluation de l&apos;échantillon
          </CardTitle>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onEvaluate}
            className="h-11 md:h-9"
          >
            Modifier l&apos;évaluation
          </ButtonV2>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EVALUATION_CRITERIA.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <p className="text-xs text-gray-500">{label}</p>
              <StarDisplay score={scores[key]} />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
          <div className="text-sm font-medium text-gray-900">
            {average !== null
              ? `Moyenne : ${formatEvaluationAverage(average)}`
              : 'Non notée'}
          </div>
          <SafetyBadge value={evaluation.safety_check} />
          {suggestion !== null && (
            <span
              className={cn(
                'text-sm font-medium',
                suggestion === 'validate' && 'text-green-700',
                suggestion === 'review' && 'text-amber-700',
                suggestion === 'refuse' && 'text-red-700'
              )}
            >
              → {EVALUATION_SUGGESTION_LABELS[suggestion]}
            </span>
          )}
        </div>

        {evaluation.evaluated_at && (
          <p className="text-xs text-gray-400">
            Enregistrée le{' '}
            {new Date(evaluation.evaluated_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

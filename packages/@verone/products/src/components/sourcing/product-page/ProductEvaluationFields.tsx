'use client';

/**
 * Champs de la fenêtre d'évaluation de l'échantillon (BO-SOURCING-P4B-001) :
 * choix du contrôle sécurité et encadré moyenne + suggestion.
 */

import { Label } from '@verone/ui/components/ui/label';
import { cn } from '@verone/utils';

import {
  EVALUATION_SUGGESTION_LABELS,
  SAFETY_CHECK_LABELS,
  formatEvaluationAverage,
  type EvaluationSuggestion,
  type SafetyCheck,
} from '../../../utils/product-evaluation';

const SAFETY_OPTIONS: SafetyCheck[] = ['ok', 'ko', 'to_check'];

const SELECTED_SAFETY_CLASS: Record<SafetyCheck, string> = {
  ok: 'border-green-600 bg-green-50 text-green-700',
  ko: 'border-red-500 bg-red-50 text-red-700',
  to_check: 'border-gray-800 bg-gray-100 text-gray-900',
};

interface SafetyCheckSelectorProps {
  value: SafetyCheck;
  onChange: (value: SafetyCheck) => void;
  disabled: boolean;
}

export function SafetyCheckSelector({
  value,
  onChange,
  disabled,
}: SafetyCheckSelectorProps) {
  return (
    <div className="space-y-2">
      <Label
        id="evaluation-safety-label"
        className="text-sm font-medium text-gray-900"
      >
        Contrôle de sécurité
      </Label>
      <div
        role="radiogroup"
        aria-labelledby="evaluation-safety-label"
        className="flex flex-wrap gap-2"
      >
        {SAFETY_OPTIONS.map(option => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'h-11 rounded-md border px-3 text-sm transition-colors md:h-9',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black',
              value === option
                ? SELECTED_SAFETY_CLASS[option]
                : 'border-gray-200 text-gray-600 hover:border-gray-400',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {SAFETY_CHECK_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

interface EvaluationPreviewProps {
  average: number | null;
  suggestion: EvaluationSuggestion | null;
}

/** Moyenne et suggestion recalculées en direct ; la décision reste humaine. */
export function EvaluationPreview({
  average,
  suggestion,
}: EvaluationPreviewProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm"
    >
      <span className="font-medium text-gray-900">
        {average === null
          ? 'Non notée'
          : `Moyenne ${formatEvaluationAverage(average)}`}
      </span>
      {suggestion !== null && (
        <span
          className={cn(
            'ml-2',
            suggestion === 'validate' && 'text-green-700',
            suggestion === 'review' && 'text-amber-700',
            suggestion === 'refuse' && 'text-red-700'
          )}
        >
          — suggestion&nbsp;: {EVALUATION_SUGGESTION_LABELS[suggestion]}
        </span>
      )}
    </div>
  );
}

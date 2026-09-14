'use client';

/**
 * Modal d'évaluation de l'échantillon (BO-SOURCING-P4B-001).
 * Pré-rempli si une évaluation existe (mode modification).
 * Responsive : plein écran sur mobile, modal md:max-w-2xl sur desktop.
 */

import { useEffect, useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Label } from '@verone/ui/components/ui/label';
import { ScoreInput } from '@verone/ui/components/ui/score-input';
import { Textarea } from '@verone/ui/components/ui/textarea';
import { cn } from '@verone/utils';

import type {
  ProductEvaluationRow,
  SaveEvaluationInput,
} from '../../../hooks/sourcing/use-product-evaluation';
import {
  EVALUATION_CRITERIA,
  EVALUATION_SUGGESTION_LABELS,
  SAFETY_CHECK_LABELS,
  evaluationAverage,
  evaluationSuggestion,
  formatEvaluationAverage,
  type SafetyCheck,
} from '../../../utils/product-evaluation';

interface ProductEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: ProductEvaluationRow | null;
  saving: boolean;
  onSave: (input: SaveEvaluationInput) => Promise<void>;
  supplierId?: string | null;
  purchaseOrderItemId?: string | null;
}

const SAFETY_OPTIONS: Array<{ value: SafetyCheck; label: string }> = [
  { value: 'ok', label: SAFETY_CHECK_LABELS.ok },
  { value: 'ko', label: SAFETY_CHECK_LABELS.ko },
  { value: 'to_check', label: SAFETY_CHECK_LABELS.to_check },
];

export function ProductEvaluationDialog({
  open,
  onOpenChange,
  evaluation,
  saving,
  onSave,
  supplierId,
  purchaseOrderItemId,
}: ProductEvaluationDialogProps) {
  const [scoreConformity, setScoreConformity] = useState<number | null>(null);
  const [scoreBuildFinish, setScoreBuildFinish] = useState<number | null>(null);
  const [scorePackaging, setScorePackaging] = useState<number | null>(null);
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheck>('to_check');
  const [notes, setNotes] = useState<string>('');

  // Réinitialise le formulaire à l'ouverture ou au changement d'évaluation.
  // Toutes les dépendances sont des primitives stables (id, scores, string).
  useEffect(() => {
    if (!open) return;
    setScoreConformity(evaluation?.score_conformity ?? null);
    setScoreBuildFinish(evaluation?.score_build_finish ?? null);
    setScorePackaging(evaluation?.score_packaging ?? null);
    setSafetyCheck(
      (evaluation?.safety_check as SafetyCheck | undefined) ?? 'to_check'
    );
    setNotes(evaluation?.notes ?? '');
  }, [
    open,
    evaluation?.id,
    evaluation?.score_conformity,
    evaluation?.score_build_finish,
    evaluation?.score_packaging,
    evaluation?.safety_check,
    evaluation?.notes,
  ]);

  const currentScores = {
    score_conformity: scoreConformity,
    score_build_finish: scoreBuildFinish,
    score_packaging: scorePackaging,
    safety_check: safetyCheck,
  };
  const average = evaluationAverage(currentScores);
  const suggestion = evaluationSuggestion(currentScores);

  const handleSave = () => {
    void onSave({
      score_conformity: scoreConformity,
      score_build_finish: scoreBuildFinish,
      score_packaging: scorePackaging,
      safety_check: safetyCheck,
      notes: notes.trim() || null,
      supplierId,
      purchaseOrderItemId,
    })
      .then(() => {
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        console.error('[ProductEvaluationDialog] save failed:', err);
      });
  };

  const scoreSetters = {
    score_conformity: setScoreConformity,
    score_build_finish: setScoreBuildFinish,
    score_packaging: setScorePackaging,
  };
  const scoreValues = {
    score_conformity: scoreConformity,
    score_build_finish: scoreBuildFinish,
    score_packaging: scorePackaging,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Évaluation de l&apos;échantillon</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-2 md:max-h-[70vh]">
          <div className="space-y-4">
            {EVALUATION_CRITERIA.map(({ key, label }) => (
              <ScoreInput
                key={key}
                label={label}
                value={scoreValues[key]}
                onChange={scoreSetters[key]}
                disabled={saving}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">
              Contrôle de sécurité
            </Label>
            <div className="flex flex-wrap gap-2">
              {SAFETY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => setSafetyCheck(opt.value)}
                  className={cn(
                    'h-11 rounded-md border px-3 text-sm transition-colors md:h-9',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black',
                    safetyCheck === opt.value
                      ? opt.value === 'ko'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : opt.value === 'ok'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-800 bg-gray-100 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400',
                    saving && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="evaluation-notes"
              className="text-sm font-medium text-gray-900"
            >
              Notes
            </Label>
            <Textarea
              id="evaluation-notes"
              placeholder="Observations sur l'échantillon…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={saving}
              rows={3}
              className="w-full"
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
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
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full md:w-auto"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            className="w-full md:w-auto"
          >
            Enregistrer
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

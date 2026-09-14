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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Label } from '@verone/ui/components/ui/label';
import { ScoreInput } from '@verone/ui/components/ui/score-input';
import { Textarea } from '@verone/ui/components/ui/textarea';

import type {
  ProductEvaluationRow,
  SaveEvaluationInput,
} from '../../../hooks/sourcing/use-product-evaluation';
import {
  EVALUATION_CRITERIA,
  evaluationAverage,
  evaluationSuggestion,
  type SafetyCheck,
} from '../../../utils/product-evaluation';
import {
  EvaluationPreview,
  SafetyCheckSelector,
} from './ProductEvaluationFields';

interface ProductEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: ProductEvaluationRow | null;
  saving: boolean;
  onSave: (input: SaveEvaluationInput) => Promise<void>;
  supplierId?: string | null;
  purchaseOrderItemId?: string | null;
}

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

  const scoreValues = {
    score_conformity: scoreConformity,
    score_build_finish: scoreBuildFinish,
    score_packaging: scorePackaging,
  };
  const scoreSetters = {
    score_conformity: setScoreConformity,
    score_build_finish: setScoreBuildFinish,
    score_packaging: setScorePackaging,
  };
  const currentScores = { ...scoreValues, safety_check: safetyCheck };

  const handleSave = () => {
    void onSave({
      ...scoreValues,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen md:h-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Évaluation de l&apos;échantillon</DialogTitle>
          <DialogDescription className="sr-only">
            Notez l&apos;échantillon reçu sur trois critères de 1 à 5 et
            indiquez le contrôle de sécurité. La suggestion est indicative.
          </DialogDescription>
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

          <SafetyCheckSelector
            value={safetyCheck}
            onChange={setSafetyCheck}
            disabled={saving}
          />

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

          <EvaluationPreview
            average={evaluationAverage(currentScores)}
            suggestion={evaluationSuggestion(currentScores)}
          />
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

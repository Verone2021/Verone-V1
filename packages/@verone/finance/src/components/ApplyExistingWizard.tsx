'use client';

/**
 * ApplyExistingWizard - Wizard pour appliquer une règle aux transactions existantes
 *
 * Workflow:
 * 1. Preview - Affiche les groupes de transactions qui matchent (READ ONLY)
 * 2. Selection - L'utilisateur choisit quels groupes appliquer
 * 3. Confirm - Applique uniquement aux groupes sélectionnés
 *
 * GARDE-FOU: Aucune modification sans confirmation explicite
 */

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@verone/ui';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Checkbox } from '@verone/ui/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Loader2,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  MatchingRule,
  PreviewMatchResult,
} from '../hooks/use-matching-rules';

// Props
export interface ApplyExistingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: MatchingRule;
  previewApply: (ruleId: string) => Promise<PreviewMatchResult[]>;
  confirmApply: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<{ nb_updated: number; updated_ids: string[] }>;
  onSuccess?: () => void;
}

// Confidence badge colors
const confidenceColors = {
  HIGH: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: CheckCircle2,
    label: 'Confiance haute',
  },
  MEDIUM: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon: Eye,
    label: 'Confiance moyenne',
  },
  LOW: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: AlertTriangle,
    label: 'Confiance basse',
  },
} as const;

export function ApplyExistingWizard({
  open,
  onOpenChange,
  rule,
  previewApply,
  confirmApply,
  onSuccess,
}: ApplyExistingWizardProps) {
  // State
  const [step, setStep] = useState<
    'loading' | 'preview' | 'confirming' | 'done'
  >('loading');
  const [previewResults, setPreviewResults] = useState<PreviewMatchResult[]>(
    []
  );
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    nb_updated: number;
    updated_ids: string[];
  } | null>(null);

  // Load preview on open
  useEffect(() => {
    if (open && rule) {
      setStep('loading');
      setError(null);
      setSelectedLabels(new Set());
      setResult(null);

      previewApply(rule.id)
        .then(results => {
          setPreviewResults(results);
          // Pre-select HIGH confidence groups
          const highConfidence = results
            .filter(r => r.confidence === 'HIGH')
            .map(r => r.normalized_label_group);
          setSelectedLabels(new Set(highConfidence));
          setStep('preview');
        })
        .catch(err => {
          console.error('[ApplyExistingWizard] Preview error:', err);
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
          setStep('preview');
        });
    }
  }, [open, rule, previewApply]);

  // Toggle selection
  const toggleLabel = useCallback((label: string) => {
    setSelectedLabels(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  // Select all / none
  const selectAll = useCallback(() => {
    setSelectedLabels(
      new Set(previewResults.map(r => r.normalized_label_group))
    );
  }, [previewResults]);

  const selectNone = useCallback(() => {
    setSelectedLabels(new Set());
  }, []);

  // Confirm application
  const handleConfirm = useCallback(async () => {
    if (selectedLabels.size === 0) {
      toast.error('Sélectionnez au moins un groupe de transactions');
      return;
    }

    setStep('confirming');
    try {
      const confirmResult = await confirmApply(
        rule.id,
        Array.from(selectedLabels)
      );
      setResult(confirmResult);
      setStep('done');
      toast.success(
        `${confirmResult.nb_updated} transaction(s) mise(s) à jour`
      );
      onSuccess?.();
    } catch (err) {
      console.error('[ApplyExistingWizard] Confirm error:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la confirmation'
      );
      setStep('preview');
    }
  }, [selectedLabels, rule.id, confirmApply, onSuccess]);

  // Stats
  const totalSelected = previewResults
    .filter(r => selectedLabels.has(r.normalized_label_group))
    .reduce((sum, r) => sum + r.transaction_count, 0);

  const totalAmount = previewResults
    .filter(r => selectedLabels.has(r.normalized_label_group))
    .reduce((sum, r) => sum + Math.abs(r.total_amount), 0);

  // Stats: combien sont déjà appliquées vs à appliquer
  const totalAlreadyApplied = previewResults.reduce(
    (sum, r) => sum + (r.already_applied_count ?? 0),
    0
  );
  const totalPending = previewResults.reduce(
    (sum, r) => sum + (r.pending_count ?? 0),
    0
  );
  const allAlreadyApplied = totalPending === 0 && totalAlreadyApplied > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 max-h-[85vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 shadow-sm">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Appliquer aux transactions existantes
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-0.5">
                Règle: <span className="font-mono">{rule.match_value}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-slate-600">
                Analyse des transactions en cours...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Erreur</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && !error && (
            <>
              {previewResults.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">
                    Aucune transaction existante ne correspond à cette règle
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Les nouvelles transactions seront classées automatiquement
                  </p>
                </div>
              ) : allAlreadyApplied ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-900">
                    Tout est déjà appliqué !
                  </p>
                  <p className="text-slate-600 mt-2">
                    {totalAlreadyApplied} transaction(s) déjà classifiée(s) avec
                    cette règle
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Les nouvelles transactions seront classées automatiquement
                  </p>
                </div>
              ) : (
                <>
                  {/* Selection controls */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600">
                        {previewResults.length} groupe(s) trouvé(s)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAll}
                          className="text-xs"
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectNone}
                          className="text-xs"
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>
                    {selectedLabels.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-amber-700 bg-amber-100"
                      >
                        {totalSelected} transaction(s) •{' '}
                        {totalAmount.toFixed(2)} €
                      </Badge>
                    )}
                  </div>

                  {/* Results list */}
                  <div className="space-y-3">
                    {previewResults.map(group => {
                      const isSelected = selectedLabels.has(
                        group.normalized_label_group
                      );
                      const conf = confidenceColors[group.confidence];
                      const ConfIcon = conf.icon;

                      return (
                        <label
                          key={group.normalized_label_group}
                          className={cn(
                            'flex cursor-pointer rounded-lg border-2 p-4 transition-all',
                            isSelected
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleLabel(group.normalized_label_group)
                            }
                            className="mt-1"
                          />
                          <div className="ml-3 flex-1">
                            {/* Header row */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-slate-900">
                                  {group.sample_labels[0] ||
                                    group.normalized_label_group}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    conf.bg,
                                    conf.text,
                                    conf.border
                                  )}
                                >
                                  <ConfIcon className="h-3 w-3 mr-1" />
                                  {conf.label}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-slate-900">
                                  {Math.abs(group.total_amount).toFixed(2)} €
                                </span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>
                                {group.transaction_count} transaction(s)
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(group.first_seen).toLocaleDateString(
                                  'fr-FR'
                                )}{' '}
                                →{' '}
                                {new Date(group.last_seen).toLocaleDateString(
                                  'fr-FR'
                                )}
                              </span>
                              {group.counterparty_hint && (
                                <>
                                  <span>•</span>
                                  <span>{group.counterparty_hint}</span>
                                </>
                              )}
                            </div>

                            {/* Reasons */}
                            {group.reasons && group.reasons.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {group.reasons.map((reason, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs bg-slate-50"
                                  >
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Multiple labels info */}
                            {group.sample_labels.length > 1 && (
                              <div className="mt-2 text-xs text-slate-400">
                                Variantes:{' '}
                                {group.sample_labels.slice(1, 3).join(', ')}
                                {group.sample_labels.length > 3 &&
                                  ` (+${group.sample_labels.length - 3} autres)`}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Confirming step */}
          {step === 'confirming' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-slate-600">Application en cours...</p>
              <p className="text-sm text-slate-500">
                {totalSelected} transaction(s) à mettre à jour
              </p>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && result && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">
                  Application réussie !
                </p>
                <p className="text-slate-600 mt-1">
                  {result.nb_updated} transaction(s) mise(s) à jour
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-slate-50 shrink-0">
          {step === 'preview' &&
            previewResults.length > 0 &&
            !allAlreadyApplied &&
            !error && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="text-slate-600"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedLabels.size === 0}
                  className="gap-2 bg-amber-500 hover:bg-amber-600"
                >
                  <ChevronRight className="h-4 w-4" />
                  Appliquer à {totalPending} transaction(s)
                </Button>
              </>
            )}

          {(step === 'preview' && previewResults.length === 0) ||
          (step === 'preview' && allAlreadyApplied) ||
          error ||
          step === 'done' ? (
            <Button onClick={() => onOpenChange(false)} className="ml-auto">
              <X className="h-4 w-4 mr-1" />
              Fermer
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

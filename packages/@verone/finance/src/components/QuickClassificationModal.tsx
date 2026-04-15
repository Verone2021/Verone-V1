'use client';

/**
 * QuickClassificationModal - Modal de classification des depenses V2
 *
 * Design moderne inspire de Pennylane/Indy/Abie:
 * - Grand modal (80% largeur ecran)
 * - Raccourcis visuels avec icones colorees
 * - Recherche rapide avec autocompletion
 * - Suggestions intelligentes basees sur l'historique
 * - Interface epuree et intuitive
 */

import { useCallback, useEffect, useState, useMemo } from 'react';

import { cn } from '@verone/ui';
import { Button } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Check, Loader2, Receipt, Zap } from 'lucide-react';

import { useMatchingRules } from '../hooks/use-matching-rules';
import { type PcgThemeId as _PcgThemeId } from '../lib/pcg-themes';
import {
  ALL_PCG_CATEGORIES,
  PCG_SUGGESTED_CATEGORIES,
  PCG_SUGGESTED_INCOME_CATEGORIES,
  type PcgCategory,
} from '../lib/pcg-categories';
import {
  calculateHT,
  calculateVAT,
  calculateTTC,
  type TvaRate,
} from '../lib/tva';

import {
  POPULAR_CATEGORIES,
  POPULAR_INCOME_CATEGORIES,
} from './quick-classification/category-data';
import type { VatLine } from './quick-classification/types';
import { SelectedCategoryDisplay } from './quick-classification/SelectedCategoryDisplay';
import { CategorySearchPanel } from './quick-classification/CategorySearchPanel';
import { VatSection } from './quick-classification/VatSection';
import { RuleCreationSection } from './quick-classification/RuleCreationSection';
import { useQuickClassificationSubmit } from './quick-classification/use-quick-classification-submit';

export interface QuickClassificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  amount?: number;
  transactionId?: string;
  counterpartyName?: string;
  /** Categorie PCG actuelle (si deja classifiee) */
  currentCategory?: string;
  /** ID de la regle existante (si modification) - masque l'option creation de regle */
  existingRuleId?: string;
  onSuccess?: () => void;
  /** Nombre de transactions pour ce libelle (affichage "Appliquer aux X existantes") */
  transactionCount?: number;
  /** Fonction pour appliquer la regle aux transactions existantes */
  confirmApply?: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<{ nb_updated: number; updated_ids: string[] }>;
  /** Type de transaction: debit (depense) ou credit (entree). Determine les categories PCG affichees */
  transactionSide?: 'debit' | 'credit';
  /** Taux TVA actuel (de Qonto OCR ou manuel) */
  currentVatRate?: number | null;
  /** Source de la TVA: 'qonto_ocr' si detecte par Qonto, 'manual' si saisi manuellement */
  currentVatSource?: 'qonto_ocr' | 'manual' | null;
  /** Ventilation TVA multi-taux (si present) */
  currentVatBreakdown?: Array<{
    description: string;
    amount_ht: number;
    tva_rate: number;
    tva_amount: number;
  }> | null;
  /** Si true, la TVA est auto-calculee depuis le rapprochement — masquer la saisie manuelle */
  hasReconciliationVAT?: boolean;
}

export function QuickClassificationModal({
  open,
  onOpenChange,
  label,
  amount = 0,
  transactionId,
  counterpartyName,
  currentCategory,
  existingRuleId,
  onSuccess,
  transactionCount,
  confirmApply,
  transactionSide = 'debit',
  currentVatRate,
  currentVatSource,
  currentVatBreakdown,
  hasReconciliationVAT = false,
}: QuickClassificationModalProps): React.ReactNode {
  const {
    rules,
    create: createMatchingRule,
    update: updateMatchingRule,
  } = useMatchingRules();

  const { isSubmitting, handleSubmit } = useQuickClassificationSubmit();

  const isModificationMode = Boolean(existingRuleId ?? currentCategory);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<PcgCategory | null>(null);

  const currentCategoryInfo = useMemo(() => {
    if (!currentCategory) return null;
    return ALL_PCG_CATEGORIES.find(c => c.code === currentCategory) ?? null;
  }, [currentCategory]);

  const popularCategories = useMemo(
    () =>
      transactionSide === 'credit'
        ? POPULAR_INCOME_CATEGORIES
        : POPULAR_CATEGORIES,
    [transactionSide]
  );

  const suggestedCategories = useMemo(
    () =>
      transactionSide === 'credit'
        ? PCG_SUGGESTED_INCOME_CATEGORIES
        : PCG_SUGGESTED_CATEGORIES,
    [transactionSide]
  );

  const isIncome = transactionSide === 'credit';

  const initialVatRate =
    currentVatRate !== null &&
    currentVatRate !== undefined &&
    [0, 5.5, 10, 20].includes(currentVatRate)
      ? (currentVatRate as TvaRate)
      : 20;
  const [tvaRate, setTvaRate] = useState<TvaRate>(initialVatRate);
  const [searchQuery, setSearchQuery] = useState('');
  const [createRule, setCreateRule] = useState(true);

  const [existingRuleForLabel, setExistingRuleForLabel] = useState<{
    id: string;
    default_category: string | null;
    organisation_id: string | null;
  } | null>(null);

  const [applyToExisting, setApplyToExisting] = useState(true);

  const hasVatBreakdown = currentVatBreakdown && currentVatBreakdown.length > 0;
  const [isVentilationMode, setIsVentilationMode] = useState(
    hasVatBreakdown ?? false
  );
  const [vatLines, setVatLines] = useState<VatLine[]>(
    hasVatBreakdown
      ? currentVatBreakdown.map((line, idx) => ({
          id: String(idx + 1),
          description: line.description || `Ligne ${idx + 1}`,
          amount_ht: line.amount_ht || 0,
          tva_rate: ([0, 5.5, 10, 20].includes(line.tva_rate)
            ? line.tva_rate
            : 20) as TvaRate,
        }))
      : [
          { id: '1', description: '', amount_ht: 0, tva_rate: 10 },
          { id: '2', description: '', amount_ht: 0, tva_rate: 20 },
        ]
  );

  const htAmount = useMemo(
    () => calculateHT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );
  const vatAmount = useMemo(
    () => calculateVAT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );

  const ventilationTotals = useMemo(() => {
    const totalHT = vatLines.reduce(
      (sum, line) => sum + (line.amount_ht || 0),
      0
    );
    const totalVAT = vatLines.reduce(
      (sum, line) =>
        sum +
        calculateVAT(
          calculateTTC(line.amount_ht || 0, line.tva_rate),
          line.tva_rate
        ),
      0
    );
    const totalTTC = vatLines.reduce(
      (sum, line) => sum + calculateTTC(line.amount_ht || 0, line.tva_rate),
      0
    );
    const targetTTC = Math.abs(amount);
    const isValid = Math.abs(totalTTC - targetTTC) < 0.02;
    return { totalHT, totalVAT, totalTTC, targetTTC, isValid };
  }, [vatLines, amount]);

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amt);

  useEffect(() => {
    if (open) {
      setSelectedCategory(null);
      setSelectedCategoryInfo(null);
      setTvaRate(20);
      setSearchQuery('');
      setCreateRule(true);
      setExistingRuleForLabel(null);
      setIsVentilationMode(false);
      setVatLines([
        { id: '1', description: '', amount_ht: 0, tva_rate: 10 },
        { id: '2', description: '', amount_ht: 0, tva_rate: 20 },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !label || rules.length === 0) return;
    const found = rules.find(
      r =>
        r.match_type === 'label_contains' &&
        r.match_value.toLowerCase() === label.toLowerCase()
    );
    setExistingRuleForLabel(
      found
        ? {
            id: found.id,
            default_category: found.default_category,
            organisation_id: found.organisation_id,
          }
        : null
    );
  }, [open, label, rules]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const matchFilter = (cat: PcgCategory) =>
      cat.label.toLowerCase().includes(query) ||
      cat.code.includes(query) ||
      cat.description?.toLowerCase().includes(query);
    const suggestedMatches = suggestedCategories.filter(matchFilter);
    const allMatches = ALL_PCG_CATEGORIES.filter(matchFilter);
    const seenCodes = new Set(suggestedMatches.map(c => c.code));
    return [
      ...suggestedMatches,
      ...allMatches.filter(c => !seenCodes.has(c.code)),
    ].slice(0, 12);
  }, [searchQuery, suggestedCategories]);

  const handleSelectCategory = useCallback((code: string) => {
    setSelectedCategory(code);
    setSelectedCategoryInfo(
      ALL_PCG_CATEGORIES.find(c => c.code === code) ?? null
    );
    setSearchQuery('');
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategory(null);
    setSelectedCategoryInfo(null);
  }, []);

  const onSubmit = (): void => {
    if (!selectedCategory) return;
    void handleSubmit({
      transactionId,
      existingRuleId,
      currentCategory,
      isModificationMode,
      label,
      selectedCategory,
      tvaRate,
      isVentilationMode,
      vatLines,
      ventilationTotals,
      htAmount,
      vatAmount,
      createRule,
      applyToExisting,
      hasReconciliationVAT,
      confirmApply,
      existingRuleForLabel,
      updateMatchingRule: (id, data) => updateMatchingRule(id, data),
      createMatchingRule: data => createMatchingRule(data),
      onSuccess,
      onClose: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        data-testid="modal-classify-pcg"
      >
        <DialogHeader
          className={cn(
            'px-6 py-4 border-b bg-gradient-to-r',
            isIncome
              ? 'from-emerald-50 to-green-50'
              : 'from-slate-50 to-blue-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl shadow-sm',
                  isIncome ? 'bg-emerald-100' : 'bg-blue-100'
                )}
              >
                <Receipt
                  className={cn(
                    'h-6 w-6',
                    isIncome ? 'text-emerald-600' : 'text-blue-600'
                  )}
                />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  {isIncome ? "Classifier l'entree" : 'Classifier la depense'}
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-0.5 max-w-md truncate">
                  {counterpartyName ?? label}
                </p>
              </div>
            </div>
            <div className="text-right bg-white rounded-xl px-4 py-2 shadow-sm border">
              <div
                className={cn(
                  'text-2xl font-bold',
                  isIncome ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {isIncome ? '+' : '-'}
                {formatAmount(Math.abs(amount))}
              </div>
              <div className="text-xs text-slate-500">Montant TTC</div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <SelectedCategoryDisplay
            selectedCategory={selectedCategory}
            selectedCategoryInfo={selectedCategoryInfo}
            currentCategory={currentCategory}
            currentCategoryInfo={currentCategoryInfo}
            onClear={handleClearCategory}
          />

          {!selectedCategory && (
            <CategorySearchPanel
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchResults={searchResults}
              popularCategories={popularCategories}
              isIncome={isIncome}
              transactionSide={transactionSide}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {selectedCategory && (
            <div className="space-y-5">
              {hasReconciliationVAT ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      TVA calculee automatiquement
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Depuis les factures/commandes rapprochees. Pas besoin de
                    saisir la TVA.
                  </p>
                </div>
              ) : (
                <VatSection
                  tvaRate={tvaRate}
                  onTvaRateChange={setTvaRate}
                  isVentilationMode={isVentilationMode}
                  onVentilationModeChange={setIsVentilationMode}
                  vatLines={vatLines}
                  onVatLinesChange={setVatLines}
                  htAmount={htAmount}
                  vatAmount={vatAmount}
                  amount={amount}
                  ventilationTotals={ventilationTotals}
                  currentVatSource={currentVatSource}
                  formatAmount={formatAmount}
                />
              )}

              {!isModificationMode && (
                <RuleCreationSection
                  label={label}
                  createRule={createRule}
                  onCreateRuleChange={setCreateRule}
                  applyToExisting={applyToExisting}
                  onApplyToExistingChange={setApplyToExisting}
                  transactionCount={transactionCount}
                  hasConfirmApply={Boolean(confirmApply)}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t bg-slate-50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-600"
          >
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!selectedCategory || isSubmitting}
            className="min-w-[160px] gap-2 h-12 text-base"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : isModificationMode ? (
              <>
                <Check className="h-5 w-5" />
                Modifier la categorie
              </>
            ) : createRule ? (
              <>
                <Zap className="h-5 w-5" />
                Classifier + Regle
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Classifier
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { createClient } from '@verone/utils/supabase/client';
import { Check, Loader2, Receipt, Zap } from 'lucide-react';
import { toast } from 'sonner';

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
}: QuickClassificationModalProps) {
  // Hooks
  const {
    rules,
    create: createMatchingRule,
    update: updateMatchingRule,
  } = useMatchingRules();

  // Mode modification: masquer la section creation de regle
  const isModificationMode = Boolean(existingRuleId ?? currentCategory);

  // State - Categorie
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<PcgCategory | null>(null);

  // Info de la categorie actuelle (pour affichage comparaison)
  const currentCategoryInfo = useMemo(() => {
    if (!currentCategory) return null;
    return ALL_PCG_CATEGORIES.find(c => c.code === currentCategory) ?? null;
  }, [currentCategory]);

  // Categories populaires selon le type de transaction
  const popularCategories = useMemo(
    () =>
      transactionSide === 'credit'
        ? POPULAR_INCOME_CATEGORIES
        : POPULAR_CATEGORIES,
    [transactionSide]
  );

  // Categories PCG suggerees pour la recherche selon le side
  const suggestedCategories = useMemo(
    () =>
      transactionSide === 'credit'
        ? PCG_SUGGESTED_INCOME_CATEGORIES
        : PCG_SUGGESTED_CATEGORIES,
    [transactionSide]
  );

  // Libelles pour l'UI selon le type de transaction
  const isIncome = transactionSide === 'credit';

  // Initialiser TVA avec les donnees existantes (Qonto OCR ou manuel)
  const initialVatRate =
    currentVatRate !== null &&
    currentVatRate !== undefined &&
    [0, 5.5, 10, 20].includes(currentVatRate)
      ? (currentVatRate as TvaRate)
      : 20;
  const [tvaRate, setTvaRate] = useState<TvaRate>(initialVatRate);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createRule, setCreateRule] = useState(true);

  // State - Regle existante (pour eviter les doublons)
  const [existingRuleForLabel, setExistingRuleForLabel] = useState<{
    id: string;
    default_category: string | null;
    organisation_id: string | null;
  } | null>(null);

  // State - Appliquer aux transactions existantes (si confirmApply fourni)
  const [applyToExisting, setApplyToExisting] = useState(true);

  // State - Ventilation TVA multi-taux
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

  // Calculs TVA
  const htAmount = useMemo(
    () => calculateHT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );
  const vatAmount = useMemo(
    () => calculateVAT(Math.abs(amount), tvaRate),
    [amount, tvaRate]
  );

  // Calculs ventilation TVA
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
    const isValid = Math.abs(totalTTC - targetTTC) < 0.02; // Tolerance 2 centimes
    return { totalHT, totalVAT, totalTTC, targetTTC, isValid };
  }, [vatLines, amount]);

  // Format currency
  const formatAmount = (amt: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amt);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedCategory(null);
      setSelectedCategoryInfo(null);
      setTvaRate(20);
      setSearchQuery('');
      setCreateRule(true);
      setExistingRuleForLabel(null);
      // Reset ventilation
      setIsVentilationMode(false);
      setVatLines([
        { id: '1', description: '', amount_ht: 0, tva_rate: 10 },
        { id: '2', description: '', amount_ht: 0, tva_rate: 20 },
      ]);
    }
  }, [open]);

  // Detecter les regles existantes pour ce label
  useEffect(() => {
    if (!open || !label || rules.length === 0) return;

    // Chercher regle existante avec le label exact (insensible a la casse)
    const found = rules.find(
      r =>
        r.match_type === 'label_contains' &&
        r.match_value.toLowerCase() === label.toLowerCase()
    );

    if (found) {
      setExistingRuleForLabel({
        id: found.id,
        default_category: found.default_category,
        organisation_id: found.organisation_id,
      });
    } else {
      setExistingRuleForLabel(null);
    }
  }, [open, label, rules]);

  // Recherche dans les categories PCG - priorise les categories du bon side
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const matchFilter = (cat: PcgCategory) =>
      cat.label.toLowerCase().includes(query) ||
      cat.code.includes(query) ||
      cat.description?.toLowerCase().includes(query);

    // D'abord chercher dans les categories suggerees pour ce side
    const suggestedMatches = suggestedCategories.filter(matchFilter);
    // Puis dans toutes les categories si besoin
    const allMatches = ALL_PCG_CATEGORIES.filter(matchFilter);
    // Dedupliquer et prioriser les suggerees
    const seenCodes = new Set(suggestedMatches.map(c => c.code));
    const otherMatches = allMatches.filter(c => !seenCodes.has(c.code));

    return [...suggestedMatches, ...otherMatches].slice(0, 12);
  }, [searchQuery, suggestedCategories]);

  // Selectionner une categorie
  const handleSelectCategory = useCallback((code: string) => {
    setSelectedCategory(code);
    const info = ALL_PCG_CATEGORIES.find(c => c.code === code);
    setSelectedCategoryInfo(info ?? null);
    setSearchQuery('');
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategory(null);
    setSelectedCategoryInfo(null);
  }, []);

  // Soumettre
  const handleSubmit = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Mettre a jour la transaction
      if (transactionId) {
        // Preparer les donnees selon le mode (simple ou ventile)
        const updateData: Record<string, unknown> = isVentilationMode
          ? {
              category_pcg: selectedCategory,
              vat_rate: null, // NULL quand ventile
              vat_breakdown: vatLines
                .filter(l => l.amount_ht > 0)
                .map(l => ({
                  description: l.description || `Ligne ${l.tva_rate}%`,
                  amount_ht: l.amount_ht,
                  tva_rate: l.tva_rate,
                  tva_amount: calculateVAT(
                    calculateTTC(l.amount_ht, l.tva_rate),
                    l.tva_rate
                  ),
                })),
              amount_ht: ventilationTotals.totalHT,
              amount_vat: ventilationTotals.totalVAT,
              matching_status: 'manual_matched',
            }
          : {
              category_pcg: selectedCategory,
              vat_rate: tvaRate,
              vat_breakdown: null, // NULL quand taux unique
              amount_ht: htAmount,
              amount_vat: vatAmount,
              matching_status: 'manual_matched',
            };

        const { error: updateError } = await supabase
          .from('bank_transactions')
          .update(updateData)
          .eq('id', transactionId);

        // Gestion d'erreur avec feedback utilisateur
        if (updateError) {
          console.error(
            '[QuickClassificationModal] Update failed:',
            updateError
          );
          toast.error(`Erreur: ${updateError.message}`);
          setIsSubmitting(false);
          return; // Ne pas fermer le modal si erreur
        }
      }

      // 2. Mode modification: mettre a jour la regle existante si la categorie a change
      if (existingRuleId && selectedCategory !== currentCategory) {
        await updateMatchingRule(existingRuleId, {
          default_category: selectedCategory,
          default_vat_rate: isVentilationMode ? null : tvaRate,
        });
      }
      // 3. Mode creation: creer ou mettre a jour la regle automatique (categorie + TVA)
      // Note: L'organisation est geree via OrganisationLinkingModal (page Regles -> "Lier")
      else if (!isModificationMode && createRule && label) {
        let ruleIdForApply: string | null = null;
        const ruleVatRate = isVentilationMode ? null : tvaRate;

        if (existingRuleForLabel) {
          // UPDATE regle existante avec categorie + TVA
          await updateMatchingRule(existingRuleForLabel.id, {
            default_category: selectedCategory,
            default_vat_rate: ruleVatRate,
          });
          ruleIdForApply = existingRuleForLabel.id;
        } else {
          // CREATE nouvelle regle (categorie + TVA)
          const newRule = await createMatchingRule({
            match_type: 'label_contains',
            match_value: label,
            display_label: label,
            organisation_id: null,
            counterparty_type: null,
            default_category: selectedCategory,
            default_vat_rate: ruleVatRate,
            default_role_type: 'supplier',
            priority: 100,
          });
          ruleIdForApply = newRule?.id ?? null;
        }

        // 4. Appliquer aux transactions existantes si demande
        if (applyToExisting && confirmApply && ruleIdForApply) {
          await confirmApply(ruleIdForApply, [label]);
        }
      }
      // 4. Mode sans regle: classifier directement toutes les transactions avec ce label
      // Utilise quand l'utilisateur decoche "Creer une regle automatique"
      else if (!isModificationMode && !createRule && label && !transactionId) {
        // Mise a jour directe de toutes les transactions avec ce label
        const updateData: Record<string, unknown> = isVentilationMode
          ? {
              category_pcg: selectedCategory,
              vat_rate: null,
              vat_breakdown: vatLines
                .filter(l => l.amount_ht > 0)
                .map(l => ({
                  description: l.description || `Ligne ${l.tva_rate}%`,
                  amount_ht: l.amount_ht,
                  tva_rate: l.tva_rate,
                  tva_amount: calculateVAT(
                    calculateTTC(l.amount_ht, l.tva_rate),
                    l.tva_rate
                  ),
                })),
              matching_status: 'manual_matched',
            }
          : {
              category_pcg: selectedCategory,
              vat_rate: tvaRate,
              vat_breakdown: null,
              matching_status: 'manual_matched',
            };

        // Mettre a jour toutes les transactions avec ce label (insensible a la casse)
        const { error: bulkUpdateError } = await supabase
          .from('bank_transactions')
          .update(updateData)
          .ilike('label', label);

        if (bulkUpdateError) {
          console.error(
            '[QuickClassificationModal] Bulk update failed:',
            bulkUpdateError
          );
          toast.error(`Erreur: ${bulkUpdateError.message}`);
          setIsSubmitting(false);
          return;
        }

        toast.success(
          `Transactions classifiees avec la categorie ${selectedCategory}`
        );
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[QuickClassificationModal] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        data-testid="modal-classify-pcg"
      >
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <SelectedCategoryDisplay
            selectedCategory={selectedCategory}
            selectedCategoryInfo={selectedCategoryInfo}
            currentCategory={currentCategory}
            currentCategoryInfo={currentCategoryInfo}
            onClear={handleClearCategory}
          />

          {/* Recherche */}
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

          {/* TVA - affiche apres selection de categorie */}
          {selectedCategory && (
            <div className="space-y-5">
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

              {/* Creer regle automatique - MASQUE en mode modification */}
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

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t bg-slate-50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-600"
          >
            Annuler
          </Button>
          <Button
            onClick={() => void handleSubmit()}
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

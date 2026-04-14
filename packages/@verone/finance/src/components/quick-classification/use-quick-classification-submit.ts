'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import { calculateTTC, calculateVAT, type TvaRate } from '../../lib/tva';
import type { VatLine } from './types';

interface ISubmitParams {
  transactionId?: string;
  existingRuleId?: string;
  currentCategory?: string;
  isModificationMode: boolean;
  label: string;
  selectedCategory: string;
  tvaRate: TvaRate;
  isVentilationMode: boolean;
  vatLines: VatLine[];
  ventilationTotals: {
    totalHT: number;
    totalVAT: number;
    isValid: boolean;
  };
  htAmount: number;
  vatAmount: number;
  createRule: boolean;
  applyToExisting: boolean;
  hasReconciliationVAT: boolean;
  confirmApply?: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<{ nb_updated: number; updated_ids: string[] }>;
  existingRuleForLabel: {
    id: string;
    default_category: string | null;
    organisation_id: string | null;
  } | null;
  updateMatchingRule: (
    id: string,
    data: { default_category?: string; default_vat_rate?: number | null }
  ) => Promise<unknown>;
  createMatchingRule: (data: {
    match_type: 'label_contains' | 'label_exact';
    match_value: string;
    display_label: string;
    organisation_id: string | null;
    counterparty_type: 'organisation' | 'individual' | null;
    default_category: string;
    default_vat_rate: number | null;
    default_role_type: 'supplier' | 'customer' | 'partner' | 'internal';
    priority: number;
  }) => Promise<{ id: string } | null>;
  onSuccess?: () => void;
  onClose: () => void;
}

export function useQuickClassificationSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (params: ISubmitParams): Promise<void> => {
      if (!params.selectedCategory) return;

      setIsSubmitting(true);
      try {
        const supabase = createClient();

        // 1. Mettre a jour la transaction
        if (params.transactionId) {
          const updateData: Record<string, unknown> =
            params.hasReconciliationVAT
              ? {
                  category_pcg: params.selectedCategory,
                  matching_status: 'manual_matched',
                }
              : params.isVentilationMode
                ? {
                    category_pcg: params.selectedCategory,
                    vat_rate: null,
                    vat_breakdown: params.vatLines
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
                    amount_ht: params.ventilationTotals.totalHT,
                    amount_vat: params.ventilationTotals.totalVAT,
                    matching_status: 'manual_matched',
                  }
                : {
                    category_pcg: params.selectedCategory,
                    vat_rate: params.tvaRate,
                    vat_breakdown: null,
                    amount_ht: params.htAmount,
                    amount_vat: params.vatAmount,
                    matching_status: 'manual_matched',
                  };

          const { error: updateError } = await supabase
            .from('bank_transactions')
            .update(updateData)
            .eq('id', params.transactionId);

          if (updateError) {
            console.error(
              '[QuickClassificationModal] Update failed:',
              updateError
            );
            toast.error(`Erreur: ${updateError.message}`);
            return;
          }
        }

        const ruleVatRate = params.isVentilationMode ? null : params.tvaRate;

        // 2. Mode modification: mettre a jour la regle existante si la categorie a change
        if (
          params.existingRuleId &&
          params.selectedCategory !== params.currentCategory
        ) {
          await params.updateMatchingRule(params.existingRuleId, {
            default_category: params.selectedCategory,
            default_vat_rate: ruleVatRate,
          });
        }
        // 3. Mode creation: creer ou mettre a jour la regle automatique
        else if (
          !params.isModificationMode &&
          params.createRule &&
          params.label
        ) {
          let ruleIdForApply: string | null = null;

          if (params.existingRuleForLabel) {
            await params.updateMatchingRule(params.existingRuleForLabel.id, {
              default_category: params.selectedCategory,
              default_vat_rate: ruleVatRate,
            });
            ruleIdForApply = params.existingRuleForLabel.id;
          } else {
            const newRule = await params.createMatchingRule({
              match_type: 'label_contains',
              match_value: params.label,
              display_label: params.label,
              organisation_id: null,
              counterparty_type: null,
              default_category: params.selectedCategory,
              default_vat_rate: ruleVatRate,
              default_role_type: 'supplier',
              priority: 100,
            });
            ruleIdForApply = newRule?.id ?? null;
          }

          if (params.applyToExisting && params.confirmApply && ruleIdForApply) {
            await params.confirmApply(ruleIdForApply, [params.label]);
          }
        }
        // 4. Mode sans regle: classifier directement
        else if (
          !params.isModificationMode &&
          !params.createRule &&
          params.label &&
          !params.transactionId
        ) {
          const updateData: Record<string, unknown> = params.isVentilationMode
            ? {
                category_pcg: params.selectedCategory,
                vat_rate: null,
                vat_breakdown: params.vatLines
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
                category_pcg: params.selectedCategory,
                vat_rate: params.tvaRate,
                vat_breakdown: null,
                matching_status: 'manual_matched',
              };

          const { error: bulkUpdateError } = await supabase
            .from('bank_transactions')
            .update(updateData)
            .ilike('label', params.label);

          if (bulkUpdateError) {
            console.error(
              '[QuickClassificationModal] Bulk update failed:',
              bulkUpdateError
            );
            toast.error(`Erreur: ${bulkUpdateError.message}`);
            return;
          }

          toast.success(
            `Transactions classifiees avec la categorie ${params.selectedCategory}`
          );
        }

        params.onSuccess?.();
        params.onClose();
      } catch (err) {
        console.error('[QuickClassificationModal] Submit error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { isSubmitting, handleSubmit };
}

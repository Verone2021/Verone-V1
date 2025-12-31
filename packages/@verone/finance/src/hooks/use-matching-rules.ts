/**
 * Hook pour la gestion des règles de matching
 *
 * Permet de créer, modifier, supprimer et appliquer des règles
 * qui classifient automatiquement les dépenses.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface MatchingRule {
  id: string;
  priority: number;
  enabled: boolean;
  match_type: 'label_contains' | 'label_exact';
  match_value: string;
  display_label: string | null;
  organisation_id: string | null;
  individual_customer_id: string | null;
  counterparty_type: 'organisation' | 'individual' | null;
  default_category: string | null;
  default_role_type: 'supplier' | 'customer' | 'partner' | 'internal' | null;
  created_at: string;
  created_by: string | null;
  // Joined from organisation
  organisation_name: string | null;
  organisation_type: string | null;
  // Computed
  matched_expenses_count: number;
}

/**
 * Résultat de la prévisualisation d'application de règle
 * Retourné par preview_apply_matching_rule
 */
export interface PreviewMatchResult {
  normalized_label_group: string;
  sample_labels: string[];
  transaction_count: number;
  total_amount: number;
  first_seen: string;
  last_seen: string;
  counterparty_hint: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  reasons: string[];
  sample_transaction_ids: string[];
  /** Nombre de transactions déjà appliquées avec la bonne catégorie */
  already_applied_count: number;
  /** Nombre de transactions à appliquer ou mettre à jour */
  pending_count: number;
}

/**
 * Résultat de confirmation d'application de règle
 */
export interface ConfirmApplyResult {
  nb_updated: number;
  updated_ids: string[];
}

export interface CreateRuleData {
  match_type: 'label_contains' | 'label_exact';
  match_value: string;
  display_label?: string;
  /** Organisation liée (facultatif) */
  organisation_id?: string | null;
  /** Client particulier lié (facultatif - pour B2C) */
  individual_customer_id?: string | null;
  /** Type de contrepartie: 'organisation' ou 'individual' */
  counterparty_type?: 'organisation' | 'individual' | null;
  /** Catégorie PCG (facultatif - peut être défini plus tard) */
  default_category?: string | null;
  default_role_type: 'supplier' | 'customer' | 'partner' | 'internal';
  priority?: number;
}

export interface UseMatchingRulesReturn {
  rules: MatchingRule[];
  isLoading: boolean;
  error: string | null;
  create: (data: CreateRuleData) => Promise<MatchingRule | null>;
  update: (
    id: string,
    data: Partial<CreateRuleData & { enabled: boolean }>
  ) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  applyAll: () => Promise<{ rulesApplied: number; expensesClassified: number }>;
  /** @deprecated Use previewApply + confirmApply instead */
  applyOne: (ruleId: string) => Promise<number>;
  /** Preview which transactions will be affected - READ ONLY */
  previewApply: (ruleId: string) => Promise<PreviewMatchResult[]>;
  /** Confirm application with selected normalized labels */
  confirmApply: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<ConfirmApplyResult>;
  refetch: () => Promise<void>;
}

export function useMatchingRules(): UseMatchingRulesReturn {
  const [rules, setRules] = useState<MatchingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Query la vue v_matching_rules_with_org
      const { data, error: fetchError } = await (
        supabase as { from: CallableFunction }
      )
        .from('v_matching_rules_with_org')
        .select('*')
        .order('priority', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setRules((data || []) as MatchingRule[]);
    } catch (err) {
      console.error('[useMatchingRules] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(
    async (data: CreateRuleData): Promise<MatchingRule | null> => {
      try {
        const supabase = createClient();

        // 1. Vérifier si une règle existe déjà avec le même match_type/match_value
        const { data: existingRule } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .select('id')
          .eq('match_type', data.match_type)
          .eq('match_value', data.match_value)
          .maybeSingle();

        const ruleData = {
          display_label: data.display_label ?? data.match_value,
          organisation_id: data.organisation_id ?? null,
          individual_customer_id: data.individual_customer_id ?? null,
          counterparty_type: data.counterparty_type ?? null,
          default_category: data.default_category ?? null,
          default_role_type: data.default_role_type,
          priority: data.priority ?? 100,
          enabled: true,
        };

        if (existingRule) {
          // 2. UPDATE si la règle existe déjà
          const { data: updatedRule, error: updateError } = await (
            supabase as { from: CallableFunction }
          )
            .from('matching_rules')
            .update(ruleData)
            .eq('id', existingRule.id)
            .select()
            .single();

          if (updateError) {
            throw new Error(updateError.message);
          }

          // Rafraîchir la liste
          await fetchRules();

          return updatedRule as MatchingRule;
        }

        // 3. INSERT si la règle n'existe pas
        const { data: newRule, error: createError } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .insert({
            match_type: data.match_type,
            match_value: data.match_value,
            ...ruleData,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        // Rafraîchir la liste
        await fetchRules();

        return newRule as MatchingRule;
      } catch (err) {
        console.error('[useMatchingRules] Create error:', err);
        throw err;
      }
    },
    [fetchRules]
  );

  const update = useCallback(
    async (
      id: string,
      data: Partial<CreateRuleData & { enabled: boolean }>
    ): Promise<boolean> => {
      try {
        const supabase = createClient();

        const { data: updated, error: updateError } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        if (!updated) {
          throw new Error(
            'Impossible de modifier cette règle. Permissions insuffisantes.'
          );
        }

        // Rafraîchir la liste
        await fetchRules();

        return true;
      } catch (err) {
        console.error('[useMatchingRules] Update error:', err);
        throw err;
      }
    },
    [fetchRules]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const supabase = createClient();

        const { error: deleteError } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // Rafraîchir la liste
        await fetchRules();

        return true;
      } catch (err) {
        console.error('[useMatchingRules] Delete error:', err);
        throw err;
      }
    },
    [fetchRules]
  );

  const applyAll = useCallback(async (): Promise<{
    rulesApplied: number;
    expensesClassified: number;
  }> => {
    try {
      const supabase = createClient();

      // Appeler la RPC apply_all_matching_rules
      const { data, error: rpcError } = await (
        supabase.rpc as CallableFunction
      )('apply_all_matching_rules');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // La fonction retourne un tableau avec une seule ligne
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;

      return {
        rulesApplied: result?.rules_applied || 0,
        expensesClassified: result?.expenses_classified || 0,
      };
    } catch (err) {
      console.error('[useMatchingRules] ApplyAll error:', err);
      throw err;
    }
  }, []);

  /**
   * @deprecated Use previewApply + confirmApply instead
   */
  const applyOne = useCallback(async (ruleId: string): Promise<number> => {
    console.warn(
      '[useMatchingRules] applyOne is deprecated. Use previewApply + confirmApply instead.'
    );
    // L'ancienne RPC a été supprimée - cette méthode ne fonctionne plus
    throw new Error(
      'applyOne is deprecated. Use previewApply + confirmApply workflow.'
    );
  }, []);

  /**
   * Prévisualise les transactions qui seront affectées par l'application de la règle
   * NE MODIFIE RIEN - Lecture seule
   */
  const previewApply = useCallback(
    async (ruleId: string): Promise<PreviewMatchResult[]> => {
      try {
        const supabase = createClient();

        const { data, error: rpcError } = await (
          supabase.rpc as CallableFunction
        )('preview_apply_matching_rule', { p_rule_id: ruleId });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        return (data || []) as PreviewMatchResult[];
      } catch (err) {
        console.error('[useMatchingRules] previewApply error:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Confirme l'application de la règle avec les labels normalisés sélectionnés
   * SEULE PORTE D'ENTRÉE pour modifier les transactions
   */
  const confirmApply = useCallback(
    async (
      ruleId: string,
      selectedNormalizedLabels: string[]
    ): Promise<ConfirmApplyResult> => {
      try {
        const supabase = createClient();

        const { data, error: rpcError } = await (
          supabase.rpc as CallableFunction
        )('apply_matching_rule_confirm', {
          p_rule_id: ruleId,
          p_selected_normalized_labels: selectedNormalizedLabels,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        // La fonction retourne un tableau avec une seule ligne
        const result = Array.isArray(data) && data.length > 0 ? data[0] : data;

        return {
          nb_updated: result?.nb_updated || 0,
          updated_ids: result?.updated_ids || [],
        };
      } catch (err) {
        console.error('[useMatchingRules] confirmApply error:', err);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    isLoading,
    error,
    create,
    update,
    remove,
    applyAll,
    applyOne,
    previewApply,
    confirmApply,
    refetch: fetchRules,
  };
}

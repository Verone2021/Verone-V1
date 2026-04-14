/**
 * Hook pour la gestion des règles de matching
 *
 * Permet de créer, modifier, supprimer et appliquer des règles
 * qui classifient automatiquement les dépenses.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export type {
  VatBreakdownItem,
  MatchingRule,
  PreviewMatchResult,
  ConfirmApplyResult,
  CreateRuleData,
  UseMatchingRulesReturn,
} from './matching-rules-types';
import type {
  MatchingRule,
  CreateRuleData,
  ConfirmApplyResult,
  PreviewMatchResult,
  UseMatchingRulesReturn,
} from './matching-rules-types';

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
        .select(
          'id, priority, enabled, match_type, match_value, match_patterns, display_label, organisation_id, individual_customer_id, counterparty_type, default_category, default_role_type, allow_multiple_categories, justification_optional, default_vat_rate, created_at, created_by, organisation_name, organisation_type, matched_expenses_count'
        )
        .order('priority', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setRules((data ?? []) as MatchingRule[]);
    } catch (err) {
      console.error('[useMatchingRules] Error:', err);
      // Message plus explicite pour les erreurs réseau
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Impossible de contacter le serveur. Vérifiez votre connexion.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
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
          allow_multiple_categories: data.allow_multiple_categories ?? false,
          justification_optional: data.justification_optional ?? false,
          default_vat_rate: data.default_vat_rate ?? null,
          // Multi-patterns: si non fourni, utiliser [match_value]
          match_patterns: data.match_patterns ?? [data.match_value],
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
            .select('id')
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
          .select('id')
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

        // FIX: Nettoyer les données (undefined → null pour Supabase)
        // Supabase ignore les champs undefined, donc on doit les convertir en null
        const cleanData: Record<string, unknown> = {};

        console.warn('[useMatchingRules] update() called with:', { id, data });

        if (data.display_label !== undefined)
          cleanData.display_label = data.display_label ?? null;
        if (data.organisation_id !== undefined)
          cleanData.organisation_id = data.organisation_id ?? null;
        if (data.individual_customer_id !== undefined)
          cleanData.individual_customer_id =
            data.individual_customer_id ?? null;
        if (data.counterparty_type !== undefined)
          cleanData.counterparty_type = data.counterparty_type ?? null;
        if (data.default_category !== undefined)
          cleanData.default_category = data.default_category ?? null;
        if (data.default_role_type !== undefined)
          cleanData.default_role_type = data.default_role_type ?? null;
        if (data.priority !== undefined)
          cleanData.priority = data.priority ?? 100;
        if (data.allow_multiple_categories !== undefined)
          cleanData.allow_multiple_categories =
            data.allow_multiple_categories ?? false;
        if (data.justification_optional !== undefined)
          cleanData.justification_optional =
            data.justification_optional ?? false;
        if (data.enabled !== undefined) cleanData.enabled = data.enabled;
        if (data.match_type !== undefined)
          cleanData.match_type = data.match_type;
        if (data.match_value !== undefined)
          cleanData.match_value = data.match_value;
        if (data.default_vat_rate !== undefined)
          cleanData.default_vat_rate = data.default_vat_rate ?? null;
        if (data.match_patterns !== undefined)
          cleanData.match_patterns = data.match_patterns ?? null;

        console.warn('[useMatchingRules] cleanData to send:', cleanData);

        const { data: updated, error: updateError } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .update(cleanData)
          .eq('id', id)
          .select('id')
          .single();

        console.warn('[useMatchingRules] update response:', {
          updated,
          updateError,
        });

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
        rulesApplied:
          ((result as Record<string, unknown>)?.rules_applied as number) ?? 0,
        expensesClassified:
          ((result as Record<string, unknown>)
            ?.expenses_classified as number) ?? 0,
      };
    } catch (err) {
      console.error('[useMatchingRules] ApplyAll error:', err);
      throw err;
    }
  }, []);

  /**
   * @deprecated Use previewApply + confirmApply instead
   */
  const applyOne = useCallback(async (_ruleId: string): Promise<number> => {
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
   * @param ruleId - ID de la règle
   * @param newCategory - Optionnel: nouvelle catégorie pour simuler avant sauvegarde
   */
  const previewApply = useCallback(
    async (
      ruleId: string,
      newCategory?: string
    ): Promise<PreviewMatchResult[]> => {
      try {
        const supabase = createClient();

        const { data, error: rpcError } = await (
          supabase.rpc as CallableFunction
        )('preview_apply_matching_rule', {
          p_rule_id: ruleId,
          p_new_category: newCategory ?? null,
          // TVA retirée des règles
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        return (data ?? []) as PreviewMatchResult[];
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
          nb_updated:
            ((result as Record<string, unknown>)?.nb_updated as number) ?? 0,
          updated_ids:
            ((result as Record<string, unknown>)?.updated_ids as string[]) ??
            [],
        };
      } catch (err) {
        console.error('[useMatchingRules] confirmApply error:', err);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  /**
   * Applique automatiquement toutes les règles actives aux transactions non classées.
   * Utile pour rattraper les transactions qui n'ont pas été classées automatiquement.
   * @returns Le nombre de transactions classées
   */
  const autoClassifyAll = useCallback(async (): Promise<number> => {
    try {
      const supabase = createClient();

      const { data, error: rpcError } = await supabase.rpc(
        'auto_classify_all_unmatched'
      );

      if (rpcError) {
        console.error('[useMatchingRules] autoClassifyAll error:', rpcError);
        throw new Error(rpcError.message);
      }

      const result = data as {
        success: boolean;
        classified_count: number;
        message: string;
      };

      console.warn('[useMatchingRules] autoClassifyAll result:', result);

      return result.classified_count;
    } catch (err) {
      console.error('[useMatchingRules] autoClassifyAll error:', err);
      throw err;
    }
  }, []);

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
    autoClassifyAll,
    refetch: fetchRules,
  };
}

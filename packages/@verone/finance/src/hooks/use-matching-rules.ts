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

export interface CreateRuleData {
  match_type: 'label_contains' | 'label_exact';
  match_value: string;
  display_label?: string;
  /** Organisation liée (facultatif - seule la catégorie PCG est requise) */
  organisation_id?: string | null;
  default_category: string;
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
  applyOne: (ruleId: string) => Promise<number>;
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

        const { data: newRule, error: createError } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .insert({
            match_type: data.match_type,
            match_value: data.match_value,
            display_label: data.display_label || data.match_value,
            organisation_id: data.organisation_id,
            default_category: data.default_category,
            default_role_type: data.default_role_type,
            priority: data.priority || 100,
            enabled: true,
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

        const { error: updateError } = await (
          supabase as { from: CallableFunction }
        )
          .from('matching_rules')
          .update(data)
          .eq('id', id);

        if (updateError) {
          throw new Error(updateError.message);
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

  const applyOne = useCallback(async (ruleId: string): Promise<number> => {
    try {
      const supabase = createClient();

      // Appeler la RPC apply_matching_rule
      const { data, error: rpcError } = await (
        supabase.rpc as CallableFunction
      )('apply_matching_rule', { p_rule_id: ruleId });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      return data || 0;
    } catch (err) {
      console.error('[useMatchingRules] ApplyOne error:', err);
      throw err;
    }
  }, []);

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
    refetch: fetchRules,
  };
}

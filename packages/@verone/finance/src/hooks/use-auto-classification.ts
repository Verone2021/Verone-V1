/**
 * Hook pour l'auto-classification des transactions
 *
 * Applique automatiquement les règles de matching aux transactions
 * pour suggérer une organisation et une catégorie PCG.
 */

'use client';

import { useMemo } from 'react';

import { useMatchingRules, type MatchingRule } from './use-matching-rules';

/**
 * Transaction avec suggestions de classification
 */
export interface TransactionWithSuggestions<T> {
  original: T;
  suggestion: {
    /** Règle qui a matché */
    matchedRule: MatchingRule | null;
    /** Organisation suggérée */
    organisationId: string | null;
    organisationName: string | null;
    /** Catégorie PCG suggérée */
    category: string | null;
    /** Type de rôle suggéré */
    roleType: 'supplier' | 'customer' | 'partner' | 'internal' | null;
    /** Libellé d'affichage suggéré */
    displayLabel: string | null;
    /** Confiance de la suggestion (high si règle exacte, medium si contains) */
    confidence: 'high' | 'medium' | 'none';
  };
}

/**
 * Options pour le hook
 */
export interface UseAutoClassificationOptions {
  /** Champ à utiliser pour le matching (default: 'label') */
  labelField?: string;
  /** Activer/désactiver les suggestions */
  enabled?: boolean;
}

/**
 * Vérifie si un label correspond à une règle de matching
 */
function matchRule(
  label: string | null | undefined,
  rule: MatchingRule
): boolean {
  if (!label || !rule.enabled) return false;

  const normalizedLabel = label.toLowerCase().trim();
  const normalizedMatch = rule.match_value.toLowerCase().trim();

  if (rule.match_type === 'label_exact') {
    return normalizedLabel === normalizedMatch;
  }

  // label_contains
  return normalizedLabel.includes(normalizedMatch);
}

/**
 * Hook pour auto-classifier des transactions
 *
 * @param transactions - Liste des transactions à classifier
 * @param options - Options de configuration
 * @returns Transactions enrichies avec suggestions
 *
 * @example
 * ```tsx
 * const { transactionsWithSuggestions, isLoading } = useAutoClassification(
 *   bankTransactions,
 *   { labelField: 'label' }
 * );
 *
 * // Utiliser les suggestions
 * transactionsWithSuggestions.map(({ original, suggestion }) => (
 *   <div>
 *     {original.label}
 *     {suggestion.organisationName && (
 *       <Badge>{suggestion.organisationName}</Badge>
 *     )}
 *   </div>
 * ));
 * ```
 */
export function useAutoClassification<
  T extends Record<string, unknown> & { label?: string | null },
>(
  transactions: T[],
  options: UseAutoClassificationOptions = {}
): {
  transactionsWithSuggestions: TransactionWithSuggestions<T>[];
  isLoading: boolean;
  rulesCount: number;
} {
  const { labelField = 'label', enabled = true } = options;

  const { rules, isLoading } = useMatchingRules();

  const transactionsWithSuggestions = useMemo(() => {
    if (!enabled || !transactions.length) {
      return transactions.map(tx => ({
        original: tx,
        suggestion: {
          matchedRule: null,
          organisationId: null,
          organisationName: null,
          category: null,
          roleType: null,
          displayLabel: null,
          confidence: 'none' as const,
        },
      }));
    }

    // Trier les règles par priorité (plus bas = plus prioritaire)
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    return transactions.map(tx => {
      const label = tx[labelField] as string | null | undefined;

      // Chercher la première règle qui matche
      const matchedRule = sortedRules.find(rule => matchRule(label, rule));

      if (matchedRule) {
        return {
          original: tx,
          suggestion: {
            matchedRule,
            organisationId: matchedRule.organisation_id,
            organisationName: matchedRule.organisation_name,
            category: matchedRule.default_category,
            roleType: matchedRule.default_role_type,
            displayLabel: matchedRule.display_label,
            confidence:
              matchedRule.match_type === 'label_exact'
                ? ('high' as const)
                : ('medium' as const),
          },
        };
      }

      return {
        original: tx,
        suggestion: {
          matchedRule: null,
          organisationId: null,
          organisationName: null,
          category: null,
          roleType: null,
          displayLabel: null,
          confidence: 'none' as const,
        },
      };
    });
  }, [transactions, rules, labelField, enabled]);

  return {
    transactionsWithSuggestions,
    isLoading,
    rulesCount: rules.length,
  };
}

/**
 * Fonction utilitaire pour obtenir une suggestion pour un label
 * (version sans hook, pour utilisation dans des composants serveur)
 */
export function getSuggestionForLabel(
  label: string | null | undefined,
  rules: MatchingRule[]
): TransactionWithSuggestions<{ label: string | null }>['suggestion'] {
  if (!label) {
    return {
      matchedRule: null,
      organisationId: null,
      organisationName: null,
      category: null,
      roleType: null,
      displayLabel: null,
      confidence: 'none',
    };
  }

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  const matchedRule = sortedRules.find(rule => matchRule(label, rule));

  if (matchedRule) {
    return {
      matchedRule,
      organisationId: matchedRule.organisation_id,
      organisationName: matchedRule.organisation_name,
      category: matchedRule.default_category,
      roleType: matchedRule.default_role_type,
      displayLabel: matchedRule.display_label,
      confidence: matchedRule.match_type === 'label_exact' ? 'high' : 'medium',
    };
  }

  return {
    matchedRule: null,
    organisationId: null,
    organisationName: null,
    category: null,
    roleType: null,
    displayLabel: null,
    confidence: 'none',
  };
}

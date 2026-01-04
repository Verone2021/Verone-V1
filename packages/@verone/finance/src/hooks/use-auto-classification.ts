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
    /**
     * Type de match:
     * - 'exact': label normalisé = pattern normalisé (appliqué d'office - BLEU)
     * - 'similar': label contient pattern mais pas identique (suggéré - ORANGE)
     * - 'none': aucun match
     */
    matchType: 'exact' | 'similar' | 'none';
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
 * Normalise un label (version simplifiée côté client)
 * Doit correspondre à la fonction normalize_label SQL côté serveur
 */
function normalizeLabel(input: string | null | undefined): string {
  if (!input) return '';

  let result = input.toLowerCase();

  // Retirer les accents
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Ponctuation → espaces
  result = result.replace(/[^a-z0-9 ]/g, ' ');

  // Espaces multiples → 1 espace
  result = result.replace(/\s+/g, ' ');

  // Trim
  return result.trim();
}

/**
 * Vérifie si un label correspond à une règle de matching
 * Retourne le type de match: 'exact', 'similar', ou 'none'
 */
function getMatchType(
  label: string | null | undefined,
  rule: MatchingRule
): 'exact' | 'similar' | 'none' {
  if (!label || !rule.enabled) return 'none';

  const normalizedLabel = normalizeLabel(label);
  const normalizedMatch = normalizeLabel(rule.match_value);

  if (!normalizedLabel || !normalizedMatch) return 'none';

  // Match exact: label normalisé = pattern normalisé
  if (normalizedLabel === normalizedMatch) {
    return 'exact';
  }

  // Pour label_exact rules: pas de match similar
  if (rule.match_type === 'label_exact') {
    return 'none';
  }

  // Pour label_contains: match similar si label contient pattern
  if (normalizedLabel.includes(normalizedMatch)) {
    return 'similar';
  }

  return 'none';
}

/**
 * @deprecated Use getMatchType instead
 * Vérifie si un label correspond à une règle de matching (compatibilité)
 */
function matchRule(
  label: string | null | undefined,
  rule: MatchingRule
): boolean {
  return getMatchType(label, rule) !== 'none';
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
          matchType: 'none' as const,
        },
      }));
    }

    // Trier les règles par priorité (plus bas = plus prioritaire)
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    return transactions.map(tx => {
      const label = tx[labelField] as string | null | undefined;

      // Chercher la première règle qui matche et son type de match
      let bestMatchRule: MatchingRule | null = null;
      let bestMatchType: 'exact' | 'similar' | 'none' = 'none';

      for (const rule of sortedRules) {
        const matchType = getMatchType(label, rule);
        if (matchType === 'exact') {
          // Match exact trouvé - pas besoin de chercher plus
          bestMatchRule = rule;
          bestMatchType = 'exact';
          break;
        } else if (matchType === 'similar' && bestMatchType === 'none') {
          // Premier match similar - continuer à chercher un exact
          bestMatchRule = rule;
          bestMatchType = 'similar';
        }
      }

      if (bestMatchRule) {
        return {
          original: tx,
          suggestion: {
            matchedRule: bestMatchRule,
            organisationId: bestMatchRule.organisation_id,
            organisationName: bestMatchRule.organisation_name,
            category: bestMatchRule.default_category,
            roleType: bestMatchRule.default_role_type,
            displayLabel: bestMatchRule.display_label,
            confidence:
              bestMatchType === 'exact'
                ? ('high' as const)
                : ('medium' as const),
            matchType: bestMatchType,
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
          matchType: 'none' as const,
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
      matchType: 'none',
    };
  }

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  // Chercher le meilleur match
  let bestMatchRule: MatchingRule | null = null;
  let bestMatchType: 'exact' | 'similar' | 'none' = 'none';

  for (const rule of sortedRules) {
    const matchType = getMatchType(label, rule);
    if (matchType === 'exact') {
      bestMatchRule = rule;
      bestMatchType = 'exact';
      break;
    } else if (matchType === 'similar' && bestMatchType === 'none') {
      bestMatchRule = rule;
      bestMatchType = 'similar';
    }
  }

  if (bestMatchRule) {
    return {
      matchedRule: bestMatchRule,
      organisationId: bestMatchRule.organisation_id,
      organisationName: bestMatchRule.organisation_name,
      category: bestMatchRule.default_category,
      roleType: bestMatchRule.default_role_type,
      displayLabel: bestMatchRule.display_label,
      confidence: bestMatchType === 'exact' ? 'high' : 'medium',
      matchType: bestMatchType,
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
    matchType: 'none',
  };
}

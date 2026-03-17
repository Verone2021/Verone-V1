'use client';

/**
 * ⚠️ DEPRECATED : Use useUnifiedSampleEligibility instead
 *
 * @deprecated Ce hook vérifie uniquement stock_movements, ce qui crée une contradiction
 * avec use-sample-order.ts qui vérifie purchase_order_items. Utilisez plutôt
 * useUnifiedSampleEligibility qui vérifie LES DEUX conditions.
 *
 * @see src/hooks/use-unified-sample-eligibility.ts
 * @see docs/audits/2025-10/RAPPORT-AUDIT-ECHANTILLONS-MVP-2025-10-29.md
 *
 * Hook pour la règle business d'éligibilité aux échantillons
 *
 * RÈGLE BUSINESS PRINCIPALE :
 * Les échantillons ne sont autorisés QUE pour les produits qui n'ont JAMAIS eu d'entrée de stock
 */

import { useState, useCallback } from 'react';

import { hasProductBeenInStock } from '@verone/stock/utils';
import type {
  SampleEligibilityResult,
  SampleRestrictionReason,
  SampleValidationContext,
  BusinessRuleValidation,
} from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

export function useSampleEligibilityRule() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  /**
   * Vérifie l'éligibilité d'un produit aux échantillons
   */
  const checkSampleEligibility = useCallback(
    async (
      productId: string,
      _context?: Partial<SampleValidationContext>
    ): Promise<SampleEligibilityResult> => {
      setLoading(true);

      try {
        // 1. Vérifier l'historique du stock (règle principale)
        const hasStockHistory = await hasProductBeenInStock(productId);

        if (hasStockHistory) {
          // Récupérer les détails du premier mouvement pour le message
          const firstMovement = await getFirstStockMovement(productId);

          return {
            isEligible: false,
            reason: 'has_stock_history',
            message:
              'Les échantillons ne sont pas autorisés car ce produit a déjà eu des entrées de stock.',
            details: {
              firstStockMovementDate: firstMovement?.performed_at,
              totalMovements: firstMovement?.totalCount ?? 0,
            },
          };
        }

        // 2. Vérifier le stock actuel (sécurité supplémentaire)
        const currentStock = await getCurrentStock(productId);

        if (currentStock > 0) {
          return {
            isEligible: false,
            reason: 'already_in_stock',
            message:
              'Les échantillons ne sont pas autorisés car ce produit est actuellement en stock.',
            details: {
              currentStock,
            },
          };
        }

        // 3. Le produit est éligible aux échantillons
        return {
          isEligible: true,
          message: 'Ce produit est éligible pour les échantillons.',
        };
      } catch (error) {
        console.error(
          "❌ Erreur lors de la vérification d'éligibilité échantillon:",
          error
        );

        // En cas d'erreur, on refuse par sécurité
        return {
          isEligible: false,
          reason: 'technical_restriction',
          message:
            "Impossible de vérifier l'éligibilité aux échantillons. Veuillez réessayer.",
        };
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * Valide une tentative d'activation des échantillons
   */
  const validateSampleActivation = useCallback(
    async (
      productId: string,
      productName?: string
    ): Promise<BusinessRuleValidation> => {
      const eligibilityResult = await checkSampleEligibility(productId);

      if (!eligibilityResult.isEligible) {
        return {
          isValid: false,
          ruleName: 'sample_stock_history_restriction',
          errorMessage: `❌ ÉCHANTILLON REFUSÉ : ${eligibilityResult.message}`,
          context: {
            productId,
            productName,
            reason: eligibilityResult.reason,
            details: eligibilityResult.details,
          },
        };
      }

      return {
        isValid: true,
        ruleName: 'sample_stock_history_restriction',
        context: {
          productId,
          productName,
        },
      };
    },
    [checkSampleEligibility]
  );

  /**
   * Récupère le premier mouvement de stock pour les détails
   */
  const getFirstStockMovement = useCallback(
    async (productId: string) => {
      try {
        const { data, error, count } = await supabase
          .from('stock_movements')
          .select('performed_at', { count: 'exact' })
          .eq('product_id', productId)
          .eq('movement_type', 'IN')
          .order('performed_at', { ascending: true })
          .limit(1);

        if (error) throw error;

        return data?.[0]
          ? {
              ...data[0],
              totalCount: count ?? 0,
            }
          : null;
      } catch (error) {
        console.error('❌ Erreur récupération premier mouvement:', error);
        return null;
      }
    },
    [supabase]
  );

  /**
   * Récupère le stock actuel d'un produit
   */
  const getCurrentStock = useCallback(
    async (productId: string): Promise<number> => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('stock_real, stock_quantity')
          .eq('id', productId)
          .single();

        if (error) throw error;

        return data?.stock_real ?? data?.stock_quantity ?? 0;
      } catch (error) {
        console.error('❌ Erreur récupération stock actuel:', error);
        return 0;
      }
    },
    [supabase]
  );

  /**
   * Messages d'aide contextuels
   */
  const getHelpMessage = useCallback(
    (reason?: SampleRestrictionReason): string => {
      switch (reason) {
        case 'has_stock_history':
          return "💡 Cette restriction protège l'intégrité du catalogue. Les échantillons sont destinés aux nouveaux produits avant leur première mise en stock.";

        case 'already_in_stock':
          return "💡 Un produit déjà en stock ne nécessite plus d'échantillonnage car il a été validé.";

        case 'technical_restriction':
          return '⚠️ Problème technique lors de la vérification. Contactez le support si le problème persiste.';

        default:
          return '✅ Les échantillons permettent de valider un produit avant sa première mise en stock.';
      }
    },
    []
  );

  /**
   * Récupère un résumé détaillé pour l'interface
   */
  const getSampleEligibilitySummary = useCallback(
    async (productId: string) => {
      const result = await checkSampleEligibility(productId);
      const helpMessage = getHelpMessage(result.reason);

      return {
        ...result,
        helpMessage,
        canRequest: result.isEligible,
        uiState: result.isEligible ? 'enabled' : 'disabled',
      };
    },
    [checkSampleEligibility, getHelpMessage]
  );

  return {
    loading,
    checkSampleEligibility,
    validateSampleActivation,
    getSampleEligibilitySummary,
    getHelpMessage,
  };
}

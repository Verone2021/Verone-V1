/**
 * Hook Unifié : Vérification Éligibilité Échantillon
 *
 * RÉSOUT LA CONTRADICTION entre use-sample-order.ts et use-sample-eligibility-rule.ts
 *
 * Vérifie DEUX conditions en parallèle :
 * 1. Aucun purchase_order_items avec sample_type IS NULL (commandes normales)
 * 2. Aucun stock_movements historique
 *
 * Un produit est éligible échantillon SEULEMENT SI :
 * - Jamais commandé en stock normal (purchase_order_items.sample_type IS NULL)
 * - ET jamais eu de mouvements de stock (stock_movements)
 *
 * @see docs/audits/2025-10/RAPPORT-AUDIT-ECHANTILLONS-MVP-2025-10-29.md
 */

'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export interface UnifiedEligibilityResult {
  isEligible: boolean;
  reason:
    | 'ELIGIBLE'
    | 'HAS_PURCHASE_HISTORY'
    | 'HAS_STOCK_HISTORY'
    | 'BOTH_HISTORIES';
  message: string;
  blockedBy: {
    purchaseOrders: boolean;
    stockMovements: boolean;
  };
  details?: {
    purchaseOrderCount: number;
    stockMovementCount: number;
  };
}

export function useUnifiedSampleEligibility() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Vérifie l'éligibilité échantillon avec règle unifiée
   *
   * @param productId - ID du produit à vérifier
   * @returns Résultat détaillé avec diagnostic
   */
  const checkEligibility = async (
    productId: string
  ): Promise<UnifiedEligibilityResult> => {
    try {
      setLoading(true);
      setError(null);

      // Vérification PARALLÈLE des 2 conditions
      const [purchaseOrdersResult, stockMovementsResult] = await Promise.all([
        // Condition 1 : Purchase orders normaux (sample_type IS NULL)
        supabase
          .from('purchase_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId)
          .is('sample_type', null),

        // Condition 2 : Historique stock movements
        supabase
          .from('stock_movements')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId),
      ]);

      // Gestion erreurs Supabase
      if (purchaseOrdersResult.error) {
        throw new Error(
          `Erreur vérification purchase orders: ${purchaseOrdersResult.error.message}`
        );
      }

      if (stockMovementsResult.error) {
        throw new Error(
          `Erreur vérification stock movements: ${stockMovementsResult.error.message}`
        );
      }

      // Compteurs
      const purchaseOrderCount = purchaseOrdersResult.count ?? 0;
      const stockMovementCount = stockMovementsResult.count ?? 0;

      // Détermination blocages
      const hasPurchaseHistory = purchaseOrderCount > 0;
      const hasStockHistory = stockMovementCount > 0;

      // Éligibilité : AUCUN des deux historiques ne doit exister
      const isEligible = !hasPurchaseHistory && !hasStockHistory;

      // Raison et message selon scénario
      let reason: UnifiedEligibilityResult['reason'];
      let message: string;

      if (isEligible) {
        reason = 'ELIGIBLE';
        message = 'Produit éligible pour commande échantillon';
      } else if (hasPurchaseHistory && hasStockHistory) {
        reason = 'BOTH_HISTORIES';
        message = `Ce produit a déjà été commandé (${purchaseOrderCount} commande(s)) et a un historique de stock (${stockMovementCount} mouvement(s))`;
      } else if (hasPurchaseHistory) {
        reason = 'HAS_PURCHASE_HISTORY';
        message = `Ce produit a déjà été commandé ${purchaseOrderCount} fois en stock normal`;
      } else {
        reason = 'HAS_STOCK_HISTORY';
        message = `Ce produit a un historique de stock avec ${stockMovementCount} mouvement(s)`;
      }

      return {
        isEligible,
        reason,
        message,
        blockedBy: {
          purchaseOrders: hasPurchaseHistory,
          stockMovements: hasStockHistory,
        },
        details: {
          purchaseOrderCount,
          stockMovementCount,
        },
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur vérification éligibilité';
      setError(errorMessage);
      console.error('[useUnifiedSampleEligibility] Error:', err);

      // Retourne résultat d'erreur
      return {
        isEligible: false,
        reason: 'BOTH_HISTORIES',
        message: errorMessage,
        blockedBy: {
          purchaseOrders: false,
          stockMovements: false,
        },
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkEligibility,
    loading,
    error,
  };
}

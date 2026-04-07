'use client';

import { useMemo } from 'react';

import { calculateMatchScore } from './utils';
import type { SalesOrder, PurchaseOrder } from './types';

interface UseScoringParams {
  orders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  amount: number;
  transactionDate: string | undefined;
  organisationId?: string | null;
  counterpartyName?: string | null;
}

export function useRapprochementScoring({
  orders,
  purchaseOrders,
  amount,
  transactionDate,
  organisationId,
  counterpartyName,
}: UseScoringParams) {
  // Calculer les scores de matching pour les commandes
  const ordersWithScores = useMemo(() => {
    const result = orders
      .map(order => {
        const { score, reasons } = calculateMatchScore(
          amount,
          transactionDate,
          organisationId ?? undefined,
          order,
          counterpartyName
        );
        return {
          ...order,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // DEBUG: Log des scores calculés
    if (result.length > 0) {
      console.warn('[RapprochementModal] Scoring results:', {
        transactionAmount: amount,
        ordersCount: result.length,
        topMatches: result.slice(0, 3).map(o => ({
          order: o.order_number,
          ttc: o.total_ttc,
          score: o.matchScore,
          reasons: o.matchReasons,
        })),
      });
    }

    return result;
  }, [orders, amount, transactionDate, organisationId, counterpartyName]);

  // Top suggestions pour commandes clients (score >= 40)
  const suggestions = useMemo(() => {
    return ordersWithScores.filter(o => (o.matchScore || 0) >= 40).slice(0, 3);
  }, [ordersWithScores]);

  // Calculer les scores de matching pour les commandes fournisseurs
  const purchaseOrdersWithScores = useMemo(() => {
    const result = purchaseOrders
      .map(po => {
        const { score, reasons } = calculateMatchScore(
          amount,
          transactionDate,
          undefined, // Pas d'organisation liée pour les dépenses
          {
            total_ttc: po.total_ttc,
            created_at: po.created_at,
            organisation_id: po.supplier_id,
            customer_name: po.supplier_name,
          },
          counterpartyName
        );
        return {
          ...po,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return result;
  }, [purchaseOrders, amount, transactionDate, counterpartyName]);

  // Top suggestions pour commandes fournisseurs (score >= 40)
  const purchaseOrderSuggestions = useMemo(() => {
    return purchaseOrdersWithScores
      .filter(o => (o.matchScore || 0) >= 40)
      .slice(0, 3);
  }, [purchaseOrdersWithScores]);

  return {
    ordersWithScores,
    suggestions,
    purchaseOrdersWithScores,
    purchaseOrderSuggestions,
  };
}

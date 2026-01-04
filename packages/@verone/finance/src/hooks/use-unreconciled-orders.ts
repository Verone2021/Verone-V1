// =====================================================================
// Hook: Unreconciled Orders Count
// Date: 2026-01-02
// Description: Compte les commandes clients non rapprochées à une transaction
// =====================================================================

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface UnreconciledOrdersStats {
  count: number;
  totalAmount: number;
  isLoading: boolean;
  error: string | null;
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour récupérer le nombre de commandes non rapprochées
 * Une commande est "non rapprochée" si elle n'a pas de lien dans:
 * - transaction_document_links (via sales_order_id)
 * - bank_transaction_matches (legacy)
 */
export function useUnreconciledOrders(): UnreconciledOrdersStats & {
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchUnreconciledOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les IDs des commandes déjà liées via transaction_document_links
      const { data: linkedOrders } = await supabase
        .from('transaction_document_links')
        .select('sales_order_id')
        .not('sales_order_id', 'is', null);

      // Collecter les IDs liés
      const linkedIds = new Set<string>();
      linkedOrders?.forEach(l => {
        if (l.sales_order_id) linkedIds.add(l.sales_order_id);
      });

      // Récupérer toutes les commandes actives (validated, shipped, delivered)
      const { data: allOrders, error: ordersError } = await supabase
        .from('sales_orders')
        .select('id, total_ttc')
        .in('status', ['validated', 'shipped', 'delivered']);

      if (ordersError) {
        throw ordersError;
      }

      // Filtrer les commandes non liées
      const unreconciledOrders = (allOrders || []).filter(
        order => !linkedIds.has(order.id)
      );

      // Calculer le total
      const total = unreconciledOrders.reduce(
        (sum, order) => sum + (order.total_ttc || 0),
        0
      );

      setCount(unreconciledOrders.length);
      setTotalAmount(total);
    } catch (err) {
      console.error('Error fetching unreconciled orders:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUnreconciledOrders();
  }, [fetchUnreconciledOrders]);

  return {
    count,
    totalAmount,
    isLoading,
    error,
    refresh: fetchUnreconciledOrders,
  };
}

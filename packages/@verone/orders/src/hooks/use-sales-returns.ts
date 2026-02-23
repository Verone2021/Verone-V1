'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface ReturnableItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_shipped: number;
}

export interface ReturnMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_change: number;
  notes: string | null;
  performed_at: string;
}

export function useSalesReturns() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load order items that can be returned (quantity_shipped > 0)
   */
  const loadReturnableItems = useCallback(
    async (orderId: string): Promise<ReturnableItem[]> => {
      try {
        setLoading(true);
        setError(null);

        const { data: items, error: fetchError } = await supabase
          .from('sales_order_items')
          .select(
            `
            product_id,
            quantity_shipped,
            products (
              id,
              name,
              sku
            )
          `
          )
          .eq('sales_order_id', orderId)
          .gt('quantity_shipped', 0);

        if (fetchError) {
          console.error('Erreur chargement items retour:', fetchError);
          setError(fetchError.message);
          return [];
        }

        if (!items) return [];

        return items
          .filter(item => item.products && item.product_id)
          .map(item => {
            const product = item.products as unknown as {
              id: string;
              name: string;
              sku: string;
            };
            return {
              product_id: item.product_id!,
              product_name: product.name,
              product_sku: product.sku,
              quantity_shipped: item.quantity_shipped ?? 0,
            };
          });
      } catch (err) {
        console.error('Exception chargement items retour:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Submit return via server action
   */
  const submitReturn = useCallback(
    async (payload: {
      sales_order_id: string;
      items: Array<{ product_id: string; quantity_returned: number }>;
      reason: string;
      notes?: string;
    }): Promise<{
      success: boolean;
      error?: string;
      movements_created?: number;
    }> => {
      try {
        setSubmitting(true);
        setError(null);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return { success: false, error: 'Utilisateur non authentifié' };
        }

        // Dynamic import of server action
        const { processCustomerReturn } = await import(
          '../actions/sales-returns'
        );

        const result = await processCustomerReturn({
          ...payload,
          performed_by: user.id,
        });

        if (!result.success) {
          setError(result.error ?? 'Erreur inconnue');
        }

        return result;
      } catch (err) {
        console.error('Exception soumission retour:', err);
        const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setSubmitting(false);
      }
    },
    [supabase]
  );

  /**
   * Load return history for an order (stock_movements with reason_code='return_customer')
   */
  const loadReturnHistory = useCallback(
    async (orderId: string): Promise<ReturnMovement[]> => {
      try {
        const { data: movements, error: fetchError } = await supabase
          .from('stock_movements')
          .select(
            `
            id,
            product_id,
            quantity_change,
            notes,
            performed_at,
            products (name, sku)
          `
          )
          .eq('reference_type', 'sales_order')
          .eq('reference_id', orderId)
          .eq('reason_code', 'return_customer')
          .eq('movement_type', 'IN')
          .order('performed_at', { ascending: false });

        if (fetchError) {
          console.error('Erreur chargement historique retours:', fetchError);
          return [];
        }

        if (!movements) return [];

        return movements.map(m => {
          const product = m.products as unknown as {
            name: string;
            sku: string;
          };
          return {
            id: m.id,
            product_id: m.product_id,
            product_name: product?.name ?? 'Produit inconnu',
            product_sku: product?.sku ?? '-',
            quantity_change: m.quantity_change,
            notes: m.notes,
            performed_at: m.performed_at,
          };
        });
      } catch (err) {
        console.error('Exception chargement historique retours:', err);
        return [];
      }
    },
    [supabase]
  );

  return {
    loading,
    submitting,
    error,
    loadReturnableItems,
    submitReturn,
    loadReturnHistory,
  };
}

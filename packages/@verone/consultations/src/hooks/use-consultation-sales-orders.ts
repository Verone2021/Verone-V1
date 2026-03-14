'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

export interface LinkedSalesOrder {
  id: string;
  order_number: string;
  status: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  customer: {
    id: string;
    trade_name: string | null;
    legal_name: string;
  } | null;
}

export function useConsultationSalesOrders(consultationId?: string) {
  const [salesOrders, setSalesOrders] = useState<LinkedSalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesOrders = useCallback(async () => {
    if (!consultationId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          status,
          total_ht,
          total_ttc,
          created_at,
          customer:organisations!sales_orders_customer_id_fkey(
            id,
            trade_name,
            legal_name
          )
        `
        )
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const orders: LinkedSalesOrder[] = (data ?? []).map(row => ({
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        total_ht: row.total_ht ?? 0,
        total_ttc: row.total_ttc ?? 0,
        created_at: row.created_at,
        customer: row.customer as LinkedSalesOrder['customer'],
      }));

      setSalesOrders(orders);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur chargement commandes';
      setError(message);
      console.error('[useConsultationSalesOrders]', err);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    void fetchSalesOrders();
  }, [fetchSalesOrders]);

  return { salesOrders, loading, error, refetch: fetchSalesOrders };
}

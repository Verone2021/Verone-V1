'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import {
  deriveSampleState,
  type SampleOrderLine,
} from '../../utils/derive-sample-state';

export const SAMPLE_STATE_QUERY_KEY = 'sourcing-sample-state';

/**
 * État de l'échantillon d'un produit, lu dans ses commandes échantillon
 * (BO-SOURCING-P4-001). Un produit a au plus quelques commandes échantillon :
 * la limite protège seulement contre une donnée anormale.
 */
export function useSampleState(productId: string | null) {
  const query = useQuery({
    queryKey: [SAMPLE_STATE_QUERY_KEY, productId],
    enabled: Boolean(productId),
    staleTime: 30_000,
    queryFn: async (): Promise<SampleOrderLine[]> => {
      if (!productId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(
          'id, archived_at, purchase_order:purchase_orders!inner(id, po_number, status, po_type, created_at)'
        )
        .eq('product_id', productId)
        .eq('purchase_order.po_type', 'sample')
        .limit(50);

      if (error) throw error;

      return (data ?? []).map(row => ({
        itemId: row.id,
        itemArchivedAt: row.archived_at,
        orderId: row.purchase_order.id,
        poNumber: row.purchase_order.po_number,
        poStatus: row.purchase_order.status,
        poType: row.purchase_order.po_type,
        orderCreatedAt: row.purchase_order.created_at,
      }));
    },
  });

  const derived = useMemo(
    () => deriveSampleState(query.data ?? []),
    [query.data]
  );

  return {
    ...derived,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

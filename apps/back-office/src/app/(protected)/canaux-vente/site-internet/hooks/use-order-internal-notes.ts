'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

export interface OrderInternalNote {
  id: string;
  sales_order_id: string;
  metadata: { content: string } | null;
  created_by: string | null;
  created_at: string;
}

export function useOrderInternalNotes(salesOrderId: string | undefined) {
  return useQuery({
    queryKey: ['order-internal-notes', salesOrderId],
    queryFn: async (): Promise<OrderInternalNote[]> => {
      if (!salesOrderId) return [];

      const { data, error } = await supabase
        .from('sales_order_events')
        .select('id, sales_order_id, metadata, created_by, created_at')
        .eq('sales_order_id', salesOrderId)
        .eq('event_type', 'internal_note')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[useOrderInternalNotes] Fetch error:', error);
        throw error;
      }

      // Valider que metadata a la forme attendue
      return (data ?? []).map(row => ({
        ...row,
        metadata:
          row.metadata &&
          typeof row.metadata === 'object' &&
          'content' in row.metadata &&
          typeof (row.metadata as Record<string, unknown>).content === 'string'
            ? (row.metadata as { content: string })
            : null,
      }));
    },
    enabled: !!salesOrderId,
    staleTime: 60_000,
  });
}

export function useAddOrderInternalNote(salesOrderId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!salesOrderId) throw new Error('salesOrderId requis');

      // Récupérer l'utilisateur courant
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('sales_order_events').insert({
        sales_order_id: salesOrderId,
        event_type: 'internal_note',
        metadata: { content },
        created_by: user?.id ?? null,
      });

      if (error) {
        console.error('[useAddOrderInternalNote] Insert error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['order-internal-notes', salesOrderId],
      });
    },
  });
}

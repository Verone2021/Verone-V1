'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

interface UpdateCustomerNotesParams {
  customerId: string;
  notes: string;
}

export function useUpdateCustomerNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, notes }: UpdateCustomerNotesParams) => {
      const { error } = await supabase
        .from('individual_customers')
        .update({ notes })
        .eq('id', customerId);

      if (error) {
        console.error('[useUpdateCustomerNotes] Update error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['site-internet-customers'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['customer-detail'],
      });
    },
  });
}

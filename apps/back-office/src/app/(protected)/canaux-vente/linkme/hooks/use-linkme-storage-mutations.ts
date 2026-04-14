/**
 * Mutations pour les allocations de stockage LinkMe
 * Extrait de use-linkme-storage.ts pour reduction de taille
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const INVALIDATE_KEYS = ['storage-overview', 'affiliate-storage-detail'];

async function invalidateStorageQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all(
    INVALIDATE_KEYS.map(key =>
      queryClient.invalidateQueries({ queryKey: [key] })
    )
  );
}

export function useUpdateAllocationBillable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      allocationId,
      billable,
    }: {
      allocationId: string;
      billable: boolean;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('storage_allocations')
        .update({ billable_in_storage: billable })
        .eq('id', allocationId);
      if (error) {
        console.warn('Error updating allocation:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateStorageQueries(queryClient);
    },
  });
}

export function useUpdateAllocationVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      allocationId,
      visible,
    }: {
      allocationId: string;
      visible: boolean;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('storage_allocations')
        .update({ is_visible: visible })
        .eq('id', allocationId);
      if (error) {
        console.warn('Error updating visibility:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateStorageQueries(queryClient);
    },
  });
}

export function useDeleteStorageAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allocationId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('storage_allocations')
        .delete()
        .eq('id', allocationId);
      if (error) {
        console.warn('Error deleting allocation:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateStorageQueries(queryClient);
    },
  });
}

export function useCreateStorageAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      ownerType,
      ownerId,
      quantity,
      billable = true,
    }: {
      productId: string;
      ownerType: 'enseigne' | 'organisation';
      ownerId: string;
      quantity: number;
      billable?: boolean;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from('storage_allocations').upsert(
        {
          product_id: productId,
          owner_enseigne_id: ownerType === 'enseigne' ? ownerId : null,
          owner_organisation_id: ownerType === 'organisation' ? ownerId : null,
          stock_quantity: quantity,
          billable_in_storage: billable,
        },
        { onConflict: 'product_id,owner_enseigne_id,owner_organisation_id' }
      );
      if (error) {
        console.warn('Error creating allocation:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateStorageQueries(queryClient);
    },
  });
}

export function useUpdateStorageQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      allocationId,
      quantity,
    }: {
      allocationId: string;
      quantity: number;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('storage_allocations')
        .update({ stock_quantity: quantity })
        .eq('id', allocationId);
      if (error) {
        console.warn('Error updating quantity:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateStorageQueries(queryClient);
    },
  });
}

export function useUpdateStorageStartDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      allocationId,
      startDate,
    }: {
      allocationId: string;
      startDate: string | null;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await (
        supabase as unknown as {
          from(t: string): {
            update(d: Record<string, unknown>): {
              eq(
                c: string,
                v: string
              ): PromiseLike<{ error: { message: string } | null }>;
            };
          };
        }
      )
        .from('storage_allocations')
        .update({ storage_start_date: startDate })
        .eq('id', allocationId);
      if (error) {
        console.warn('Error updating storage start date:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateStorageQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: ['global-storage-overview'],
      });
    },
  });
}

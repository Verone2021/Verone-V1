'use client';

/**
 * Mutation hooks wrapper for OwnerStorageDetail
 *
 * @module use-owner-detail-mutations
 * @since 2025-12-20
 */

import { useCallback } from 'react';

import {
  useUpdateAllocationBillable,
  useUpdateStorageQuantity,
  useUpdateStorageStartDate,
} from './hooks/use-storage-billing';

export interface OwnerDetailMutations {
  handleToggleBillable: (id: string, current: boolean) => Promise<void>;
  handleUpdateQuantity: (id: string, qty: number) => Promise<void>;
  handleUpdateStartDate: (id: string, date: Date | undefined) => Promise<void>;
  isPending: boolean;
}

export function useOwnerDetailMutations(): OwnerDetailMutations {
  const updateBillable = useUpdateAllocationBillable();
  const updateQuantity = useUpdateStorageQuantity();
  const updateStartDate = useUpdateStorageStartDate();

  const handleToggleBillable = async (
    allocationId: string,
    currentValue: boolean
  ) => {
    try {
      await updateBillable.mutateAsync({
        allocationId,
        billable: !currentValue,
      });
    } catch {
      alert('Erreur lors de la mise a jour');
    }
  };

  const handleUpdateQuantity = useCallback(
    async (allocationId: string, quantity: number) => {
      if (quantity < 0) return;
      try {
        await updateQuantity.mutateAsync({ allocationId, quantity });
      } catch {
        alert('Erreur lors de la mise a jour de la quantite');
      }
    },
    [updateQuantity]
  );

  const handleUpdateStartDate = useCallback(
    async (allocationId: string, date: Date | undefined) => {
      try {
        const startDate = date ? date.toISOString().split('T')[0] : null;
        await updateStartDate.mutateAsync({ allocationId, startDate });
      } catch {
        alert('Erreur lors de la mise a jour de la date');
      }
    },
    [updateStartDate]
  );

  return {
    handleToggleBillable,
    handleUpdateQuantity,
    handleUpdateStartDate,
    isPending:
      updateBillable.isPending ||
      updateQuantity.isPending ||
      updateStartDate.isPending,
  };
}

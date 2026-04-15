'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  useAllLinkMeOrders,
  useApproveOrder,
  useRejectOrder,
  type PendingOrder,
  type OrderValidationStatus,
} from '../../hooks/use-linkme-order-actions';
import { useDeleteOrder } from './use-delete-order';

// ============================================================================
// HELPERS
// ============================================================================

function makeToggleRow(
  setExpandedRows: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  return (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };
}

// ============================================================================
// REJECT SUB-STATE
// ============================================================================

interface UseRejectStateOptions {
  refetch: () => Promise<unknown>;
}

function useRejectState({ refetch }: UseRejectStateOptions) {
  const rejectOrder = useRejectOrder();
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectClick = (order: PendingOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedOrder || !rejectReason.trim()) return;
    void rejectOrder
      .mutateAsync({ orderId: selectedOrder.id, reason: rejectReason.trim() })
      .then(() => {
        setIsRejectDialogOpen(false);
        setSelectedOrder(null);
        void refetch().catch(err => {
          console.error('[Approbations] Refetch failed:', err);
        });
      })
      .catch((error: unknown) => {
        console.error('[Approbations] Reject order failed:', error);
        toast.error('Erreur lors du rejet');
      });
  };

  return {
    rejectOrder,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    rejectReason,
    setRejectReason,
    handleRejectClick,
    handleRejectConfirm,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useCommandesTabState() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrderValidationStatus | 'all'
  >('pending');
  const {
    data: orders,
    isLoading,
    refetch,
  } = useAllLinkMeOrders(selectedStatus === 'all' ? undefined : selectedStatus);
  const approveOrder = useApproveOrder();
  const [deleteTarget, setDeleteTarget] = useState<PendingOrder | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { deleteOrder, isDeleting } = useDeleteOrder({
    onSuccess: () => {
      setDeleteTarget(null);
      void refetch().catch(err => {
        console.error('[Approbations] Refetch after delete failed:', err);
      });
    },
  });

  const rejectState = useRejectState({ refetch });
  const toggleRow = makeToggleRow(setExpandedRows);

  const handleApprove = (order: PendingOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    void approveOrder
      .mutateAsync({ orderId: order.id })
      .then(() => {
        void refetch().catch(err => {
          console.error('[Approbations] Refetch failed:', err);
        });
      })
      .catch((error: unknown) => {
        console.error('[Approbations] Approve order failed:', error);
        toast.error("Erreur lors de l'approbation");
      });
  };

  const handleDeleteConfirm = (order: PendingOrder) => {
    void deleteOrder(order).catch(err => {
      console.error('[Approbations] Delete failed:', err);
    });
  };

  return {
    selectedStatus,
    setSelectedStatus,
    orders,
    isLoading,
    approveOrder,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    expandedRows,
    toggleRow,
    handleApprove,
    handleDeleteConfirm,
    ...rejectState,
  };
}

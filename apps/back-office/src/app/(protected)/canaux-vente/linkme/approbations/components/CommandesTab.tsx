'use client';

import {
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  ShoppingCart,
  XCircle,
} from 'lucide-react';

import type { OrderValidationStatus } from '../../hooks/use-linkme-order-actions';
import { useCommandesTabState } from '../hooks/use-commandes-tab-state';
import { CommandesTable } from './CommandesTable';
import { DeleteOrderDialog } from './DeleteOrderDialog';
import { RejectOrderDialog } from './RejectOrderDialog';

// ============================================================================
// STATUS FILTER OPTIONS
// ============================================================================

const ORDER_STATUS_OPTIONS: {
  value: OrderValidationStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'Tous', icon: ShoppingCart, color: 'text-gray-600' },
  {
    value: 'pending',
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
  },
  {
    value: 'approved',
    label: 'Approuves',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  { value: 'rejected', label: 'Rejetes', icon: XCircle, color: 'text-red-600' },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusFilter({
  selectedStatus,
  onChange,
}: {
  selectedStatus: OrderValidationStatus | 'all';
  onChange: (value: OrderValidationStatus | 'all') => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Filter className="h-4 w-4 text-gray-400" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {ORDER_STATUS_OPTIONS.map(option => {
          const Icon = option.icon;
          const isActive = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Icon className={`h-4 w-4 ${option.color}`} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({
  selectedStatus,
}: {
  selectedStatus: OrderValidationStatus | 'all';
}) {
  return (
    <div className="bg-white rounded-xl p-12 text-center border">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShoppingCart className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Aucune commande
      </h2>
      <p className="text-gray-500">
        {selectedStatus === 'pending'
          ? 'Aucune commande en attente de validation'
          : 'Aucune commande trouvee avec ce filtre'}
      </p>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CommandesTab() {
  const {
    selectedStatus,
    setSelectedStatus,
    orders,
    isLoading,
    approveOrder,
    rejectOrder,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    rejectReason,
    setRejectReason,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    expandedRows,
    toggleRow,
    handleApprove,
    handleRejectClick,
    handleRejectConfirm,
    handleDeleteConfirm,
  } = useCommandesTabState();

  return (
    <>
      <StatusFilter
        selectedStatus={selectedStatus}
        onChange={setSelectedStatus}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {!isLoading && (!orders || orders.length === 0) && (
        <EmptyState selectedStatus={selectedStatus} />
      )}

      {!isLoading && orders && orders.length > 0 && (
        <CommandesTable
          orders={orders}
          expandedRows={expandedRows}
          selectedStatus={selectedStatus}
          isApprovePending={approveOrder.isPending}
          onToggle={toggleRow}
          onApprove={handleApprove}
          onRejectClick={handleRejectClick}
          onDeleteClick={setDeleteTarget}
        />
      )}

      <RejectOrderDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        onConfirm={handleRejectConfirm}
        isPending={rejectOrder.isPending}
      />

      <DeleteOrderDialog
        target={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

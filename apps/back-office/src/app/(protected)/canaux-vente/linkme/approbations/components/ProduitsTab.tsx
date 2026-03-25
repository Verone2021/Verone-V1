'use client';

import { useProduitsTab } from './use-produits-tab';
import {
  FilterBar,
  ProductsLoading,
  ProductsEmptyState,
  ProductsTable,
} from './produits-tab-table';
import { ApproveDialog, RejectDialog } from './produits-tab-dialogs';
import { DetailDialog, EditDialog } from './produits-tab-dialogs-detail-edit';

export function ProduitsTab() {
  const state = useProduitsTab();

  return (
    <>
      <FilterBar
        selectedStatus={state.selectedStatus}
        setSelectedStatus={state.setSelectedStatus}
      />

      {state.isLoading && <ProductsLoading />}

      {!state.isLoading && (!state.products || state.products.length === 0) && (
        <ProductsEmptyState selectedStatus={state.selectedStatus} />
      )}

      {!state.isLoading && state.products && state.products.length > 0 && (
        <ProductsTable
          products={state.products}
          onView={state.handleViewDetails}
          onEdit={state.handleEditClick}
          onReject={state.handleRejectClick}
          onApprove={state.handleApproveClick}
        />
      )}

      <ApproveDialog
        isApproveDialogOpen={state.isApproveDialogOpen}
        setIsApproveDialogOpen={state.setIsApproveDialogOpen}
        selectedProduct={state.selectedProduct}
        selectedCommission={state.selectedCommission}
        setSelectedCommission={state.setSelectedCommission}
        approveProduct={state.approveProduct}
        handleApproveConfirm={state.handleApproveConfirm}
      />

      <RejectDialog
        isRejectDialogOpen={state.isRejectDialogOpen}
        setIsRejectDialogOpen={state.setIsRejectDialogOpen}
        rejectReason={state.rejectReason}
        setRejectReason={state.setRejectReason}
        rejectProduct={state.rejectProduct}
        handleRejectConfirm={state.handleRejectConfirm}
      />

      <DetailDialog
        isDetailOpen={state.isDetailOpen}
        setIsDetailOpen={state.setIsDetailOpen}
        selectedProduct={state.selectedProduct}
      />

      <EditDialog
        isEditDialogOpen={state.isEditDialogOpen}
        setIsEditDialogOpen={state.setIsEditDialogOpen}
        selectedProduct={state.selectedProduct}
        editCommissionRate={state.editCommissionRate}
        setEditCommissionRate={state.setEditCommissionRate}
        editPayoutHt={state.editPayoutHt}
        setEditPayoutHt={state.setEditPayoutHt}
        editChangeReason={state.editChangeReason}
        setEditChangeReason={state.setEditChangeReason}
        updateProduct={state.updateProduct}
        handleEditConfirm={state.handleEditConfirm}
      />
    </>
  );
}

'use client';

import Link from 'next/link';

import { PurchaseOrderFormModal } from '@verone/orders';
import { ButtonUnified } from '@verone/ui';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PackageCheck } from 'lucide-react';

import type { SortColumn } from './types';
import { useFournisseursPage } from './use-fournisseurs-page';
import { FournisseursKpiCards } from './FournisseursKpiCards';
import { FournisseursFilters } from './FournisseursFilters';
import { FournisseursTable } from './FournisseursTable';
import { FournisseursModals } from './modals/FournisseursModals';
import { FournisseursAlertDialogs } from './modals/FournisseursAlertDialogs';

export default function PurchaseOrdersPage() {
  const hook = useFournisseursPage();

  const renderSortIcon = (column: SortColumn) => {
    if (hook.sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-2 inline opacity-30" />;
    }
    return hook.sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-2 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-2 inline" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes Fournisseurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des commandes et approvisionnements
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/stocks/receptions">
            <ButtonUnified variant="outline" icon={PackageCheck}>
              Réceptions
            </ButtonUnified>
          </Link>
          <PurchaseOrderFormModal
            onSuccess={() => {
              void hook.fetchOrders().catch(error => {
                console.error(
                  '[PurchaseOrders] Fetch after create failed:',
                  error
                );
              });
            }}
          />
        </div>
      </div>

      {/* KPI Dynamiques */}
      <FournisseursKpiCards filteredStats={hook.filteredStats} />

      {/* Filtres */}
      <FournisseursFilters
        activeTab={hook.activeTab}
        setActiveTab={hook.setActiveTab}
        searchTerm={hook.searchTerm}
        setSearchTerm={hook.setSearchTerm}
        advancedFilters={hook.advancedFilters}
        setAdvancedFilters={hook.setAdvancedFilters}
        suppliers={hook.suppliers}
        availableYears={hook.availableYears}
        currentYear={hook.currentYear}
        isPeriodEnabled={hook.isPeriodEnabled}
        hasActiveFilters={hook.hasActiveFilters}
        tabCounts={hook.tabCounts}
      />

      {/* Table */}
      <FournisseursTable
        loading={hook.loading}
        filteredOrders={hook.filteredOrders}
        expandedRows={hook.expandedRows}
        sortColumn={hook.sortColumn}
        sortDirection={hook.sortDirection}
        onSort={hook.handleSort}
        renderSortIcon={renderSortIcon}
        onToggleRow={hook.toggleRow}
        onView={hook.openOrderDetail}
        onEdit={hook.openEditModal}
        onValidate={order => {
          void hook.handleStatusChange(order.id, 'validated').catch(error => {
            console.error('[PurchaseOrders] Status change failed:', error);
          });
        }}
        onDevalidate={order => {
          void hook.handleStatusChange(order.id, 'draft').catch(error => {
            console.error('[PurchaseOrders] Status change failed:', error);
          });
        }}
        onReceive={hook.openReceptionModal}
        onCancel={hook.handleCancel}
        onDelete={hook.handleDelete}
        onCancelRemainder={hook.openCancelRemainderModal}
        onLinkTransaction={hook.openOrderDetailWithPayment}
      />

      {/* Modals */}
      <FournisseursModals
        selectedOrder={hook.selectedOrder}
        showOrderDetail={hook.showOrderDetail}
        initialPaymentOpen={hook.initialPaymentOpen}
        onCloseOrderDetail={() => {
          hook.setShowOrderDetail(false);
          hook.setSelectedOrder(null);
          hook.setInitialPaymentOpen(false);
        }}
        onUpdateOrderDetail={() => {
          void hook.fetchOrders().catch(error => {
            console.error('[PurchaseOrders] Fetch after update failed:', error);
          });
        }}
        showReceptionModal={hook.showReceptionModal}
        onCloseReceptionModal={() => {
          hook.setShowReceptionModal(false);
          hook.setSelectedOrder(null);
        }}
        onSuccessReceptionModal={() => {
          void hook.fetchOrders().catch(error => {
            console.error(
              '[PurchaseOrders] Fetch after success failed:',
              error
            );
          });
          hook.setShowReceptionModal(false);
          hook.setSelectedOrder(null);
        }}
        orderToEdit={hook.orderToEdit}
        showEditModal={hook.showEditModal}
        onCloseEditModal={() => {
          hook.setShowEditModal(false);
          hook.setOrderToEdit(null);
        }}
        onSuccessEditModal={() => {
          void hook.fetchOrders().catch(error => {
            console.error(
              '[PurchaseOrders] Fetch after success failed:',
              error
            );
          });
          hook.setShowEditModal(false);
          hook.setOrderToEdit(null);
        }}
      />

      {/* Alert Dialogs */}
      <FournisseursAlertDialogs
        showValidateConfirmation={hook.showValidateConfirmation}
        setShowValidateConfirmation={hook.setShowValidateConfirmation}
        onValidateConfirmed={() => {
          void hook.handleValidateConfirmed().catch(error => {
            console.error('[PurchaseOrders] Validate confirmed failed:', error);
          });
        }}
        showDevalidateConfirmation={hook.showDevalidateConfirmation}
        setShowDevalidateConfirmation={hook.setShowDevalidateConfirmation}
        onDevalidateConfirmed={() => {
          void hook.handleDevalidateConfirmed().catch(error => {
            console.error(
              '[PurchaseOrders] Devalidate confirmed failed:',
              error
            );
          });
        }}
        showDeleteConfirmation={hook.showDeleteConfirmation}
        setShowDeleteConfirmation={hook.setShowDeleteConfirmation}
        onDeleteConfirmed={() => {
          void hook.handleDeleteConfirmed().catch(error => {
            console.error('[PurchaseOrders] Delete confirmed failed:', error);
          });
        }}
        showCancelConfirmation={hook.showCancelConfirmation}
        setShowCancelConfirmation={hook.setShowCancelConfirmation}
        onCancelConfirmed={() => {
          void hook.handleCancelConfirmed().catch(error => {
            console.error('[PurchaseOrders] Cancel confirmed failed:', error);
          });
        }}
        showShortageWarning={hook.showShortageWarning}
        setShowShortageWarning={hook.setShowShortageWarning}
        shortageDetails={hook.shortageDetails}
        setShortageDetails={hook.setShortageDetails}
        onAutoAdjustQuantities={() => {
          void hook.handleAutoAdjustQuantities().catch(error => {
            console.error('[PurchaseOrders] Auto adjust failed:', error);
          });
        }}
        onValidateAnyway={() => {
          hook.setShowValidateConfirmation(true);
        }}
        showCancelRemainderModal={hook.showCancelRemainderModal}
        cancelRemainderOrder={hook.cancelRemainderOrder}
        cancelRemainderItems={hook.cancelRemainderItems}
        onCloseCancelRemainder={() => {
          hook.setShowCancelRemainderModal(false);
          hook.setCancelRemainderOrder(null);
          hook.setCancelRemainderItems([]);
        }}
        onSuccessCancelRemainder={() => {
          void hook.fetchOrders().catch(error => {
            console.error(
              '[PurchaseOrders] Fetch after success failed:',
              error
            );
          });
          hook.setShowCancelRemainderModal(false);
          hook.setCancelRemainderOrder(null);
          hook.setCancelRemainderItems([]);
        }}
      />
    </div>
  );
}

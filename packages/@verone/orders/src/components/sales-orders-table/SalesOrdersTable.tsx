'use client';

/**
 * SalesOrdersTable - Composant reutilisable pour afficher les commandes clients
 *
 * Utilise par:
 * - /commandes/clients (toutes les commandes)
 * - /canaux-vente/linkme/commandes (filtre canal LinkMe)
 * - /canaux-vente/site-internet/commandes (futur)
 *
 * Les triggers stock sont agnostiques du canal - meme workflow pour tous.
 */

import React from 'react';

import { useRouter } from 'next/navigation';

import { useActiveEnseignes } from '@verone/organisations';
import { ButtonUnified } from '@verone/ui';
import { Plus } from 'lucide-react';

import type { SalesAdvancedFilters } from '../../types/advanced-filters';
import { DEFAULT_SALES_FILTERS } from '../../types/advanced-filters';
import type { SalesOrderStatus } from '../../hooks/use-sales-orders';
import { useSalesOrders } from '../../hooks/use-sales-orders';
import { SalesOrderFormModal } from '../modals/SalesOrderFormModal';
import { SalesOrderDataTable } from './SalesOrderDataTable';
import { SalesOrderFilters } from './SalesOrderFilters';
import { SalesOrderModals } from './SalesOrderModals';
import { SalesOrderStatsCards } from './SalesOrderStatsCards';
import { useSalesOrderActions } from './hooks/use-sales-order-actions';
import { useSalesOrdersFilter } from './hooks/use-sales-orders-filter';
import { useSalesOrdersModals } from './hooks/use-sales-orders-modals';
import { useSalesOrdersPagination } from './hooks/use-sales-orders-pagination';
import { useSalesOrdersSort } from './hooks/use-sales-orders-sort';
import { useSalesOrdersStats } from './hooks/use-sales-orders-stats';

import { useSalesOrdersSuccessHandlers } from './hooks/use-sales-orders-success-handlers';
import { LINKME_CHANNEL_ID } from './sales-orders-constants';
import type { SalesOrdersTableProps } from './types';

export type { SalesOrdersTableProps } from './types';

export function SalesOrdersTable({
  channelId = null,
  showChannelColumn = true,
  showKPIs = true,
  allowValidate = true,
  allowShip = true,
  allowCancel = true,
  allowDelete = true,
  allowEdit = true,
  additionalColumns = [],
  onCreateClick,
  onLinkMeClick,
  initialCreateOpen = false,
  renderCreateModal,
  renderEditModal,
  onOrderCreated,
  onOrderUpdated,
  updateStatusAction,
  renderHeaderRight,
  customFilter,
  enablePagination = false,
  defaultItemsPerPage = 10,
  preloadedOrders,
  sortableColumns,
  onViewOrder,
}: SalesOrdersTableProps) {
  const router = useRouter();
  const {
    loading: hookLoading,
    orders: fetchedOrders,
    stats: _stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder,
  } = useSalesOrders();

  // OPTIMISE: Utiliser preloadedOrders si fourni (evite double fetch)
  const orders = preloadedOrders ?? fetchedOrders;
  const loading = preloadedOrders ? false : hookLoading;

  const { enseignes } = useActiveEnseignes();

  // Etats filtres (restent dans le composant car passes a SalesOrderFilters)
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<SalesOrderStatus | 'all'>(
    'all'
  );
  const [advancedFilters, setAdvancedFilters] =
    React.useState<SalesAdvancedFilters>(DEFAULT_SALES_FILTERS);

  const currentYear = new Date().getFullYear();

  const { sortColumn, sortDirection, handleSort } = useSalesOrdersSort();

  const { filteredOrders, availableYears, isPeriodEnabled, hasActiveFilters } =
    useSalesOrdersFilter({
      orders,
      activeTab,
      advancedFilters,
      searchTerm,
      sortColumn,
      sortDirection,
      customFilter,
      currentYear,
    });

  const { filteredStats, tabCounts } = useSalesOrdersStats({
    orders,
    filteredOrders,
  });

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedOrders,
  } = useSalesOrdersPagination({
    filteredOrders,
    enablePagination,
    defaultItemsPerPage,
    activeTab,
    advancedFilters,
    searchTerm,
    customFilter,
  });

  const modals = useSalesOrdersModals(initialCreateOpen);

  const successHandlers = useSalesOrdersSuccessHandlers({
    channelId,
    fetchOrders,
    fetchStats,
    onOrderCreated,
    onOrderUpdated,
    setShowCreateModal: modals.setShowCreateModal,
    setShowEditModal: modals.setShowEditModal,
    setEditingOrderId: modals.setEditingOrderId,
    setShowShipmentModal: modals.setShowShipmentModal,
    setOrderToShip: modals.setOrderToShip,
    setShowLinkTransactionModal: modals.setShowLinkTransactionModal,
    setSelectedOrderForLink: modals.setSelectedOrderForLink,
  });

  const actions = useSalesOrderActions({
    channelId,
    preloadedOrders,
    orders,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder,
    updateStatusAction,
    onOrderUpdated,
    showOrderDetail: modals.showOrderDetail,
    dismissedOrderId: modals.dismissedOrderId,
    setSelectedOrder: modals.setSelectedOrder,
    setShowOrderDetail: modals.setShowOrderDetail,
    setDismissedOrderId: modals.setDismissedOrderId,
    setShowValidateConfirmation: modals.setShowValidateConfirmation,
    setOrderToValidate: modals.setOrderToValidate,
    setShowDevalidateConfirmation: modals.setShowDevalidateConfirmation,
    setOrderToDevalidate: modals.setOrderToDevalidate,
    orderToValidate: modals.orderToValidate,
    orderToDevalidate: modals.orderToDevalidate,
    orderToDelete: modals.orderToDelete,
    orderToCancel: modals.orderToCancel,
    setShowDeleteConfirmation: modals.setShowDeleteConfirmation,
    setOrderToDelete: modals.setOrderToDelete,
    setShowCancelConfirmation: modals.setShowCancelConfirmation,
    setOrderToCancel: modals.setOrderToCancel,
  });

  // Build create button for the filter bar
  const renderCreateButton = onCreateClick ? (
    <ButtonUnified onClick={onCreateClick} icon={Plus}>
      Nouvelle commande
    </ButtonUnified>
  ) : renderCreateModal ? (
    <ButtonUnified onClick={() => modals.setShowCreateModal(true)} icon={Plus}>
      Nouvelle commande
    </ButtonUnified>
  ) : (
    <SalesOrderFormModal
      buttonLabel="Nouvelle commande"
      onSuccess={successHandlers.handleCreateSuccess}
      onLinkMeClick={onLinkMeClick}
    />
  );

  return (
    <div className="space-y-6">
      {/* Statistiques KPI */}
      {showKPIs && <SalesOrderStatsCards stats={filteredStats} />}

      {/* Onglets Statuts + Filtres */}
      <SalesOrderFilters
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        tabCounts={tabCounts}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        hasActiveFilters={hasActiveFilters}
        currentYear={currentYear}
        availableYears={availableYears}
        isPeriodEnabled={isPeriodEnabled}
        enseignes={enseignes}
        renderCreateButton={renderCreateButton}
        renderHeaderRight={renderHeaderRight}
      />

      {/* Tableau commandes */}
      <SalesOrderDataTable
        paginatedOrders={paginatedOrders}
        filteredCount={filteredOrders.length}
        loading={loading}
        showChannelColumn={showChannelColumn}
        additionalColumns={additionalColumns}
        sortableColumns={sortableColumns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        channelId={channelId}
        allowEdit={allowEdit}
        allowValidate={allowValidate}
        allowShip={allowShip}
        allowCancel={allowCancel}
        allowDelete={allowDelete}
        onView={order => {
          // Commandes LinkMe → toujours page de détail dédiée
          if (
            !onViewOrder &&
            (order.channel_id === LINKME_CHANNEL_ID ||
              order.created_by_affiliate_id ||
              order.linkme_selection_id)
          ) {
            router.push(`/canaux-vente/linkme/commandes/${order.id}/details`);
            return;
          }
          if (onViewOrder) {
            onViewOrder(order);
          } else {
            modals.openOrderDetail(order);
          }
        }}
        onEdit={modals.openEditOrder}
        onValidate={orderId => {
          void actions
            .handleStatusChange(orderId, 'validated')
            .catch((err: unknown) => {
              console.error('[SalesOrdersTable] validate failed:', err);
            });
        }}
        onDevalidate={orderId => {
          void actions
            .handleStatusChange(orderId, 'draft')
            .catch((err: unknown) => {
              console.error('[SalesOrdersTable] devalidate failed:', err);
            });
        }}
        onShip={modals.openShipmentModal}
        onCancel={modals.handleCancel}
        onDelete={modals.handleDelete}
        onLinkTransaction={order => {
          modals.setSelectedOrderForLink(order);
          modals.setShowLinkTransactionModal(true);
        }}
        enablePagination={enablePagination}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Modals et Dialogs de confirmation */}
      <SalesOrderModals
        channelId={channelId}
        fetchOrders={fetchOrders}
        fetchStats={fetchStats}
        onOrderUpdated={onOrderUpdated}
        renderEditModal={renderEditModal}
        renderCreateModal={renderCreateModal}
        selectedOrder={modals.selectedOrder}
        showOrderDetail={modals.showOrderDetail}
        editingOrderId={modals.editingOrderId}
        showEditModal={modals.showEditModal}
        showCreateModal={modals.showCreateModal}
        showLinkMeModal={modals.showLinkMeModal}
        orderToShip={modals.orderToShip}
        showShipmentModal={modals.showShipmentModal}
        showValidateConfirmation={modals.showValidateConfirmation}
        showDevalidateConfirmation={modals.showDevalidateConfirmation}
        showDeleteConfirmation={modals.showDeleteConfirmation}
        showCancelConfirmation={modals.showCancelConfirmation}
        showLinkTransactionModal={modals.showLinkTransactionModal}
        selectedOrderForLink={modals.selectedOrderForLink}
        setShowEditModal={modals.setShowEditModal}
        setEditingOrderId={modals.setEditingOrderId}
        setShowCreateModal={modals.setShowCreateModal}
        setShowLinkMeModal={modals.setShowLinkMeModal}
        setShowShipmentModal={modals.setShowShipmentModal}
        setOrderToShip={modals.setOrderToShip}
        setShowValidateConfirmation={modals.setShowValidateConfirmation}
        setShowDevalidateConfirmation={modals.setShowDevalidateConfirmation}
        setShowDeleteConfirmation={modals.setShowDeleteConfirmation}
        setShowCancelConfirmation={modals.setShowCancelConfirmation}
        setShowLinkTransactionModal={modals.setShowLinkTransactionModal}
        handleCloseOrderDetail={actions.handleCloseOrderDetail}
        handleValidateConfirmed={actions.handleValidateConfirmed}
        handleDevalidateConfirmed={actions.handleDevalidateConfirmed}
        handleDeleteConfirmed={actions.handleDeleteConfirmed}
        handleCancelConfirmed={actions.handleCancelConfirmed}
        handleEditSuccess={successHandlers.handleEditSuccess}
        handleCreateSuccess={successHandlers.handleCreateSuccess}
        handleShipmentSuccess={successHandlers.handleShipmentSuccess}
        handleLinkTransactionSuccess={
          successHandlers.handleLinkTransactionSuccess
        }
      />
    </div>
  );
}

export default SalesOrdersTable;

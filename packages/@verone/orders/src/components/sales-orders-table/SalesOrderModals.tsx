'use client';

import React from 'react';

import { RapprochementFromOrderModal } from '@verone/finance/components';

import type { SalesOrder } from '../../hooks/use-sales-orders';
import { CreateLinkMeOrderModal } from '../modals/CreateLinkMeOrderModal';
import { OrderDetailModal } from '../modals/OrderDetailModal';
import { SalesOrderFormModal } from '../modals/SalesOrderFormModal';
import { SalesOrderShipmentModal } from '../modals/SalesOrderShipmentModal';
import type { CancelGuardDoc } from './SalesOrderConfirmDialogs';
import { SalesOrderConfirmDialogs } from './SalesOrderConfirmDialogs';

interface SalesOrderModalsProps {
  channelId: string | null;
  fetchOrders: (filters?: { channel_id: string }) => Promise<void>;
  fetchStats: (filters?: { channel_id: string }) => Promise<void>;
  onOrderUpdated?: () => void;
  renderEditModal?: (props: {
    orderId: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;
  renderCreateModal?: (props: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;
  // Modal state
  selectedOrder: SalesOrder | null;
  showOrderDetail: boolean;
  editingOrderId: string | null;
  showEditModal: boolean;
  showCreateModal: boolean;
  showLinkMeModal: boolean;
  orderToShip: SalesOrder | null;
  showShipmentModal: boolean;
  showValidateConfirmation: boolean;
  showDevalidateConfirmation: boolean;
  showDeleteConfirmation: boolean;
  showCancelConfirmation: boolean;
  showCancelGuardDialog: boolean;
  cancelGuardData: { reason: string; docsToDelete: CancelGuardDoc[] } | null;
  showLinkTransactionModal: boolean;
  selectedOrderForLink: SalesOrder | null;
  // Modal setters
  setShowEditModal: (v: boolean) => void;
  setEditingOrderId: (id: string | null) => void;
  setShowCreateModal: (v: boolean) => void;
  setShowLinkMeModal: (v: boolean) => void;
  setShowShipmentModal: (v: boolean) => void;
  setOrderToShip: (order: SalesOrder | null) => void;
  setShowValidateConfirmation: (v: boolean) => void;
  setShowDevalidateConfirmation: (v: boolean) => void;
  setShowDeleteConfirmation: (v: boolean) => void;
  setShowCancelConfirmation: (v: boolean) => void;
  setShowCancelGuardDialog: (v: boolean) => void;
  setShowLinkTransactionModal: (v: boolean) => void;
  // Action handlers
  handleCloseOrderDetail: () => void;
  handleValidateConfirmed: () => Promise<void>;
  handleDevalidateConfirmed: () => Promise<void>;
  handleDeleteConfirmed: () => Promise<void>;
  handleCancelConfirmed: () => Promise<void>;
  handleCancelGuardConfirmed: () => Promise<void>;
  handleEditSuccess: () => void;
  handleCreateSuccess: () => void;
  handleShipmentSuccess: () => void;
  handleLinkTransactionSuccess: () => void;
}

export function SalesOrderModals({
  channelId,
  fetchOrders,
  fetchStats,
  onOrderUpdated,
  renderEditModal,
  renderCreateModal,
  selectedOrder,
  showOrderDetail,
  editingOrderId,
  showEditModal,
  showCreateModal,
  showLinkMeModal,
  orderToShip,
  showShipmentModal,
  showValidateConfirmation,
  showDevalidateConfirmation,
  showDeleteConfirmation,
  showCancelConfirmation,
  showCancelGuardDialog,
  cancelGuardData,
  showLinkTransactionModal,
  selectedOrderForLink,
  setShowEditModal,
  setEditingOrderId,
  setShowCreateModal,
  setShowLinkMeModal,
  setShowShipmentModal,
  setOrderToShip,
  setShowValidateConfirmation,
  setShowDevalidateConfirmation,
  setShowDeleteConfirmation,
  setShowCancelConfirmation,
  setShowCancelGuardDialog,
  setShowLinkTransactionModal,
  handleCloseOrderDetail,
  handleValidateConfirmed,
  handleDevalidateConfirmed,
  handleDeleteConfirmed,
  handleCancelConfirmed,
  handleCancelGuardConfirmed,
  handleEditSuccess,
  handleCreateSuccess,
  handleShipmentSuccess,
  handleLinkTransactionSuccess,
}: SalesOrderModalsProps) {
  return (
    <>
      {/* Modal Detail Commande */}
      <OrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={handleCloseOrderDetail}
        onUpdate={() => {
          const filters = channelId ? { channel_id: channelId } : undefined;
          void fetchOrders(filters).catch((err: unknown) => {
            console.error('[SalesOrdersTable] fetchOrders failed:', err);
          });
          void fetchStats(filters).catch((err: unknown) => {
            console.error('[SalesOrdersTable] fetchStats failed:', err);
          });
          onOrderUpdated?.();
        }}
      />

      {/* Modal Edition Commande */}
      {editingOrderId &&
        (renderEditModal ? (
          renderEditModal({
            orderId: editingOrderId,
            open: showEditModal,
            onClose: () => {
              setShowEditModal(false);
              setEditingOrderId(null);
            },
            onSuccess: handleEditSuccess,
          })
        ) : (
          <SalesOrderFormModal
            mode="edit"
            orderId={editingOrderId}
            open={showEditModal}
            onOpenChange={value => {
              setShowEditModal(value);
              if (!value) {
                setEditingOrderId(null);
              }
            }}
            onSuccess={handleEditSuccess}
          />
        ))}

      {/* Modal Creation (si custom) */}
      {renderCreateModal?.({
        open: showCreateModal,
        onClose: () => setShowCreateModal(false),
        onSuccess: handleCreateSuccess,
      })}

      {/* Modal LinkMe (quand selectionne depuis SalesOrderFormModal) */}
      <CreateLinkMeOrderModal
        isOpen={showLinkMeModal}
        onClose={() => {
          setShowLinkMeModal(false);
          handleCreateSuccess();
        }}
      />

      {/* Modal Expedition */}
      {orderToShip && (
        <SalesOrderShipmentModal
          order={orderToShip}
          open={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false);
            setOrderToShip(null);
          }}
          onSuccess={handleShipmentSuccess}
        />
      )}

      {/* Confirmation Dialogs */}
      <SalesOrderConfirmDialogs
        showValidateConfirmation={showValidateConfirmation}
        onValidateConfirmationChange={setShowValidateConfirmation}
        onValidateConfirmed={() => {
          void handleValidateConfirmed().catch((err: unknown) => {
            console.error('[SalesOrdersTable] validate confirmed failed:', err);
          });
        }}
        showDevalidateConfirmation={showDevalidateConfirmation}
        onDevalidateConfirmationChange={setShowDevalidateConfirmation}
        onDevalidateConfirmed={() => {
          void handleDevalidateConfirmed().catch((err: unknown) => {
            console.error(
              '[SalesOrdersTable] devalidate confirmed failed:',
              err
            );
          });
        }}
        showDeleteConfirmation={showDeleteConfirmation}
        onDeleteConfirmationChange={setShowDeleteConfirmation}
        onDeleteConfirmed={() => {
          void handleDeleteConfirmed().catch((err: unknown) => {
            console.error('[SalesOrdersTable] delete confirmed failed:', err);
          });
        }}
        showCancelConfirmation={showCancelConfirmation}
        onCancelConfirmationChange={setShowCancelConfirmation}
        onCancelConfirmed={() => {
          void handleCancelConfirmed().catch((err: unknown) => {
            console.error('[SalesOrdersTable] cancel confirmed failed:', err);
          });
        }}
        showCancelGuardDialog={showCancelGuardDialog}
        onCancelGuardChange={setShowCancelGuardDialog}
        onCancelGuardConfirmed={() => {
          void handleCancelGuardConfirmed().catch((err: unknown) => {
            console.error(
              '[SalesOrdersTable] cancel guard confirmed failed:',
              err
            );
          });
        }}
        guardReason={cancelGuardData?.reason ?? ''}
        docsToDelete={cancelGuardData?.docsToDelete ?? []}
      />

      {/* Modal Rapprochement Transaction */}
      <RapprochementFromOrderModal
        open={showLinkTransactionModal}
        onOpenChange={setShowLinkTransactionModal}
        order={
          selectedOrderForLink
            ? {
                id: selectedOrderForLink.id,
                order_number: selectedOrderForLink.order_number,
                customer_name:
                  selectedOrderForLink.organisations?.legal_name ??
                  ((selectedOrderForLink.individual_customers
                    ? [
                        selectedOrderForLink.individual_customers.first_name,
                        selectedOrderForLink.individual_customers.last_name,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : '') ||
                    'Non defini'),
                total_ttc: selectedOrderForLink.total_ttc,
                created_at: selectedOrderForLink.created_at,
                order_date: selectedOrderForLink.order_date ?? null,
                shipped_at: selectedOrderForLink.shipped_at,
                payment_status_v2: selectedOrderForLink.payment_status_v2,
              }
            : null
        }
        onSuccess={handleLinkTransactionSuccess}
      />
    </>
  );
}

import { useState } from 'react';

import type { SalesOrder } from '../../../hooks/use-sales-orders';

export interface CancelGuardDoc {
  id: string;
  documentType: 'customer_quote' | 'customer_invoice';
  documentNumber: string | null;
  qontoStatus: string;
}

export interface CancelGuardData {
  reason: string;
  docsToDelete: CancelGuardDoc[];
}

export function useSalesOrdersModals(initialCreateOpen: boolean) {
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(initialCreateOpen);
  const [showLinkMeModal, setShowLinkMeModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [orderToShip, setOrderToShip] = useState<SalesOrder | null>(null);
  const [showValidateConfirmation, setShowValidateConfirmation] =
    useState(false);
  const [orderToValidate, setOrderToValidate] = useState<string | null>(null);
  const [showDevalidateConfirmation, setShowDevalidateConfirmation] =
    useState(false);
  const [orderToDevalidate, setOrderToDevalidate] = useState<string | null>(
    null
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [showCancelGuardDialog, setShowCancelGuardDialog] = useState(false);
  const [cancelGuardData, setCancelGuardData] =
    useState<CancelGuardData | null>(null);
  const [showLinkTransactionModal, setShowLinkTransactionModal] =
    useState(false);
  const [selectedOrderForLink, setSelectedOrderForLink] =
    useState<SalesOrder | null>(null);

  const openOrderDetail = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const openEditOrder = (orderId: string) => {
    setEditingOrderId(orderId);
    setShowEditModal(true);
  };

  const openShipmentModal = (order: SalesOrder) => {
    setOrderToShip(order);
    setShowShipmentModal(true);
  };

  const handleDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteConfirmation(true);
  };

  const handleCancel = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelConfirmation(true);
  };

  return {
    // Detail
    selectedOrder,
    setSelectedOrder,
    showOrderDetail,
    setShowOrderDetail,
    dismissedOrderId,
    setDismissedOrderId,
    // Edit
    editingOrderId,
    setEditingOrderId,
    showEditModal,
    setShowEditModal,
    // Create
    showCreateModal,
    setShowCreateModal,
    // LinkMe
    showLinkMeModal,
    setShowLinkMeModal,
    // Shipment
    showShipmentModal,
    setShowShipmentModal,
    orderToShip,
    setOrderToShip,
    // Validate
    showValidateConfirmation,
    setShowValidateConfirmation,
    orderToValidate,
    setOrderToValidate,
    // Devalidate
    showDevalidateConfirmation,
    setShowDevalidateConfirmation,
    orderToDevalidate,
    setOrderToDevalidate,
    // Delete
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    orderToDelete,
    setOrderToDelete,
    // Cancel
    showCancelConfirmation,
    setShowCancelConfirmation,
    orderToCancel,
    setOrderToCancel,
    // Cancel guard
    showCancelGuardDialog,
    setShowCancelGuardDialog,
    cancelGuardData,
    setCancelGuardData,
    // Link transaction
    showLinkTransactionModal,
    setShowLinkTransactionModal,
    selectedOrderForLink,
    setSelectedOrderForLink,
    // Simple open/close handlers
    openOrderDetail,
    openEditOrder,
    openShipmentModal,
    handleDelete,
    handleCancel,
  };
}

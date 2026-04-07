'use client';

import type { PurchaseOrder } from '@verone/orders';
import {
  PurchaseOrderDetailModal,
  PurchaseOrderReceptionModal,
  PurchaseOrderFormModal,
} from '@verone/orders';

import type { PurchaseOrderRow } from '../types';

interface FournisseursModalsProps {
  // Detail modal
  selectedOrder: PurchaseOrder | null;
  showOrderDetail: boolean;
  initialPaymentOpen: boolean;
  onCloseOrderDetail: () => void;
  onUpdateOrderDetail: () => void;

  // Reception modal
  showReceptionModal: boolean;
  onCloseReceptionModal: () => void;
  onSuccessReceptionModal: () => void;

  // Edit modal
  orderToEdit: PurchaseOrderRow | null;
  showEditModal: boolean;
  onCloseEditModal: () => void;
  onSuccessEditModal: () => void;
}

export function FournisseursModals({
  selectedOrder,
  showOrderDetail,
  initialPaymentOpen,
  onCloseOrderDetail,
  onUpdateOrderDetail,
  showReceptionModal,
  onCloseReceptionModal,
  onSuccessReceptionModal,
  orderToEdit,
  showEditModal,
  onCloseEditModal,
  onSuccessEditModal,
}: FournisseursModalsProps) {
  return (
    <>
      {/* Modal Détail Commande */}
      <PurchaseOrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={onCloseOrderDetail}
        onUpdate={onUpdateOrderDetail}
        initialPaymentOpen={initialPaymentOpen}
      />

      {/* Modal de réception */}
      {selectedOrder && (
        <PurchaseOrderReceptionModal
          order={selectedOrder}
          open={showReceptionModal}
          onClose={onCloseReceptionModal}
          onSuccess={onSuccessReceptionModal}
        />
      )}

      {/* Modal Édition Commande (mode edit) */}
      {orderToEdit && (
        <PurchaseOrderFormModal
          order={orderToEdit}
          isOpen={showEditModal}
          onClose={onCloseEditModal}
          onSuccess={onSuccessEditModal}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { X, Store } from 'lucide-react';

import { useSalesOrders, useOrderItems } from '@verone/orders/hooks';
import type { SalesOrder } from '@verone/orders/hooks';

import {
  orderStatusLabels,
  orderStatusColors,
  OrderProductsCard,
  OrderMarginReportCard,
  OrderPaymentSummaryCard,
  OrderReconciliationCard,
  OrderShipmentHistoryCard,
  OrderInvoicingCard,
  useOrderDetailData,
  useOrderDetailHandlers,
  OrderCustomerCard,
  OrderShipmentStatusCard,
  OrderActionsCard,
  OrderSubModals,
} from './order-detail';
import type { ShipmentHistoryItem } from './order-detail';
import { SendShippingTrackingModal } from './SendShippingTrackingModal';

export interface OrderDetailModalProps {
  order: SalesOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  readOnly?: boolean;
  channelRedirectUrl?: string | null;
  onOpenShipmentModal?: () => void;
}

export function OrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
  readOnly = false,
  channelRedirectUrl,
  onOpenShipmentModal,
}: OrderDetailModalProps) {
  const { markAsManuallyPaid, fetchOrderPayments, deleteManualPayment } =
    useSalesOrders();
  const { addItem, updateItem, removeItem } = useOrderItems({
    orderId: order?.id ?? '',
    orderType: 'sales',
  });

  const [shipmentToEmail, setShipmentToEmail] =
    useState<ShipmentHistoryItem | null>(null);

  const data = useOrderDetailData(order, open);

  const handlers = useOrderDetailHandlers(
    order
      ? {
          order,
          readOnly,
          linkedInvoices: data.linkedInvoices,
          orderPayments: data.orderPayments,
          existingLinks: data.existingLinks,
          manualPaymentType: data.manualPaymentType,
          manualPaymentAmount: data.manualPaymentAmount,
          manualPaymentDate: data.manualPaymentDate,
          manualPaymentRef: data.manualPaymentRef,
          manualPaymentNote: data.manualPaymentNote,
          shippingCostHt: data.shippingCostHt,
          handlingCostHt: data.handlingCostHt,
          insuranceCostHt: data.insuranceCostHt,
          feesVatRate: data.feesVatRate,
          setFeesSaving: data.setFeesSaving,
          setManualPaymentType: data.setManualPaymentType,
          setManualPaymentAmount: data.setManualPaymentAmount,
          setManualPaymentDate: data.setManualPaymentDate,
          setManualPaymentRef: data.setManualPaymentRef,
          setManualPaymentNote: data.setManualPaymentNote,
          setShowPaymentDialog: data.setShowPaymentDialog,
          setOrderPayments: data.setOrderPayments,
          setDeletingPaymentId: data.setDeletingPaymentId,
          setPaymentSubmitting: data.setPaymentSubmitting,
          markAsManuallyPaid,
          fetchOrderPayments,
          deleteManualPayment,
          onUpdate,
        }
      : // Fallback when order is null — hooks called unconditionally
        {
          order: {} as SalesOrder,
          readOnly: true,
          linkedInvoices: [],
          orderPayments: [],
          existingLinks: [],
          manualPaymentType: 'card' as const,
          manualPaymentAmount: '',
          manualPaymentDate: '',
          manualPaymentRef: '',
          manualPaymentNote: '',
          shippingCostHt: 0,
          handlingCostHt: 0,
          insuranceCostHt: 0,
          feesVatRate: 0.2,
          setFeesSaving: () => undefined,
          setManualPaymentType: () => undefined,
          setManualPaymentAmount: () => undefined,
          setManualPaymentDate: () => undefined,
          setManualPaymentRef: () => undefined,
          setManualPaymentNote: () => undefined,
          setShowPaymentDialog: () => undefined,
          setOrderPayments: () => undefined,
          setDeletingPaymentId: () => undefined,
          setPaymentSubmitting: () => undefined,
          markAsManuallyPaid,
          fetchOrderPayments,
          deleteManualPayment,
          onUpdate,
        }
  );

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="h-screen md:h-auto max-w-full md:max-w-7xl md:max-h-[90vh] flex flex-col overflow-hidden"
          hideCloseButton
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl">
                  Commande {order.order_number}
                </DialogTitle>
                <Badge className={orderStatusColors[order.status]}>
                  {orderStatusLabels[order.status]}
                </Badge>
                {order.sales_channel?.name && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {order.sales_channel.name}
                  </Badge>
                )}
              </div>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-4 mt-3">
            {/* COLONNE PRINCIPALE (70%) - Produits */}
            <div className="flex-1 order-2 lg:order-1">
              <OrderProductsCard
                order={order}
                isEditing={data.isEditing}
                isLocked={handlers.isLocked}
                hasActiveInvoice={handlers.hasActiveInvoice}
                shippingCostHt={data.shippingCostHt}
                insuranceCostHt={data.insuranceCostHt}
                handlingCostHt={data.handlingCostHt}
                feesVatRate={data.feesVatRate}
                feesSaving={data.feesSaving}
                onSetIsEditing={data.setIsEditing}
                onSetShippingCostHt={data.setShippingCostHt}
                onSetInsuranceCostHt={data.setInsuranceCostHt}
                onSetHandlingCostHt={data.setHandlingCostHt}
                onSetFeesVatRate={data.setFeesVatRate}
                onSaveFees={() => void handlers.saveFees().catch(console.error)}
                onShowAddProductModal={() => data.setShowAddProductModal(true)}
                onUpdateItem={(itemId, itemData) =>
                  void updateItem(itemId, itemData)
                    .then(() => onUpdate?.())
                    .catch((err: unknown) =>
                      console.error(
                        '[OrderDetailModal] Update item failed:',
                        err
                      )
                    )
                }
                onRemoveItem={itemId =>
                  void removeItem(itemId)
                    .then(() => onUpdate?.())
                    .catch((err: unknown) =>
                      console.error(
                        '[OrderDetailModal] Delete item failed:',
                        err
                      )
                    )
                }
                onUpdate={onUpdate}
              />

              {/* [BO-ORD-003] Récap gain/perte — lecture seule */}
              <div className="mt-3">
                <OrderMarginReportCard orderId={order.id} />
              </div>
            </div>

            {/* SIDEBAR (35%) */}
            <div className="w-full lg:w-[420px] space-y-3 order-1 lg:order-2">
              <OrderCustomerCard
                order={order}
                onShowOrgModal={() => data.setShowOrgModal(true)}
              />

              <OrderPaymentSummaryCard
                order={order}
                readOnly={readOnly}
                canMarkAsPaid={handlers.canMarkAsPaid}
                onOpenPaymentDialog={handlers.openPaymentDialog}
              />

              <OrderReconciliationCard order={order} />

              <OrderInvoicingCard
                order={order}
                readOnly={readOnly}
                linkedInvoices={data.linkedInvoices}
                linkedQuotes={data.linkedQuotes}
                loadingLinkedInvoices={data.loadingLinkedInvoices}
                loadingLinkedQuotes={data.loadingLinkedQuotes}
                activeInvoices={handlers.activeInvoices}
                hasActiveInvoice={handlers.hasActiveInvoice}
                onShowInvoiceModal={() => data.setShowInvoiceModal(true)}
                onShowQuoteModal={() => data.setShowQuoteModal(true)}
              />

              <OrderShipmentStatusCard
                order={order}
                shipmentHistory={data.shipmentHistory}
                readOnly={readOnly}
                canShip={handlers.canShip}
                onOpenShipmentModal={onOpenShipmentModal}
              />

              <OrderShipmentHistoryCard
                shipmentHistory={data.shipmentHistory}
                order={order}
                onSendTrackingEmail={h => setShipmentToEmail(h)}
              />

              <OrderActionsCard
                order={order}
                readOnly={readOnly}
                channelRedirectUrl={channelRedirectUrl}
                linkedDocuments={data.linkedDocuments}
                onShowSendDocsModal={() => data.setShowSendDocsModal(true)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OrderSubModals
        order={order}
        onUpdate={onUpdate}
        showAddProductModal={data.showAddProductModal}
        onCloseAddProductModal={() => data.setShowAddProductModal(false)}
        onAddItem={async itemData => {
          await addItem(itemData);
        }}
        showPaymentDialog={data.showPaymentDialog}
        setShowPaymentDialog={data.setShowPaymentDialog}
        orderPayments={data.orderPayments}
        existingLinks={data.existingLinks}
        rapprochementOrder={data.rapprochementOrder}
        deletingPaymentId={data.deletingPaymentId}
        onRefreshPayments={handlers.refreshPayments}
        onDeletePayment={handlers.handleDeletePayment}
        onLinksChanged={data.setExistingLinks}
        manualPaymentType={data.manualPaymentType}
        manualPaymentAmount={data.manualPaymentAmount}
        manualPaymentDate={data.manualPaymentDate}
        manualPaymentRef={data.manualPaymentRef}
        manualPaymentNote={data.manualPaymentNote}
        onSetManualPaymentType={data.setManualPaymentType}
        onSetManualPaymentAmount={data.setManualPaymentAmount}
        onSetManualPaymentDate={data.setManualPaymentDate}
        onSetManualPaymentRef={data.setManualPaymentRef}
        onSetManualPaymentNote={data.setManualPaymentNote}
        onSubmitManualPayment={handlers.handleSubmitManualPayment}
        paymentSubmitting={data.paymentSubmitting}
        showOrgModal={data.showOrgModal}
        setShowOrgModal={data.setShowOrgModal}
        showInvoiceModal={data.showInvoiceModal}
        setShowInvoiceModal={data.setShowInvoiceModal}
        showQuoteModal={data.showQuoteModal}
        setShowQuoteModal={data.setShowQuoteModal}
        setLinkedQuotes={data.setLinkedQuotes}
        showSendDocsModal={data.showSendDocsModal}
        onCloseSendDocsModal={() => data.setShowSendDocsModal(false)}
        linkedDocuments={data.linkedDocuments}
        orderContacts={data.orderContacts}
      />

      {shipmentToEmail && (
        <SendShippingTrackingModal
          open={!!shipmentToEmail}
          onClose={() => setShipmentToEmail(null)}
          shipment={shipmentToEmail}
          order={{
            id: order.id,
            order_number: order.order_number,
            organisations: order.organisations
              ? {
                  email: order.organisations.email ?? null,
                  trade_name: order.organisations.trade_name ?? null,
                }
              : null,
            individual_customers: order.individual_customers
              ? {
                  email: order.individual_customers.email ?? null,
                  first_name: order.individual_customers.first_name ?? null,
                  last_name: order.individual_customers.last_name ?? null,
                }
              : null,
          }}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}

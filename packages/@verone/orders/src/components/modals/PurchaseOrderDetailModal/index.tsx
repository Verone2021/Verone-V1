'use client';

import { OrganisationQuickViewModal } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { X } from 'lucide-react';

import { PurchaseOrderReceptionModal } from '../PurchaseOrderReceptionModal';

import type { PurchaseOrderDetailModalProps } from './types';
import { orderStatusColors, orderStatusLabels } from './types';
import { usePODetailState } from './use-po-detail-state';
import { PODetailMainColumn } from './PODetailMainColumn';
import { PODetailSidebar } from './PODetailSidebar';
import { POPaymentDialog } from './POPaymentDialog';

export function PurchaseOrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
  initialPaymentOpen = false,
}: PurchaseOrderDetailModalProps) {
  const state = usePODetailState(order, open, initialPaymentOpen, onUpdate);

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-7xl max-h-[90vh] overflow-y-auto"
          hideCloseButton
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl">
                  Commande {order.po_number}
                </DialogTitle>
                <Badge className={orderStatusColors[order.status]}>
                  {orderStatusLabels[order.status]}
                </Badge>
              </div>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </DialogHeader>

          {/* LAYOUT : Flex avec colonne principale + sidebar */}
          <div className="flex flex-col lg:flex-row gap-4 mt-3">
            <PODetailMainColumn order={order} totalEcoTax={state.totalEcoTax} />

            <PODetailSidebar
              order={order}
              orderPayments={state.orderPayments}
              linkedTransactions={state.linkedTransactions}
              invoices={state.invoices}
              isLoadingFinance={state.isLoadingFinance}
              canMarkAsPaid={state.canMarkAsPaid}
              canReceive={state.canReceive}
              paymentTerms={state.paymentTerms}
              receptionHistory={state.receptionHistory}
              cancellations={state.cancellations}
              formatDate={state.formatDate}
              getSupplierName={state.getSupplierName}
              onShowOrgModal={() => state.setShowOrgModal(true)}
              onShowReceivingModal={() => state.setShowReceivingModal(true)}
              onOpenPaymentDialog={state.openPaymentDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Quick View Organisation (fournisseur) */}
      {order.supplier_id && (
        <OrganisationQuickViewModal
          organisationId={order.supplier_id}
          open={state.showOrgModal}
          onOpenChange={state.setShowOrgModal}
        />
      )}

      {/* Modal Gestion Réception */}
      <PurchaseOrderReceptionModal
        order={order}
        open={state.showReceivingModal}
        onClose={() => state.setShowReceivingModal(false)}
        onSuccess={() => {
          state.setShowReceivingModal(false);
          onUpdate?.();
        }}
      />

      {/* Dialog Enregistrer un paiement */}
      <POPaymentDialog
        order={order}
        open={state.showPaymentDialog}
        onOpenChange={state.setShowPaymentDialog}
        orderTotalTtc={state.orderTotalTtc}
        totalPaid={state.totalPaid}
        unifiedRemaining={state.unifiedRemaining}
        isFullyPaid={state.isFullyPaid}
        orderPayments={state.orderPayments}
        existingLinks={state.existingLinks}
        deletingPaymentId={state.deletingPaymentId}
        onDeletePayment={state.handleDeletePayment}
        rapprochementOrder={state.rapprochementOrder}
        onLinksChanged={state.setExistingLinks}
        onRapprochementSuccess={state.refreshPayments}
        manualPaymentType={state.manualPaymentType}
        setManualPaymentType={state.setManualPaymentType}
        manualPaymentAmount={state.manualPaymentAmount}
        setManualPaymentAmount={state.setManualPaymentAmount}
        manualPaymentDate={state.manualPaymentDate}
        setManualPaymentDate={state.setManualPaymentDate}
        manualPaymentRef={state.manualPaymentRef}
        setManualPaymentRef={state.setManualPaymentRef}
        manualPaymentNote={state.manualPaymentNote}
        setManualPaymentNote={state.setManualPaymentNote}
        paymentSubmitting={state.paymentSubmitting}
        onSubmitManualPayment={() => {
          state.setPaymentSubmitting(true);
          void state
            .markAsManuallyPaid(
              order.id,
              state.manualPaymentType,
              parseFloat(state.manualPaymentAmount),
              {
                reference: state.manualPaymentRef || undefined,
                note: state.manualPaymentNote || undefined,
                date: state.manualPaymentDate
                  ? new Date(state.manualPaymentDate)
                  : undefined,
              }
            )
            .then(() => {
              state.refreshPayments();
              // Reset form for next payment
              state.setManualPaymentAmount(
                Math.max(
                  0,
                  state.unifiedRemaining -
                    parseFloat(state.manualPaymentAmount || '0')
                ).toFixed(2)
              );
              state.setManualPaymentRef('');
              state.setManualPaymentNote('');
            })
            .catch((err: unknown) => {
              console.error(
                '[PurchaseOrderDetailModal] Manual payment failed:',
                err
              );
            })
            .finally(() => state.setPaymentSubmitting(false));
        }}
        showDeletePaymentConfirmation={state.showDeletePaymentConfirmation}
        setShowDeletePaymentConfirmation={
          state.setShowDeletePaymentConfirmation
        }
        onDeletePaymentConfirmed={state.handleDeletePaymentConfirmed}
      />
    </>
  );
}

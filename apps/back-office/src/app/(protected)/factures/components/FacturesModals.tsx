'use client';

import { OrderDetailModal } from '@verone/orders/components/modals';
import type { SalesOrder } from '@verone/orders/hooks';
import { OrganisationQuickViewModal } from '@verone/organisations';
import {
  InvoiceUploadModal,
  RapprochementFromOrderModal,
  type TransactionForUpload,
  type OrderForLink,
} from '@verone/finance/components';
import { type TransactionMissingInvoice } from '@verone/finance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';

import type { QontoQuote } from './types';

interface FacturesModalsProps {
  // Upload modal
  transactionForUpload: TransactionForUpload | null;
  showUploadModal: boolean;
  setShowUploadModal: (v: boolean) => void;
  onUploadComplete: () => void;
  // Quote delete dialog
  quoteToDelete: QontoQuote | null;
  setQuoteToDelete: (q: QontoQuote | null) => void;
  deletingQuote: boolean;
  onDeleteQuote: () => void;
  // Order modal
  selectedOrderForModal: SalesOrder | null;
  showOrderModal: boolean;
  onCloseOrderModal: () => void;
  // Rapprochement modal
  showRapprochementModal: boolean;
  setShowRapprochementModal: (v: boolean) => void;
  rapprochementOrder: OrderForLink | null;
  onRapprochementSuccess: () => void;
  // Org modal
  selectedOrgId: string | null;
  showOrgModal: boolean;
  onOrgModalChange: (open: boolean) => void;
  // Missing invoice (for upload)
  selectedMissingTx: TransactionMissingInvoice | null;
}

export function FacturesModals({
  transactionForUpload,
  showUploadModal,
  setShowUploadModal,
  onUploadComplete,
  quoteToDelete,
  setQuoteToDelete,
  deletingQuote,
  onDeleteQuote,
  selectedOrderForModal,
  showOrderModal,
  onCloseOrderModal,
  showRapprochementModal,
  setShowRapprochementModal,
  rapprochementOrder,
  onRapprochementSuccess,
  selectedOrgId,
  showOrgModal,
  onOrgModalChange,
}: FacturesModalsProps) {
  return (
    <>
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={onUploadComplete}
      />

      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={open => !open && setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer le devis{' '}
              <strong>{quoteToDelete?.quote_number}</strong>. Cette action est
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingQuote}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteQuote}
              disabled={deletingQuote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingQuote ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderDetailModal
        order={selectedOrderForModal}
        open={showOrderModal}
        onClose={onCloseOrderModal}
        readOnly
      />

      <RapprochementFromOrderModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        order={rapprochementOrder}
        onSuccess={onRapprochementSuccess}
      />

      <OrganisationQuickViewModal
        organisationId={selectedOrgId}
        open={showOrgModal}
        onOpenChange={onOrgModalChange}
      />
    </>
  );
}

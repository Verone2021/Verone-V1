'use client';

import { useRouter } from 'next/navigation';

import {
  CreditNoteCreateModal,
  PaymentRecordModal,
  ReconcileTransactionModal,
} from '@verone/finance';
import type { IInvoiceForCreditNote } from '@verone/finance';
import { OrganisationQuickViewModal } from '@verone/organisations';
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
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Trash2,
  XCircle,
} from 'lucide-react';

import type { DocumentType } from './types';

interface DocumentDetailDialogsProps {
  id: string;
  documentType: DocumentType;
  docNumber: string;
  invoiceNumber: string | undefined;
  organisationId: string | null;
  invoiceForCreditNote: IInvoiceForCreditNote | null;
  computedTotals: {
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
  };
  currency: string;
  // Dialog open states
  showFinalizeDialog: boolean;
  showDeleteDialog: boolean;
  showConvertDialog: boolean;
  showCreditNoteDialog: boolean;
  showAcceptDialog: boolean;
  showDeclineDialog: boolean;
  showArchiveDialog: boolean;
  showPaymentModal: boolean;
  showReconcileModal: boolean;
  showOrgModal: boolean;
  // Setters
  setShowFinalizeDialog: (v: boolean) => void;
  setShowDeleteDialog: (v: boolean) => void;
  setShowConvertDialog: (v: boolean) => void;
  setShowCreditNoteDialog: (v: boolean) => void;
  setShowAcceptDialog: (v: boolean) => void;
  setShowDeclineDialog: (v: boolean) => void;
  setShowArchiveDialog: (v: boolean) => void;
  setShowPaymentModal: (v: boolean) => void;
  setShowReconcileModal: (v: boolean) => void;
  setShowOrgModal: (v: boolean) => void;
  // Handlers
  handleFinalize: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleConvertToInvoice: () => Promise<void>;
  handleAcceptQuote: () => Promise<void>;
  handleDeclineQuote: () => Promise<void>;
  handleArchive: () => Promise<void>;
}

export function DocumentDetailDialogs({
  id,
  documentType,
  docNumber,
  invoiceNumber,
  organisationId,
  invoiceForCreditNote,
  computedTotals,
  currency,
  showFinalizeDialog,
  showDeleteDialog,
  showConvertDialog,
  showCreditNoteDialog,
  showAcceptDialog,
  showDeclineDialog,
  showArchiveDialog,
  showPaymentModal,
  showReconcileModal,
  showOrgModal,
  setShowFinalizeDialog,
  setShowDeleteDialog,
  setShowConvertDialog,
  setShowCreditNoteDialog,
  setShowAcceptDialog,
  setShowDeclineDialog,
  setShowArchiveDialog,
  setShowPaymentModal,
  setShowReconcileModal,
  setShowOrgModal,
  handleFinalize,
  handleDelete,
  handleConvertToInvoice,
  handleAcceptQuote,
  handleDeclineQuote,
  handleArchive,
}: DocumentDetailDialogsProps) {
  const router = useRouter();

  return (
    <>
      {/* Finalize dialog */}
      <AlertDialog
        open={showFinalizeDialog}
        onOpenChange={setShowFinalizeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Finaliser ce document ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                Cette action est IRRÉVERSIBLE.
              </p>
              <p>
                Une fois finalisé, le document ne pourra plus être modifié ni
                supprimé. Il recevra un numéro officiel et sera enregistré
                définitivement.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                void handleFinalize().catch(error => {
                  console.error('[DocumentDetail] Finalize failed:', error);
                });
              }}
            >
              Oui, finaliser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Supprimer ce document ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                void handleDelete().catch(error => {
                  console.error('[DocumentDetail] Delete failed:', error);
                });
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to invoice dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action créera une facture basée sur ce devis. Le devis sera
              marqué comme converti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleConvertToInvoice().catch(error => {
                  console.error('[DocumentDetail] Convert failed:', error);
                });
              }}
            >
              Convertir en facture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create credit note modal */}
      <CreditNoteCreateModal
        invoice={invoiceForCreditNote}
        open={showCreditNoteDialog}
        onOpenChange={setShowCreditNoteDialog}
        onSuccess={(creditNoteId: string) => {
          router.push(`/factures/${creditNoteId}?type=credit_note`);
        }}
      />

      {/* Accept quote dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Accepter ce devis ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera marqué comme accepté par le client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                void handleAcceptQuote().catch(error => {
                  console.error('[DocumentDetail] Accept quote failed:', error);
                });
              }}
            >
              Marquer accepté
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline quote dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Refuser ce devis ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le devis sera marqué comme refusé par le client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                void handleDeclineQuote().catch(error => {
                  console.error(
                    '[DocumentDetail] Decline quote failed:',
                    error
                  );
                });
              }}
            >
              Marquer refusé
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archiver cette facture ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Cette facture sera masquée de la liste principale et déplacée
                dans les archives.
              </p>
              <p>
                Vous pourrez la restaurer depuis l&apos;onglet
                &quot;Archives&quot; si nécessaire.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleArchive().catch(error => {
                  console.error('[DocumentDetail] Archive failed:', error);
                });
              }}
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Record Modal */}
      {documentType === 'invoice' && (
        <PaymentRecordModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          invoiceId={id}
          invoiceNumber={invoiceNumber ?? docNumber}
          totalAmount={computedTotals.totalCents / 100}
          currency={currency}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Reconcile Transaction Modal */}
      {documentType === 'invoice' && (
        <ReconcileTransactionModal
          open={showReconcileModal}
          onOpenChange={setShowReconcileModal}
          invoiceId={id}
          invoiceNumber={invoiceNumber ?? docNumber}
          invoiceAmount={computedTotals.totalCents}
          currency={currency}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Organisation Quick View Modal */}
      <OrganisationQuickViewModal
        organisationId={organisationId}
        open={showOrgModal}
        onOpenChange={setShowOrgModal}
      />
    </>
  );
}

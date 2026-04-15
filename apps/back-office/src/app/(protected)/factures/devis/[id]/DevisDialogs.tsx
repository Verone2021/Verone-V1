'use client';

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
  SendDocumentEmailModal,
  DocumentEmailHistory,
} from '@verone/finance/components';
import type { DocumentEmail } from '@verone/finance/hooks';
import { Loader2 } from 'lucide-react';

import type { QontoQuoteDetail, StatusAction } from './types';

interface DevisDialogsProps {
  quote: QontoQuoteDetail;
  id: string;
  // Status action dialog
  confirmAction: StatusAction | null;
  onConfirmActionClose: () => void;
  onConfirmAction: (action: string) => void;
  actionLoading: boolean;
  // Email modal
  showEmailModal: boolean;
  onEmailModalClose: () => void;
  onEmailSent: () => void;
  // Delete dialog
  showDeleteConfirm: boolean;
  onDeleteConfirmClose: (open: boolean) => void;
  onDelete: () => void;
  // Email history
  documentEmails: DocumentEmail[];
  emailsLoading: boolean;
}

export function DevisDialogs({
  quote,
  id,
  confirmAction,
  onConfirmActionClose,
  onConfirmAction,
  actionLoading,
  showEmailModal,
  onEmailModalClose,
  onEmailSent,
  showDeleteConfirm,
  onDeleteConfirmClose,
  onDelete,
  documentEmails,
  emailsLoading,
}: DevisDialogsProps) {
  return (
    <>
      {/* Status transition confirmation */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={open => {
          if (!open) onConfirmActionClose();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  onConfirmAction(confirmAction.action);
                }
              }}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email sending modal */}
      <SendDocumentEmailModal
        open={showEmailModal}
        onClose={onEmailModalClose}
        documentType="quote"
        documentId={id}
        documentNumber={quote.number ?? quote.quote_number ?? id}
        clientEmail={quote.client?.email ?? ''}
        clientName={quote.client?.name ?? ''}
        pdfUrl={`/api/qonto/quotes/${id}/pdf`}
        onSent={onEmailSent}
      />

      {/* Email history */}
      <DocumentEmailHistory emails={documentEmails} loading={emailsLoading} />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={onDeleteConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le devis {quote.quote_number} sera supprime de Qonto. Cette action
              est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete();
              }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

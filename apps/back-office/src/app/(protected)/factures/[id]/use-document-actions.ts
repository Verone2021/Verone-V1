'use client';

import type { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  type DocumentType,
  type QontoDocument,
  type QontoApiResponse,
  getFriendlyErrorMessage,
} from './types';

interface UseDocumentActionsParams {
  id: string;
  document: QontoDocument | null;
  documentType: DocumentType;
  router: ReturnType<typeof useRouter>;
  setActionLoading: (v: string | null) => void;
  setShowFinalizeDialog: (v: boolean) => void;
  setShowDeleteDialog: (v: boolean) => void;
  setShowConvertDialog: (v: boolean) => void;
  setShowAcceptDialog: (v: boolean) => void;
  setShowDeclineDialog: (v: boolean) => void;
  setShowArchiveDialog: (v: boolean) => void;
  setShowAcceptQuoteGuard: (v: boolean) => void;
  linkedDraftOrderNumber: string | null;
}

export function useDocumentActions({
  id,
  document,
  documentType,
  router,
  setActionLoading,
  setShowFinalizeDialog,
  setShowDeleteDialog,
  setShowConvertDialog,
  setShowAcceptDialog,
  setShowDeclineDialog,
  setShowArchiveDialog,
  setShowAcceptQuoteGuard,
  linkedDraftOrderNumber,
}: UseDocumentActionsParams) {
  const handleFinalize = async () => {
    if (!document) return;
    setActionLoading('finalize');
    setShowFinalizeDialog(false);

    try {
      const endpoint =
        documentType === 'invoice'
          ? `/api/qonto/invoices/${id}/finalize`
          : documentType === 'quote'
            ? `/api/qonto/quotes/${id}/finalize`
            : `/api/qonto/credit-notes/${id}/finalize`;

      const response = await fetch(endpoint, { method: 'POST' });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Document finalisé avec succès');
      window.location.reload();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    setActionLoading('delete');
    setShowDeleteDialog(false);

    try {
      const endpoint =
        documentType === 'invoice'
          ? `/api/qonto/invoices/${id}/delete`
          : documentType === 'quote'
            ? `/api/qonto/quotes/${id}`
            : `/api/qonto/credit-notes/${id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Document supprimé');
      router.push('/factures');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!document || documentType !== 'quote') return;
    setActionLoading('convert');
    setShowConvertDialog(false);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/convert`, {
        method: 'POST',
      });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Devis converti en facture');
      if (data.invoice?.id) {
        router.push(`/factures/${data.invoice.id}?type=invoice`);
      } else {
        window.location.reload();
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptQuote = () => {
    if (!document || documentType !== 'quote') return;
    setShowAcceptDialog(false);

    // If a linked draft order exists, show the cascade guard before proceeding
    if (linkedDraftOrderNumber !== null) {
      setShowAcceptQuoteGuard(true);
      return;
    }

    // No linked draft order — proceed directly
    void handleAcceptQuoteConfirmed().catch(err => {
      console.error('[DocumentDetail] Accept quote failed:', err);
    });
  };

  const handleAcceptQuoteConfirmed = async () => {
    if (!document || documentType !== 'quote') return;
    setActionLoading('accept');
    setShowAcceptQuoteGuard(false);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/accept`, {
        method: 'POST',
      });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      if (data.validatedOrder) {
        toast.success(
          `Devis accepté. Commande ${data.validatedOrder.number} validée automatiquement.`
        );
      } else {
        toast.success('Devis accepté');
      }
      window.location.reload();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineQuote = async () => {
    if (!document || documentType !== 'quote') return;
    setActionLoading('decline');
    setShowDeclineDialog(false);

    try {
      const response = await fetch(`/api/qonto/quotes/${id}/decline`, {
        method: 'POST',
      });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Devis refusé');
      window.location.reload();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!document) return;
    setActionLoading('email');

    try {
      const endpoint =
        documentType === 'invoice'
          ? `/api/qonto/invoices/${id}/send`
          : documentType === 'quote'
            ? `/api/qonto/quotes/${id}/send`
            : `/api/qonto/credit-notes/${id}/send`;

      const response = await fetch(endpoint, { method: 'POST' });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Email envoyé au client');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!document) return;
    const pdfPath =
      documentType === 'invoice'
        ? `/api/qonto/invoices/${id}/pdf`
        : documentType === 'quote'
          ? `/api/qonto/quotes/${id}/pdf`
          : `/api/qonto/credit-notes/${id}/pdf`;
    window.open(pdfPath, '_blank');
  };

  const _handleMarkPaid = async () => {
    if (!document || documentType !== 'invoice') return;
    setActionLoading('markPaid');

    try {
      const response = await fetch(`/api/qonto/invoices/${id}/mark-paid`, {
        method: 'POST',
      });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Facture marquée comme payée');
      window.location.reload();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    if (!document) return;
    setActionLoading('archive');
    setShowArchiveDialog(false);

    try {
      const response = await fetch(`/api/financial-documents/${id}/archive`, {
        method: 'POST',
      });
      const data = (await response.json()) as QontoApiResponse;

      if (!data.success) throw new Error(data.error);

      toast.success('Facture archivée avec succès');
      router.push('/factures');
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  return {
    handleFinalize,
    handleDelete,
    handleConvertToInvoice,
    handleAcceptQuote,
    handleAcceptQuoteConfirmed,
    handleDeclineQuote,
    handleSendEmail,
    handleDownloadPdf,
    _handleMarkPaid,
    handleArchive,
  };
}

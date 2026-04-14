'use client';

import { useState } from 'react';

import { toast } from 'sonner';

import type {
  Invoice,
  QontoQuote,
  CreditNote,
  ApiResponse,
  InvoicesResponse,
  QontoQuotesResponse,
  CreditNotesResponse,
} from '../components/types';

export interface FacturesFetchState {
  invoices: Invoice[];
  loadingInvoices: boolean;
  errorInvoices: string | null;
  setErrorInvoices: (v: string | null) => void;
  fetchInvoicesAsync: () => Promise<void>;
  qontoQuotes: QontoQuote[];
  loadingQuotes: boolean;
  errorQuotes: string | null;
  fetchQontoQuotesAsync: () => Promise<void>;
  creditNotes: CreditNote[];
  loadingCreditNotes: boolean;
  errorCreditNotes: string | null;
  fetchCreditNotesAsync: () => Promise<void>;
  quoteToDelete: QontoQuote | null;
  setQuoteToDelete: (q: QontoQuote | null) => void;
  deletingQuote: boolean;
  handleDeleteQuote: () => void;
  handleDownloadInvoicePdf: (invoice: Invoice) => void;
  handleDownloadQuotePdf: (quote: QontoQuote) => void;
  handleDownloadCreditNotePdf: (creditNote: CreditNote) => void;
}

export function useFacturesFetch(): FacturesFetchState {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  const [qontoQuotes, setQontoQuotes] = useState<QontoQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false);
  const [errorCreditNotes, setErrorCreditNotes] = useState<string | null>(null);

  const [quoteToDelete, setQuoteToDelete] = useState<QontoQuote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState(false);

  const fetchInvoicesAsync = async (): Promise<void> => {
    setLoadingInvoices(true);
    setErrorInvoices(null);
    try {
      const response = await fetch('/api/qonto/invoices');
      const data = (await response.json()) as InvoicesResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error ?? 'Failed to fetch invoices');
      setInvoices(data.invoices ?? []);
    } catch (err) {
      setErrorInvoices(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchQontoQuotesAsync = async (): Promise<void> => {
    setLoadingQuotes(true);
    setErrorQuotes(null);
    try {
      const response = await fetch('/api/qonto/quotes');
      const data = (await response.json()) as QontoQuotesResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error ?? 'Failed to fetch quotes');
      setQontoQuotes(data.quotes ?? []);
    } catch (err) {
      setErrorQuotes(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchCreditNotesAsync = async (): Promise<void> => {
    setLoadingCreditNotes(true);
    setErrorCreditNotes(null);
    try {
      const response = await fetch('/api/qonto/credit-notes');
      const data = (await response.json()) as CreditNotesResponse;
      if (!response.ok || !data.success)
        throw new Error(data.error ?? 'Failed to fetch credit notes');
      setCreditNotes(data.credit_notes ?? []);
    } catch (err) {
      setErrorCreditNotes(
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
    } finally {
      setLoadingCreditNotes(false);
    }
  };

  const handleDeleteQuote = (): void => {
    if (!quoteToDelete) return;
    setDeletingQuote(true);
    void (async () => {
      try {
        const response = await fetch(`/api/qonto/quotes/${quoteToDelete.id}`, {
          method: 'DELETE',
        });
        const data = (await response.json()) as ApiResponse<unknown>;
        if (!response.ok || !data.success)
          throw new Error(data.error ?? 'Erreur lors de la suppression');
        toast.success('Devis supprime');
        void fetchQontoQuotesAsync();
      } catch (err) {
        console.error('[Factures] deleteQuote error:', err);
        toast.error(
          err instanceof Error ? err.message : 'Erreur de suppression'
        );
      } finally {
        setDeletingQuote(false);
        setQuoteToDelete(null);
      }
    })();
  };

  const handleDownloadInvoicePdf = (invoice: Invoice): void => {
    void (async () => {
      try {
        const response = await fetch(`/api/qonto/invoices/${invoice.id}/pdf`);
        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            errorData.error ??
              `Erreur ${response.status}: ${response.statusText}`
          );
        }
        const blob = await response.blob();
        if (blob.size === 0) throw new Error('Le PDF est vide');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoice.number}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 1000);
      } catch (err) {
        console.error('Download error:', err);
        setErrorInvoices(
          err instanceof Error ? err.message : 'Erreur de telechargement'
        );
      }
    })();
  };

  const handleDownloadQuotePdf = (quote: QontoQuote): void => {
    void (async () => {
      try {
        const response = await fetch(`/api/qonto/quotes/${quote.id}/pdf`);
        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            errorData.error ??
              `Erreur ${response.status}: ${response.statusText}`
          );
        }
        const blob = await response.blob();
        if (blob.size === 0) throw new Error('Le PDF est vide');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devis-${quote.quote_number}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 1000);
      } catch (err) {
        console.error('[Quote] Download PDF error:', err);
        toast.error(
          err instanceof Error ? err.message : 'Erreur de telechargement'
        );
      }
    })();
  };

  const handleDownloadCreditNotePdf = (creditNote: CreditNote): void => {
    void (async () => {
      try {
        const response = await fetch(
          `/api/qonto/credit-notes/${creditNote.id}/pdf`
        );
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `avoir-${creditNote.credit_note_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Download error:', err);
      }
    })();
  };

  return {
    invoices,
    loadingInvoices,
    errorInvoices,
    setErrorInvoices,
    fetchInvoicesAsync,
    qontoQuotes,
    loadingQuotes,
    errorQuotes,
    fetchQontoQuotesAsync,
    creditNotes,
    loadingCreditNotes,
    errorCreditNotes,
    fetchCreditNotesAsync,
    quoteToDelete,
    setQuoteToDelete,
    deletingQuote,
    handleDeleteQuote,
    handleDownloadInvoicePdf,
    handleDownloadQuotePdf,
    handleDownloadCreditNotePdf,
  };
}

'use client';

/**
 * [BO-PERF-TANSTACK-001] Migré vers useQuery pour les 3 listes Qonto.
 * Avant : useState + useCallback fetch manuel, re-fetch à chaque switch d'onglet.
 * Après : cache partagé staleTime 60s — switch d'onglet = cache hit, 0 requête.
 * Les fonctions fetchXxxAsync sont préservées (API publique) mais deviennent
 * des invalidations de cache plutôt que des fetches directs.
 */

import { useCallback, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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

// --- Fonctions fetch pures (queryFn) ---

async function fetchInvoicesFromApi(): Promise<Invoice[]> {
  const response = await fetch('/api/qonto/invoices');
  const data = (await response.json()) as InvoicesResponse;
  if (!response.ok || !data.success)
    throw new Error(data.error ?? 'Failed to fetch invoices');
  return data.invoices ?? [];
}

async function fetchQuotesFromApi(): Promise<QontoQuote[]> {
  const response = await fetch('/api/qonto/quotes');
  const data = (await response.json()) as QontoQuotesResponse;
  if (!response.ok || !data.success)
    throw new Error(data.error ?? 'Failed to fetch quotes');
  return data.quotes ?? [];
}

async function fetchCreditNotesFromApi(): Promise<CreditNote[]> {
  const response = await fetch('/api/qonto/credit-notes');
  const data = (await response.json()) as CreditNotesResponse;
  if (!response.ok || !data.success)
    throw new Error(data.error ?? 'Failed to fetch credit notes');
  return data.credit_notes ?? [];
}

export function useFacturesFetch(): FacturesFetchState {
  const queryClient = useQueryClient();

  // État local pour les erreurs (non géré par useQuery car les consumers
  // lisent errorInvoices directement et le clearent via setErrorInvoices)
  const [errorInvoicesOverride, setErrorInvoices] = useState<string | null>(
    null
  );
  const [quoteToDelete, setQuoteToDelete] = useState<QontoQuote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState(false);

  // --- useQuery #1 : factures ---
  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    error: invoicesError,
  } = useQuery({
    queryKey: ['invoices', 'list'],
    queryFn: fetchInvoicesFromApi,
    staleTime: 60_000,
  });

  // --- useQuery #2 : devis Qonto (lazy : pas de fetch automatique au mount) ---
  const {
    data: qontoQuotes = [],
    isLoading: loadingQuotes,
    error: quotesError,
  } = useQuery({
    queryKey: ['quotes', 'list'],
    queryFn: fetchQuotesFromApi,
    staleTime: 60_000,
    // enabled: false par défaut — chargé à la demande via fetchQontoQuotesAsync
    // Mais on l'active au premier appel via prefetch/invalidation.
    // On garde enabled:true pour que useQuery refetch si le cache est périmé.
    enabled: true,
  });

  // --- useQuery #3 : avoirs ---
  const {
    data: creditNotes = [],
    isLoading: loadingCreditNotes,
    error: creditNotesError,
  } = useQuery({
    queryKey: ['credit_notes', 'list'],
    queryFn: fetchCreditNotesFromApi,
    staleTime: 60_000,
    enabled: true,
  });

  const errorInvoices =
    errorInvoicesOverride ??
    (invoicesError instanceof Error ? invoicesError.message : null);
  const errorQuotes = quotesError instanceof Error ? quotesError.message : null;
  const errorCreditNotes =
    creditNotesError instanceof Error ? creditNotesError.message : null;

  // --- Compat API : fonctions fetchXxxAsync deviennent des invalidations ---
  const fetchInvoicesAsync = useCallback(async (): Promise<void> => {
    setErrorInvoices(null);
    await queryClient.invalidateQueries({ queryKey: ['invoices', 'list'] });
  }, [queryClient]);

  const fetchQontoQuotesAsync = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['quotes', 'list'] });
  }, [queryClient]);

  const fetchCreditNotesAsync = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['credit_notes', 'list'] });
  }, [queryClient]);

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
        await queryClient.invalidateQueries({ queryKey: ['quotes', 'list'] });
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

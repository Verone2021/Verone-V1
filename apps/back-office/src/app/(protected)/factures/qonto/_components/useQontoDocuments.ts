'use client';

import { useState, useCallback } from 'react';

import type {
  QontoInvoice,
  QontoQuote,
  QontoCreditNote,
  QontoInvoicesResponse,
  QontoQuotesResponse,
  QontoCreditNotesResponse,
} from './types';

interface QontoDocumentsState {
  invoices: QontoInvoice[];
  quotes: QontoQuote[];
  creditNotes: QontoCreditNote[];
  loadingInvoices: boolean;
  loadingQuotes: boolean;
  loadingCreditNotes: boolean;
  errorInvoices: string | null;
  errorQuotes: string | null;
  errorCreditNotes: string | null;
  fetchInvoices: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchCreditNotes: () => Promise<void>;
}

export function useQontoDocuments(): QontoDocumentsState {
  const [invoices, setInvoices] = useState<QontoInvoice[]>([]);
  const [quotes, setQuotes] = useState<QontoQuote[]>([]);
  const [creditNotes, setCreditNotes] = useState<QontoCreditNote[]>([]);

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(true);

  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);
  const [errorQuotes, setErrorQuotes] = useState<string | null>(null);
  const [errorCreditNotes, setErrorCreditNotes] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (): Promise<void> => {
    setLoadingInvoices(true);
    setErrorInvoices(null);
    try {
      const response = await fetch('/api/qonto/invoices');
      const data = (await response.json()) as QontoInvoicesResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur chargement factures');
      }
      setInvoices(data.invoices ?? []);
    } catch (err: unknown) {
      setErrorInvoices(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const fetchQuotes = useCallback(async (): Promise<void> => {
    setLoadingQuotes(true);
    setErrorQuotes(null);
    try {
      const response = await fetch('/api/qonto/quotes');
      const data = (await response.json()) as QontoQuotesResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur chargement devis');
      }
      setQuotes(data.quotes ?? []);
    } catch (err: unknown) {
      setErrorQuotes(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  const fetchCreditNotes = useCallback(async (): Promise<void> => {
    setLoadingCreditNotes(true);
    setErrorCreditNotes(null);
    try {
      const response = await fetch('/api/qonto/credit-notes');
      const data = (await response.json()) as QontoCreditNotesResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur chargement avoirs');
      }
      setCreditNotes(data.credit_notes ?? []);
    } catch (err: unknown) {
      setErrorCreditNotes(
        err instanceof Error ? err.message : 'Erreur inconnue'
      );
    } finally {
      setLoadingCreditNotes(false);
    }
  }, []);

  return {
    invoices,
    quotes,
    creditNotes,
    loadingInvoices,
    loadingQuotes,
    loadingCreditNotes,
    errorInvoices,
    errorQuotes,
    errorCreditNotes,
    fetchInvoices,
    fetchQuotes,
    fetchCreditNotes,
  };
}

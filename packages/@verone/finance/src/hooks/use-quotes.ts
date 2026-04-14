/**
 * Hook: useQuotes
 * Description: CRUD for customer quotes (devis) stored locally in financial_documents
 *
 * Quotes are stored in financial_documents with document_type = 'customer_quote'.
 * They can optionally be synced to Qonto for PDF generation and sending.
 *
 * Lifecycle: draft -> validated -> sent -> accepted/declined/expired -> converted (to invoice)
 */

'use client';

import { useQuotesList } from './quotes/use-quotes-list';
import { useQuotesMutations } from './quotes/use-quotes-mutations';

// Re-export all types for backwards compatibility
export type {
  QuoteStatus,
  QuoteItemProduct,
  QuoteItem,
  Quote,
  QuoteFilters,
  QuoteStats,
  CreateQuoteItemData,
  CreateQuoteData,
  UpdateQuoteData,
} from './quotes/types';

export function useQuotes(
  initialFilters?: import('./quotes/types').QuoteFilters
) {
  const list = useQuotesList(initialFilters);
  const mutations = useQuotesMutations(list.fetchQuotes);

  return {
    quotes: list.quotes,
    loading: list.loading,
    error: list.error,
    stats: list.stats,
    filters: list.filters,
    setFilters: list.setFilters,
    fetchQuotes: list.fetchQuotes,
    fetchQuote: list.fetchQuote,
    createQuote: mutations.createQuote,
    updateQuote: mutations.updateQuote,
    changeQuoteStatus: mutations.changeQuoteStatus,
    deleteQuote: mutations.deleteQuote,
  };
}

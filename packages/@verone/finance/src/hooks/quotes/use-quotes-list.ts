'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { Quote, QuoteFilters, QuoteStats } from './types';
import { QUOTE_SELECT_FIELDS } from './helpers';

export function useQuotesList(initialFilters?: QuoteFilters) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuoteFilters>(initialFilters ?? {});
  const [stats, setStats] = useState<QuoteStats>({
    total: 0,
    draft: 0,
    validated: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    converted: 0,
    total_ht: 0,
  });

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = supabase
        .from('financial_documents')
        .select(QUOTE_SELECT_FIELDS)
        .eq('document_type', 'customer_quote')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters.quote_status && filters.quote_status !== 'all') {
        query = query.eq('quote_status', filters.quote_status);
      }
      if (filters.channel_id) {
        query = query.eq('channel_id', filters.channel_id);
      }
      if (filters.date_from) {
        query = query.gte('document_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('document_date', filters.date_to);
      }
      if (filters.search) {
        query = query.or(
          `document_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw new Error(fetchError.message);

      const typedData = (data ?? []) as unknown as Quote[];
      setQuotes(typedData);

      const newStats: QuoteStats = {
        total: typedData.length,
        draft: 0,
        validated: 0,
        sent: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
        converted: 0,
        total_ht: 0,
      };
      for (const q of typedData) {
        const status = q.quote_status;
        if (status === 'draft') newStats.draft += 1;
        else if (status === 'validated') newStats.validated += 1;
        else if (status === 'sent') newStats.sent += 1;
        else if (status === 'accepted') newStats.accepted += 1;
        else if (status === 'declined') newStats.declined += 1;
        else if (status === 'expired') newStats.expired += 1;
        else if (status === 'converted') newStats.converted += 1;
        newStats.total_ht += q.total_ht ?? 0;
      }
      setStats(newStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('[useQuotesList] fetchQuotes error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchQuote = useCallback(
    async (quoteId: string): Promise<Quote | null> => {
      try {
        const supabase = createClient();

        const { data, error: fetchErr } = await supabase
          .from('financial_documents')
          .select(QUOTE_SELECT_FIELDS)
          .eq('id', quoteId)
          .eq('document_type', 'customer_quote')
          .is('deleted_at', null)
          .single();

        if (fetchErr) throw new Error(fetchErr.message);

        return (data as unknown as Quote) ?? null;
      } catch (err) {
        console.error('[useQuotesList] fetchQuote error:', err);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    void fetchQuotes().catch((err: unknown) => {
      console.error('[useQuotesList] auto-fetch error:', err);
    });
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    error,
    stats,
    filters,
    setFilters,
    fetchQuotes,
    fetchQuote,
  };
}

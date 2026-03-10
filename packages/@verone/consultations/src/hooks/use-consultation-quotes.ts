'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ── Types ────────────────────────────────────────────────────────────

export interface ConsultationQuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  total_ht: number;
}

export interface ConsultationQuote {
  id: string;
  document_number: string;
  document_date: string;
  quote_status: string;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  validity_date: string | null;
  notes: string | null;
  qonto_pdf_url: string | null;
  qonto_invoice_id: string | null;
  created_at: string;
  partner: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  items: ConsultationQuoteItem[];
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useConsultationQuotes(consultationId: string | undefined) {
  const [quotes, setQuotes] = useState<ConsultationQuote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = useCallback(async () => {
    if (!consultationId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('financial_documents')
        .select(
          `
          id, document_number, document_date, quote_status,
          total_ht, total_ttc, tva_amount, validity_date, notes,
          qonto_pdf_url, qonto_invoice_id, created_at,
          partner:organisations!financial_documents_partner_id_fkey(id, legal_name, trade_name),
          items:financial_document_items(id, description, quantity, unit_price_ht, tva_rate, total_ht)
        `
        )
        .eq('consultation_id', consultationId)
        .eq('document_type', 'customer_quote')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      setQuotes((data ?? []) as unknown as ConsultationQuote[]);
    } catch (err) {
      console.error('[useConsultationQuotes] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    void fetchQuotes().catch((err: unknown) => {
      console.error('[useConsultationQuotes] auto-fetch error:', err);
    });
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    fetchQuotes,
  };
}

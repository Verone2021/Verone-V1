'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Database } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

// Type from Supabase generated types
type ViewRow =
  Database['public']['Views']['v_transactions_missing_invoice']['Row'];

// Export interface with non-null fields for required properties
export interface TransactionMissingInvoice {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  side: string;
  label: string;
  counterparty_name: string | null;
  emitted_at: string;
  settled_at: string | null;
  matching_status: string;
  matched_document_id: string | null;
  has_attachment: boolean;
  financial_document_id: string | null;
  document_number: string | null;
  invoice_source: string | null;
  upload_status: string | null;
  qonto_attachment_id: string | null;
  sales_order_id: string | null;
  order_number: string | null;
  customer_id: string | null;
}

interface UseMissingInvoicesResult {
  transactions: TransactionMissingInvoice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  count: number;
}

// Transform DB row to our interface (handle nulls)
function transformRow(row: ViewRow): TransactionMissingInvoice {
  return {
    id: row.id ?? '',
    transaction_id: row.transaction_id ?? '',
    amount: row.amount ?? 0,
    currency: row.currency ?? 'EUR',
    side: row.side ?? 'credit',
    label: row.label ?? '',
    counterparty_name: row.counterparty_name,
    emitted_at: row.emitted_at ?? '',
    settled_at: row.settled_at,
    matching_status: row.matching_status ?? 'unmatched',
    matched_document_id: row.matched_document_id,
    has_attachment: row.has_attachment ?? false,
    financial_document_id: row.financial_document_id,
    document_number: row.document_number,
    invoice_source: row.invoice_source,
    upload_status: row.upload_status,
    qonto_attachment_id: row.qonto_attachment_id,
    sales_order_id: row.sales_order_id,
    order_number: row.order_number,
    customer_id: row.customer_id,
  };
}

export function useMissingInvoices(): UseMissingInvoicesResult {
  const [transactions, setTransactions] = useState<TransactionMissingInvoice[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from('v_transactions_missing_invoice')
        .select('*')
        .order('emitted_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setTransactions(data?.map(transformRow) ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions,
    count: transactions.length,
  };
}

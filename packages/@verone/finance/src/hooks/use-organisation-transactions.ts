/**
 * Hook: Organisation Transactions
 * Description: Transactions bancaires liées à une organisation spécifique
 */

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface OrganisationTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  side: 'credit' | 'debit';
  label: string;
  reference: string | null;
  counterparty_name: string | null;
  emitted_at: string;
  settled_at: string | null;
  has_attachment: boolean;
  attachment_id: string | null;
  matching_status: string;
  category: string | null;
}

interface UseOrganisationTransactionsReturn {
  transactions: OrganisationTransaction[];
  stats: {
    total: number;
    totalCredits: number;
    totalDebits: number;
    creditAmount: number;
    debitAmount: number;
    withAttachment: number;
  };
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Extrait l'ID de la première pièce jointe depuis raw_data Qonto
 */
function extractFirstAttachmentId(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== 'object') return null;
  const data = rawData as Record<string, unknown>;

  if (Array.isArray(data.attachments) && data.attachments.length > 0) {
    const first = data.attachments[0] as Record<string, unknown>;
    return first?.id ? String(first.id) : null;
  }

  return null;
}

export function useOrganisationTransactions(
  organisationId: string | null
): UseOrganisationTransactionsReturn {
  const [transactions, setTransactions] = useState<OrganisationTransaction[]>(
    []
  );
  const [stats, setStats] = useState({
    total: 0,
    totalCredits: 0,
    totalDebits: 0,
    creditAmount: 0,
    debitAmount: 0,
    withAttachment: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    if (!organisationId) {
      setTransactions([]);
      setStats({
        total: 0,
        totalCredits: 0,
        totalDebits: 0,
        creditAmount: 0,
        debitAmount: 0,
        withAttachment: 0,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Requête via la vue v_expenses_with_details qui a organisation_id
      const { data, error: fetchError } = await supabase
        .from('bank_transactions')
        .select(
          `
          id,
          transaction_id,
          amount,
          currency,
          side,
          label,
          reference,
          counterparty_name,
          emitted_at,
          settled_at,
          matching_status,
          raw_data
        `
        )
        .eq('counterparty_organisation_id', organisationId)
        .order('emitted_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transformer les données
      const transformedData: OrganisationTransaction[] = (data || []).map(
        tx => {
          const attachmentId = extractFirstAttachmentId(tx.raw_data);
          return {
            id: tx.id,
            transaction_id: tx.transaction_id,
            amount: tx.amount,
            currency: tx.currency || 'EUR',
            side: tx.side,
            label: tx.label,
            reference: tx.reference,
            counterparty_name: tx.counterparty_name,
            emitted_at: tx.emitted_at,
            settled_at: tx.settled_at,
            has_attachment: !!attachmentId,
            attachment_id: attachmentId,
            matching_status: tx.matching_status || 'unmatched',
            category: null,
          };
        }
      );

      // Calculer les stats
      const credits = transformedData.filter(tx => tx.side === 'credit');
      const debits = transformedData.filter(tx => tx.side === 'debit');
      const withAttachment = transformedData.filter(tx => tx.has_attachment);

      setTransactions(transformedData);
      setStats({
        total: transformedData.length,
        totalCredits: credits.length,
        totalDebits: debits.length,
        creditAmount: credits.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        debitAmount: debits.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        withAttachment: withAttachment.length,
      });
    } catch (err) {
      console.error('[useOrganisationTransactions] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [organisationId, supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    stats,
    loading,
    error,
    refresh: fetchTransactions,
  };
}

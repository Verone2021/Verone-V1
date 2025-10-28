// =====================================================================
// Hook: Bank Reconciliation
// Date: 2025-10-11
// Description: Gestion rapprochement bancaire - transactions unmatched + factures unpaid
// STATUS: DÉSACTIVÉ Phase 1 (returns mocks uniquement)
// =====================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BankTransaction } from '@/lib/qonto/types';
import { featureFlags } from '@/lib/feature-flags';

// =====================================================================
// TYPES
// =====================================================================

interface UnmatchedTransaction extends BankTransaction {
  suggestions?: MatchSuggestion[];
}

interface MatchSuggestion {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  invoice_amount: number;
  confidence: number;
  match_reason: string;
}

interface UnpaidInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_type: 'organisation' | 'individual';
  customer_name: string;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  status: string;
  issue_date: string;
  due_date: string;
  days_overdue: number | null;
}

interface ReconciliationStats {
  total_unmatched: number;
  total_amount_pending: number;
  auto_match_rate: number;
  manual_review_count: number;
}

// =====================================================================
// HOOK
// =====================================================================

export function useBankReconciliation() {
  const [unmatchedTransactions, setUnmatchedTransactions] = useState<UnmatchedTransaction[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // FEATURE FLAG: FINANCE MODULE DISABLED (Phase 1)
  // ===================================================================

  if (!featureFlags.financeEnabled) {
    // Return mocks immédiatement pour éviter appels API/Supabase
    return {
      unmatchedTransactions: [],
      unpaidInvoices: [],
      stats: {
        total_unmatched: 0,
        total_amount_pending: 0,
        auto_match_rate: 0,
        manual_review_count: 0
      },
      loading: false,
      error: 'Module Finance désactivé (Phase 1)',
      matchTransaction: async () => {},
      ignoreTransaction: async () => {},
      refresh: () => {}
    }
  }

  // ===================================================================
  // FETCH DATA
  // ===================================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // 1. Fetch unmatched transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('matching_status', 'unmatched')
        .eq('side', 'credit') // Seulement les entrées d'argent
        .order('settled_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // 2. Fetch unpaid invoices from financial_documents
      // TEMP FIX: Utiliser financial_documents au lieu de invoices (migration en cours)
      const { data: invoices, error: invoicesError } = await supabase
        .from('financial_documents')
        .select(`
          id,
          document_number,
          partner_id,
          partner_type,
          total_ttc,
          amount_paid,
          status,
          document_date,
          due_date
        `)
        .eq('document_type', 'customer_invoice')
        .in('status', ['sent', 'overdue', 'partially_paid'])
        .order('document_date', { ascending: false });

      // Si erreur OU table vide, retourner état vide gracieusement
      if (invoicesError || !invoices || invoices.length === 0) {
        console.warn('No invoices found in financial_documents, feature disabled temporarily');
        setUnmatchedTransactions(transactions || []);
        setUnpaidInvoices([]);
        setStats({
          total_unmatched: transactions?.length || 0,
          total_amount_pending: 0,
          auto_match_rate: 0,
          manual_review_count: 0,
        });
        setLoading(false);
        return;
      }

      // 3. Enrichir invoices avec customer_name et calculer amount_remaining
      const enrichedInvoices: UnpaidInvoice[] = await Promise.all(
        (invoices || []).map(async (invoice: any) => {
          let customerName = 'N/A';

          if (invoice.partner_type === 'organisation') {
            const { data: org } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', invoice.partner_id)
              .single();
            customerName = (org?.trade_name || org?.legal_name) || 'N/A';
          } else {
            const { data: individual } = await supabase
              .from('individual_customers')
              .select('first_name, last_name')
              .eq('id', invoice.partner_id)
              .single();
            customerName = individual
              ? `${individual.first_name} ${individual.last_name}`
              : 'N/A';
          }

          // Calculer jours overdue
          let daysOverdue = null;
          if (invoice.due_date && invoice.status === 'overdue') {
            const today = new Date();
            const dueDate = new Date(invoice.due_date);
            daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          return {
            id: invoice.id,
            invoice_number: invoice.document_number,
            customer_id: invoice.partner_id,
            customer_type: invoice.partner_type,
            customer_name: customerName,
            total_amount: invoice.total_ttc,
            amount_paid: invoice.amount_paid || 0,
            amount_remaining: invoice.total_ttc - (invoice.amount_paid || 0),
            status: invoice.status,
            issue_date: invoice.document_date,
            due_date: invoice.due_date,
            days_overdue: daysOverdue,
          };
        })
      );

      // 4. Générer suggestions pour chaque transaction
      const transactionsWithSuggestions: UnmatchedTransaction[] = (transactions || []).map(
        (transaction) => {
          const suggestions = generateMatchSuggestions(
            transaction,
            enrichedInvoices
          );
          return {
            ...transaction,
            suggestions,
          };
        }
      );

      // 5. Calculer statistiques
      const totalUnmatched = transactionsWithSuggestions.length;
      const totalAmountPending = transactionsWithSuggestions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );

      // Auto-match rate basé sur confidence >= 80%
      const autoMatchableCount = transactionsWithSuggestions.filter(
        (tx) => tx.suggestions && tx.suggestions[0]?.confidence >= 80
      ).length;
      const autoMatchRate = totalUnmatched > 0 ? (autoMatchableCount / totalUnmatched) * 100 : 0;

      const manualReviewCount = totalUnmatched - autoMatchableCount;

      setUnmatchedTransactions(transactionsWithSuggestions);
      setUnpaidInvoices(enrichedInvoices);
      setStats({
        total_unmatched: totalUnmatched,
        total_amount_pending: totalAmountPending,
        auto_match_rate: autoMatchRate,
        manual_review_count: manualReviewCount,
      });
    } catch (err: any) {
      console.error('Error fetching reconciliation data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===================================================================
  // MATCH TRANSACTION (Manuel)
  // ===================================================================

  const matchTransaction = async (
    transactionId: string,
    invoiceId: string,
    notes?: string
  ) => {
    try {
      const supabase = createClient();

      // 1. Récupérer transaction et facture
      const { data: transaction } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      const { data: invoice } = await supabase
        .from('financial_documents')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!transaction || !invoice) {
        throw new Error('Transaction ou facture introuvable');
      }

      // 2. Créer paiement
      const { data: payment, error: paymentError }: { data: { id: string; [key: string]: any } | null; error: any } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount: (transaction as any).amount,
          payment_date: transaction.settled_at || transaction.emitted_at,
          payment_method: 'bank_transfer',
          reference: transaction.transaction_id,
          notes: notes || `Manual match - Confidence: Manual review`,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 3. Update transaction
      const { error: txUpdateError } = await supabase
        .from('bank_transactions')
        .update({
          matching_status: 'manual_matched',
          matched_payment_id: payment.id,
          matched_invoice_id: invoiceId,
          confidence_score: 100,
          match_reason: 'Manual validation by admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (txUpdateError) throw txUpdateError;

      // 4. Update invoice (financial_documents)
      const newAmountPaid = (invoice.amount_paid || 0) + (transaction as any).amount;
      const newStatus = newAmountPaid >= invoice.total_ttc ? 'paid' : invoice.status;

      const { error: invoiceUpdateError } = await supabase
        .from('financial_documents')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (invoiceUpdateError) throw invoiceUpdateError;

      // 5. Refresh data
      await fetchData();

      return { success: true, payment };
    } catch (err: any) {
      console.error('Error matching transaction:', err);
      throw err;
    }
  };

  // ===================================================================
  // IGNORE TRANSACTION
  // ===================================================================

  const ignoreTransaction = async (transactionId: string, reason: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('bank_transactions')
        .update({
          matching_status: 'ignored',
          match_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;

      // Refresh data
      await fetchData();

      return { success: true };
    } catch (err: any) {
      console.error('Error ignoring transaction:', err);
      throw err;
    }
  };

  // ===================================================================
  // AUTO-MATCH SUGGESTION (Client-side algorithm)
  // ===================================================================

  function generateMatchSuggestions(
    transaction: BankTransaction,
    invoices: UnpaidInvoice[]
  ): MatchSuggestion[] {
    const suggestions: MatchSuggestion[] = [];

    for (const invoice of invoices) {
      let confidence = 0;
      const reasons: string[] = [];

      // Stratégie 1: Match exact montant (±1€ tolérance)
      const amountDiff = Math.abs(transaction.amount - invoice.amount_remaining);
      if (amountDiff < 1) {
        confidence += 50;
        reasons.push('Montant exact');
      } else if (amountDiff < 10) {
        confidence += 30;
        reasons.push('Montant proche');
      }

      // Stratégie 2: Référence facture dans label
      if (transaction.label.includes(invoice.invoice_number)) {
        confidence += 50;
        reasons.push('Référence facture dans label');
      }

      // Stratégie 3: Nom client dans label ou counterparty
      if (
        transaction.label.toLowerCase().includes(invoice.customer_name.toLowerCase()) ||
        transaction.counterparty_name?.toLowerCase().includes(invoice.customer_name.toLowerCase())
      ) {
        confidence += 20;
        reasons.push('Nom client correspondant');
      }

      // Stratégie 4: Date proche (±7 jours de la facture)
      if (transaction.settled_at && invoice.issue_date) {
        const txDate = new Date(transaction.settled_at);
        const invoiceDate = new Date(invoice.issue_date);
        const daysDiff = Math.abs(
          (txDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 7) {
          confidence += 10;
          reasons.push('Date proche');
        }
      }

      // Ajouter suggestion si confidence >= 50%
      if (confidence >= 50) {
        suggestions.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          invoice_amount: invoice.amount_remaining,
          confidence,
          match_reason: reasons.join(', '),
        });
      }
    }

    // Trier par confidence décroissante
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3); // Top 3
  }

  return {
    unmatchedTransactions,
    unpaidInvoices,
    stats,
    loading,
    error,
    matchTransaction,
    ignoreTransaction,
    refresh: fetchData,
  };
}

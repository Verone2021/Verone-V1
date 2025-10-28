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
  const supabase = createClient()
  const [unmatchedTransactions, setUnmatchedTransactions] = useState<UnmatchedTransaction[]>([])
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([])
  const [stats, setStats] = useState<ReconciliationStats>({
    total_unmatched: 0,
    total_amount_pending: 0,
    auto_match_rate: 0,
    manual_review_count: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch unmatched transactions (simulated from audit_logs for now)
  const fetchUnmatchedTransactions = useCallback(async () => {
    try {
      setLoading(true)

      // ⚠️ IMPORTANT: Actuellement, on utilise audit_logs comme placeholder
      // TODO: Créer table bank_transactions dédiée avec colonnes:
      // - transaction_id, amount, transaction_date, description, bank_name, reference
      // - status: 'unmatched' | 'matched' | 'cancelled'
      // - matched_invoice_id (FK vers financial_documents)

      const { data: transactions, error: transactionsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
        setUnmatchedTransactions([])
        return
      }

      // Fetch unpaid invoices from financial_documents
      const { data: invoices, error: invoicesError } = await supabase
        .from('financial_documents')
        .select(`
          id,
          document_number,
          document_type,
          invoice_number,
          amount_ttc,
          amount_paid,
          status,
          organisation_id,
          organisations!inner(
            id,
            name
          )
        `)
        .in('status', ['draft', 'pending', 'partially_paid'])
        .order('created_at', { ascending: false })

      // ⚠️ Si financial_documents est vide (tables pas encore créées en test)
      // On retourne gracieusement un état vide plutôt qu'erreur
      // Cela évite le crash total de la page rapprochement bancaire

      // Si erreur OU table vide, retourner état vide gracieusement
      if (invoicesError || !invoices || invoices.length === 0) {
        console.warn('No invoices found in financial_documents, feature disabled temporarily');
        setUnmatchedTransactions((transactions || []) as any);
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

      // Transform invoices to UnpaidInvoice format
      const unpaidInvoicesData: UnpaidInvoice[] = invoices.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number || inv.document_number || 'N/A',
        amount: inv.amount_ttc || 0,
        amount_paid: inv.amount_paid || 0,
        amount_remaining: (inv.amount_ttc || 0) - (inv.amount_paid || 0),
        due_date: null, // TODO: Ajouter due_date dans financial_documents
        customer_name: inv.organisations?.name || 'Client inconnu',
        status: inv.status as 'draft' | 'pending' | 'partially_paid'
      }))

      // Calculate stats
      const totalUnmatched = transactions?.length || 0
      const totalAmountPending = unpaidInvoicesData.reduce((sum, inv) => sum + inv.amount_remaining, 0)

      setUnmatchedTransactions(transactions as any)
      setUnpaidInvoices(unpaidInvoicesData)
      setStats({
        total_unmatched: totalUnmatched,
        total_amount_pending: totalAmountPending,
        auto_match_rate: 0, // TODO: Calculate based on matched transactions
        manual_review_count: totalUnmatched
      })
    } catch (error) {
      console.error('Error in fetchUnmatchedTransactions:', error)
      setUnmatchedTransactions([])
      setUnpaidInvoices([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Match transaction to invoice
  const matchTransaction = useCallback(async (
    transactionId: string,
    invoiceId: string,
    matchedAmount: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // TODO: Implement actual matching logic
      // 1. Update bank_transactions.status = 'matched'
      // 2. Update bank_transactions.matched_invoice_id = invoiceId
      // 3. Call record_payment RPC to update financial_documents.amount_paid
      // 4. Create entry in audit_logs

      console.log('Matching transaction:', { transactionId, invoiceId, matchedAmount })

      // For now, just refresh data
      await fetchUnmatchedTransactions()

      return { success: true }
    } catch (error) {
      console.error('Error matching transaction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, [fetchUnmatchedTransactions])

  // Generate match suggestions using AI
  const generateMatchSuggestions = useCallback((
    transaction: any,
    invoices: UnpaidInvoice[]
  ): MatchSuggestion[] => {
    const suggestions: MatchSuggestion[] = []

    invoices.forEach((invoice) => {
      let confidenceScore = 0

      // Match by amount (±5%)
      const transactionAmount = Math.abs((transaction as any).amount || 0)
      const amountDiff = Math.abs(transactionAmount - invoice.amount_remaining)
      const amountThreshold = invoice.amount_remaining * 0.05

      if (amountDiff <= amountThreshold) {
        confidenceScore += 60
      }

      // Match by reference number in description
      const description = String((transaction as any).description || '').toLowerCase()
      const invoiceNumber = invoice.invoice_number.toLowerCase()

      if (description.includes(invoiceNumber)) {
        confidenceScore += 40
      }

      // Only add suggestions with > 50% confidence
      if (confidenceScore > 50) {
        suggestions.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          confidence_score: Math.min(confidenceScore, 100),
          reason: confidenceScore >= 90
            ? 'Correspondance exacte (montant + référence)'
            : confidenceScore >= 60
            ? 'Correspondance probable (montant similaire)'
            : 'Correspondance possible'
        })
      }
    })

    return suggestions.sort((a, b) => b.confidence_score - a.confidence_score)
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchUnmatchedTransactions()
  }, [fetchUnmatchedTransactions])

  return {
    unmatchedTransactions,
    unpaidInvoices,
    stats,
    loading,
    matchTransaction,
    generateMatchSuggestions,
    refresh: fetchUnmatchedTransactions
  }
}

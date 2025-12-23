// =====================================================================
// Hook: Bank Reconciliation
// Date: 2025-12-23
// Description: Gestion rapprochement bancaire - transactions + commandes sans facture
// =====================================================================

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface BankTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  side: 'credit' | 'debit';
  label: string;
  note: string | null;
  reference: string | null;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  operation_type: string | null;
  emitted_at: string;
  settled_at: string | null;
  matching_status: string;
  matched_document_id: string | null;
  confidence_score: number | null;
  raw_data: Record<string, unknown>;
  // Extraction depuis raw_data
  attachment_ids: string[] | null;
}

export interface OrderWithoutInvoice {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string | null;
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  total_ht: number;
  total_ttc: number;
  status: string;
  payment_status: string | null;
  created_at: string;
  shipped_at: string | null;
}

export interface MatchSuggestion {
  order_id: string;
  order_number: string;
  customer_name: string | null;
  customer_address: string | null;
  order_amount: number;
  confidence: number;
  match_reason: string;
}

interface ReconciliationStats {
  total_unmatched_transactions: number;
  total_orders_without_invoice: number;
  total_amount_pending: number;
  transactions_with_attachments: number;
}

// =====================================================================
// HELPERS
// =====================================================================

/**
 * Extrait les attachment_ids depuis raw_data Qonto
 */
function extractAttachmentIds(rawData: unknown): string[] | null {
  if (!rawData || typeof rawData !== 'object') return null;
  const data = rawData as Record<string, unknown>;

  // Qonto stocke les attachments comme un tableau d'objets avec id
  if (Array.isArray(data.attachments)) {
    const ids = (data.attachments as Array<Record<string, unknown>>)
      .filter(a => typeof a === 'object' && a?.id)
      .map(a => String(a.id));
    return ids.length > 0 ? ids : null;
  }

  // Ou comme attachment_ids directement
  if (Array.isArray(data.attachment_ids)) {
    return data.attachment_ids.length > 0 ? data.attachment_ids : null;
  }

  return null;
}

/**
 * Extrait l'adresse depuis un objet JSON
 */
function formatAddress(address: unknown): string | null {
  if (!address || typeof address !== 'object') return null;
  const addr = address as Record<string, unknown>;

  const parts = [
    addr.street || addr.line1 || addr.address,
    addr.postal_code || addr.zip,
    addr.city,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
}

// =====================================================================
// HOOK
// =====================================================================

export function useBankReconciliation() {
  const supabase = createClient();

  // Entrées (crédits) - pour matcher aux commandes
  const [creditTransactions, setCreditTransactions] = useState<
    BankTransaction[]
  >([]);
  // Sorties (débits) - pour identifier prestataires
  const [debitTransactions, setDebitTransactions] = useState<BankTransaction[]>(
    []
  );
  // Legacy: toutes les transactions non matchées (pour compatibilité)
  const [unmatchedTransactions, setUnmatchedTransactions] = useState<
    BankTransaction[]
  >([]);
  const [ordersWithoutInvoice, setOrdersWithoutInvoice] = useState<
    OrderWithoutInvoice[]
  >([]);
  const [stats, setStats] = useState<ReconciliationStats>({
    total_unmatched_transactions: 0,
    total_orders_without_invoice: 0,
    total_amount_pending: 0,
    transactions_with_attachments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // FETCH DATA
  // ===================================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch ALL unmatched bank transactions (crédits ET débits)
      const { data: transactions, error: txError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('matching_status', 'unmatched')
        .order('settled_at', { ascending: false, nullsFirst: false });

      console.log('[Reconciliation] bank_transactions query:', {
        transactionsCount: transactions?.length ?? 0,
        error: txError,
        firstTx: transactions?.[0],
      });

      if (txError) {
        console.error('Error fetching bank_transactions:', txError);
        if (!txError.message.includes('does not exist')) {
          throw txError;
        }
      }

      // Séparer crédits (entrées) et débits (sorties)
      const creditTransactions = (transactions || []).filter(
        tx => tx.side === 'credit'
      );
      const debitTransactions = (transactions || []).filter(
        tx => tx.side === 'debit'
      );

      // 2. Fetch sales_orders (sans join - customer_name sera récupéré séparément)
      const { data: orders, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          customer_id,
          billing_address,
          shipping_address,
          total_ht,
          total_ttc,
          status,
          payment_status,
          created_at,
          shipped_at
        `
        )
        .in('status', ['validated', 'shipped', 'delivered'])
        .order('created_at', { ascending: false });

      console.log('[Reconciliation] sales_orders query:', {
        ordersCount: orders?.length ?? 0,
        error: ordersError,
        firstOrder: orders?.[0],
      });

      if (ordersError) {
        console.error('Error fetching sales_orders:', ordersError);
        throw ordersError;
      }

      // 2b. Fetch organisation names séparément
      const customerIds = [
        ...new Set((orders || []).map(o => o.customer_id).filter(Boolean)),
      ];
      let orgNames: Record<string, string> = {};

      if (customerIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, legal_name')
          .in('id', customerIds);

        if (orgs) {
          orgNames = Object.fromEntries(orgs.map(o => [o.id, o.legal_name]));
        }
      }

      // 3. Fetch les IDs des commandes qui ont déjà une facture
      const { data: existingInvoices } = await supabase
        .from('financial_documents')
        .select('sales_order_id')
        .not('sales_order_id', 'is', null);

      const invoicedOrderIds = new Set(
        (existingInvoices || []).map(inv => inv.sales_order_id)
      );

      // 4. Transformer les transactions avec extraction des attachments
      const allTxData = (transactions || []).map(tx => ({
        ...tx,
        attachment_ids: extractAttachmentIds(tx.raw_data),
      })) as unknown as BankTransaction[];

      // Séparer en crédits (entrées) et débits (sorties)
      const creditTxData = allTxData.filter(tx => tx.side === 'credit');
      const debitTxData = allTxData.filter(tx => tx.side === 'debit');

      // 5. Filtrer et transformer les commandes
      const ordersData: OrderWithoutInvoice[] = (orders || [])
        .filter(order => !invoicedOrderIds.has(order.id))
        .map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          customer_name: order.customer_id
            ? orgNames[order.customer_id] || null
            : null,
          billing_address: order.billing_address as Record<
            string,
            unknown
          > | null,
          shipping_address: order.shipping_address as Record<
            string,
            unknown
          > | null,
          total_ht: order.total_ht,
          total_ttc: order.total_ttc,
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
          shipped_at: order.shipped_at,
        }));

      // 6. Calculer les stats
      const totalAmountPending = ordersData.reduce(
        (sum, o) => sum + (o.total_ttc || 0),
        0
      );

      const txWithAttachments = allTxData.filter(
        tx => tx.attachment_ids && tx.attachment_ids.length > 0
      ).length;

      // Mettre à jour tous les états
      setCreditTransactions(creditTxData);
      setDebitTransactions(debitTxData);
      setUnmatchedTransactions(creditTxData); // Legacy: garde les crédits
      setOrdersWithoutInvoice(ordersData);
      setStats({
        total_unmatched_transactions: allTxData.length,
        total_orders_without_invoice: ordersData.length,
        total_amount_pending: totalAmountPending,
        transactions_with_attachments: txWithAttachments,
      });
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setCreditTransactions([]);
      setDebitTransactions([]);
      setUnmatchedTransactions([]);
      setOrdersWithoutInvoice([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ===================================================================
  // GENERATE MATCH SUGGESTIONS
  // ===================================================================

  const generateMatchSuggestions = useCallback(
    (
      transaction: BankTransaction,
      orders: OrderWithoutInvoice[]
    ): MatchSuggestion[] => {
      const suggestions: MatchSuggestion[] = [];
      const txAmount = Math.abs(transaction.amount);
      const tolerance = 10; // ±10€

      orders.forEach(order => {
        let confidenceScore = 0;
        const reasons: string[] = [];

        // Match par montant (±10€)
        const amountDiff = Math.abs(txAmount - order.total_ttc);
        if (amountDiff <= tolerance) {
          if (amountDiff === 0) {
            confidenceScore += 70;
            reasons.push('Montant exact');
          } else {
            confidenceScore += 50;
            reasons.push(`Montant proche (±${amountDiff.toFixed(2)}€)`);
          }
        }

        // Match par nom de contrepartie
        if (transaction.counterparty_name && order.customer_name) {
          const cpName = transaction.counterparty_name.toLowerCase();
          const custName = order.customer_name.toLowerCase().substring(0, 10);
          if (cpName.includes(custName)) {
            confidenceScore += 30;
            reasons.push('Nom client similaire');
          }
        }

        // Seulement si confiance > 40%
        if (confidenceScore > 40) {
          suggestions.push({
            order_id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name,
            customer_address:
              formatAddress(order.shipping_address) ||
              formatAddress(order.billing_address),
            order_amount: order.total_ttc,
            confidence: Math.min(confidenceScore, 100),
            match_reason: reasons.join(' + '),
          });
        }
      });

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    },
    []
  );

  const generateTransactionSuggestions = useCallback(
    (
      order: OrderWithoutInvoice,
      transactions: BankTransaction[]
    ): (BankTransaction & { confidence: number; match_reason: string })[] => {
      const suggestions: (BankTransaction & {
        confidence: number;
        match_reason: string;
      })[] = [];
      const orderAmount = order.total_ttc;
      const tolerance = 10;

      transactions.forEach(tx => {
        let confidenceScore = 0;
        const reasons: string[] = [];
        const txAmount = Math.abs(tx.amount);

        // Match par montant
        const amountDiff = Math.abs(txAmount - orderAmount);
        if (amountDiff <= tolerance) {
          if (amountDiff === 0) {
            confidenceScore += 70;
            reasons.push('Montant exact');
          } else {
            confidenceScore += 50;
            reasons.push(`Montant proche (±${amountDiff.toFixed(2)}€)`);
          }
        }

        // Match par nom
        if (tx.counterparty_name && order.customer_name) {
          const cpName = tx.counterparty_name.toLowerCase();
          const custName = order.customer_name.toLowerCase().substring(0, 10);
          if (cpName.includes(custName)) {
            confidenceScore += 30;
            reasons.push('Nom client similaire');
          }
        }

        if (confidenceScore > 40) {
          suggestions.push({
            ...tx,
            confidence: Math.min(confidenceScore, 100),
            match_reason: reasons.join(' + '),
          });
        }
      });

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    },
    []
  );

  // ===================================================================
  // LIFECYCLE
  // ===================================================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===================================================================
  // LEGACY COMPATIBILITY
  // ===================================================================

  const unpaidInvoices = ordersWithoutInvoice.map(order => ({
    id: order.id,
    invoice_number: order.order_number,
    customer_name: order.customer_name || 'Client inconnu',
    amount_remaining: order.total_ttc,
    due_date: order.created_at,
    days_overdue: null,
    status: order.payment_status || 'pending',
  }));

  const matchTransaction = async (
    transactionId: string,
    orderId: string,
    matchedAmount?: number
  ): Promise<{ success: boolean; error?: string }> => {
    console.log('matchTransaction called:', {
      transactionId,
      orderId,
      matchedAmount,
    });
    await fetchData();
    return { success: true };
  };

  return {
    // Transactions séparées par type (transaction-first approach)
    creditTransactions, // Entrées d'argent
    debitTransactions, // Sorties d'argent
    // Legacy: toutes transactions non matchées
    unmatchedTransactions,
    // Commandes sans facture (pour matching)
    ordersWithoutInvoice,
    // Stats
    stats,
    loading,
    error,
    // Générateurs de suggestions
    generateMatchSuggestions,
    generateTransactionSuggestions,
    // Actions
    refresh: fetchData,
    // Legacy compatibility
    unpaidInvoices,
    matchTransaction,
  };
}

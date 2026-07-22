'use client';

/**
 * [BO-FIN-RECON-AUTO-001]
 * Hook: useInvoiceReconciliationSuggestions
 *
 * Fetch les factures non soldées + les transactions crédit non rapprochées,
 * calcule les meilleures suggestions de rapprochement via calculateMatch,
 * déduplique pour qu'une transaction ne soit suggérée qu'à une seule facture.
 *
 * Modèle "inbox proactif" : pas de déclencheur utilisateur, chargement
 * automatique à l'affichage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { calculateMatch } from '../components/RapprochementContent/scoring';
import type { CreditTransaction } from '../components/RapprochementContent/types';

// =====================================================================
// TYPES
// =====================================================================

interface OrgData {
  legal_name: string;
  trade_name: string | null;
}

interface InvoiceRow {
  id: string;
  document_number: string;
  total_ttc: number;
  amount_paid: number | null;
  status: string;
  created_at: string;
  partner_id: string | null;
  organisations: OrgData | OrgData[] | null;
}

export interface ReconciliationSuggestion {
  invoice: {
    id: string;
    document_number: string;
    total_ttc: number;
    amount_paid: number;
    remaining: number;
    customer_name: string | null;
  };
  transaction: CreditTransaction;
  score: number;
  priority: string;
  reasons: string[];
}

export interface UseInvoiceReconciliationSuggestionsReturn {
  suggestions: ReconciliationSuggestion[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =====================================================================
// TYPE GUARDS
// =====================================================================

function isOrgData(value: unknown): value is OrgData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'legal_name' in value &&
    typeof (value as Record<string, unknown>).legal_name === 'string'
  );
}

/**
 * Extrait l'OrgData de la relation Supabase (object ou array[0] selon la FK).
 */
function extractOrgData(raw: unknown): OrgData | null {
  if (Array.isArray(raw)) {
    const first: unknown = raw[0];
    return isOrgData(first) ? first : null;
  }
  return isOrgData(raw) ? raw : null;
}

function isInvoiceRow(value: unknown): value is InvoiceRow {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.document_number === 'string' &&
    typeof v.total_ttc === 'number' &&
    typeof v.created_at === 'string' &&
    typeof v.status === 'string'
  );
}

function isCreditTransaction(value: unknown): value is CreditTransaction {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.transaction_id === 'string' &&
    typeof v.amount === 'number'
  );
}

// =====================================================================
// HOOK
// =====================================================================

type CandidateEntry = {
  invoice: InvoiceRow;
  transaction: CreditTransaction;
  score: number;
  priority: string;
  reasons: string[];
  sortOrder: number;
};

export function useInvoiceReconciliationSuggestions(): UseInvoiceReconciliationSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Flag boolean pour éviter le pattern .length===0 interdit (data-fetching.md)
  const [dataLoaded, setDataLoaded] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch en parallèle : factures non soldées + transactions crédit
      const [invoicesResult, transactionsResult] = await Promise.all([
        supabase
          .from('financial_documents')
          .select(
            'id, document_number, total_ttc, amount_paid, status, created_at, partner_id, organisations!financial_documents_partner_id_fkey(legal_name, trade_name)'
          )
          .eq('document_type', 'customer_invoice')
          .in('status', ['sent', 'partially_paid'])
          .is('deleted_at', null)
          .limit(200),

        supabase
          .from('v_transactions_unified')
          .select(
            'id, transaction_id, label, amount, counterparty_name, emitted_at, settled_at, unified_status'
          )
          .eq('side', 'credit')
          .in('unified_status', ['to_process', 'classified'])
          .order('settled_at', { ascending: false, nullsFirst: false })
          .limit(200),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      // Filtrer avec type guards (jamais `as any`)
      const rawInvoices: InvoiceRow[] = (invoicesResult.data ?? []).filter(
        isInvoiceRow
      );
      const allTransactions: CreditTransaction[] = (
        transactionsResult.data ?? []
      ).filter(isCreditTransaction);

      // Filtrer les factures où il reste réellement quelque chose à payer
      const invoices = rawInvoices.filter(inv => {
        const paid = inv.amount_paid ?? 0;
        return inv.total_ttc - paid > 0.01;
      });

      if (invoices.length === 0 || allTransactions.length === 0) {
        setSuggestions([]);
        setDataLoaded(true);
        return;
      }

      const candidates: CandidateEntry[] = [];

      for (const invoice of invoices) {
        const orgData = extractOrgData(invoice.organisations);
        const customerName = orgData?.legal_name ?? null;
        const customerNameAlt = orgData?.trade_name ?? null;
        const paidAmount = invoice.amount_paid ?? 0;

        // Mapper la facture en OrderForLink pour calculateMatch
        const orderForLink = {
          id: invoice.id,
          order_number: invoice.document_number,
          customer_name: customerName,
          customer_name_alt: customerNameAlt,
          total_ttc: invoice.total_ttc,
          paid_amount: paidAmount,
          created_at: invoice.created_at,
          order_date: invoice.created_at,
          shipped_at: null as string | null,
          payment_status_v2: invoice.status,
        };

        // Trouver le meilleur match pour cette facture
        let bestCandidate: CandidateEntry | null = null;

        for (const tx of allTransactions) {
          const result = calculateMatch(
            orderForLink,
            tx,
            allTransactions,
            'sales_order'
          );

          if (
            (result.priority === 'excellent' || result.priority === 'good') &&
            result.score >= 85
          ) {
            if (
              !bestCandidate ||
              result.sortOrder < bestCandidate.sortOrder ||
              (result.sortOrder === bestCandidate.sortOrder &&
                result.score > bestCandidate.score)
            ) {
              bestCandidate = {
                invoice,
                transaction: tx,
                score: result.score,
                priority: result.priority,
                reasons: result.reasons,
                sortOrder: result.sortOrder,
              };
            }
          }
        }

        if (bestCandidate) {
          candidates.push(bestCandidate);
        }
      }

      // Déduplication : une transaction ne peut être associée qu'à une seule facture.
      // Parmi les candidats qui pointent la même transaction, garder celui au
      // meilleur sortOrder (puis meilleur score en égalité).
      const txToWinner = new Map<string, CandidateEntry>();

      for (const candidate of candidates) {
        const txId = candidate.transaction.id;
        const existing = txToWinner.get(txId);

        if (!existing) {
          txToWinner.set(txId, candidate);
        } else {
          const replaceWithCurrent =
            candidate.sortOrder < existing.sortOrder ||
            (candidate.sortOrder === existing.sortOrder &&
              candidate.score > existing.score);

          if (replaceWithCurrent) {
            txToWinner.set(txId, candidate);
          }
        }
      }

      // Construire les suggestions finales, triées par sortOrder
      const finalSuggestions: ReconciliationSuggestion[] = Array.from(
        txToWinner.values()
      )
        .sort((a, b) => a.sortOrder - b.sortOrder || b.score - a.score)
        .map(c => {
          const org = extractOrgData(c.invoice.organisations);
          const paid = c.invoice.amount_paid ?? 0;

          return {
            invoice: {
              id: c.invoice.id,
              document_number: c.invoice.document_number,
              total_ttc: c.invoice.total_ttc,
              amount_paid: paid,
              remaining: c.invoice.total_ttc - paid,
              customer_name: org?.legal_name ?? null,
            },
            transaction: c.transaction,
            score: c.score,
            priority: c.priority,
            reasons: c.reasons,
          };
        });

      setSuggestions(finalSuggestions);
    } catch (err: unknown) {
      console.error('[useInvoiceReconciliationSuggestions] Fetch error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des suggestions'
      );
    } finally {
      setIsLoading(false);
      setDataLoaded(true);
    }
  }, [supabase]);

  // Ref stable pour fetchData (évite la dépendance instable dans useEffect)
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  useEffect(() => {
    if (!dataLoaded) {
      void fetchDataRef.current();
    }
  }, [dataLoaded]);

  const refetch = useCallback(() => {
    setDataLoaded(false);
  }, []);

  return { suggestions, isLoading, error, refetch };
}

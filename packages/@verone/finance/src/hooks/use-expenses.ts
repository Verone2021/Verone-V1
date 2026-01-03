/**
 * Hook pour la gestion des dépenses (expenses)
 *
 * Récupère les dépenses depuis la vue v_expenses_with_details
 * qui inclut les détails des transactions bancaires et counterparties.
 */

'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Types pour les expenses (non générés, donc définis manuellement)
export interface Expense {
  id: string;
  transaction_id: string;
  counterparty_id: string | null;
  organisation_id: string | null;
  category: string | null;
  status: 'unclassified' | 'classified' | 'needs_review' | 'ignored';
  role_type: string | null;
  notes: string | null;
  classified_at: string | null;
  classified_by: string | null;
  created_at: string;
  updated_at: string;
  // Transaction details
  amount: number;
  currency: string;
  label: string;
  transaction_counterparty_name: string | null;
  transaction_iban: string | null;
  side: 'debit' | 'credit';
  emitted_at: string;
  settled_at: string | null;
  category_pcg: string | null;
  raw_data: Record<string, unknown>;
  // Counterparty details
  counterparty_display_name: string | null;
  counterparty_name_normalized: string | null;
  // Organisation details
  organisation_name: string | null;
  organisation_type: string | null;
  // Computed
  has_attachment: boolean;
  // SLICE 3: Règle appliquée (pour verrouillage UI)
  applied_rule_id: string | null;
  rule_match_value: string | null;
  rule_display_label: string | null;
  /** Si TRUE, la catégorie peut être modifiée individuellement malgré la règle */
  rule_allow_multiple_categories: boolean | null;
  // Colonnes TVA
  vat_rate: number | null;
  amount_ht: number | null;
  amount_vat: number | null;
  /** Source de la TVA: 'qonto_ocr' si détecté par Qonto, 'manual' si saisi manuellement */
  vat_source: 'qonto_ocr' | 'manual' | null;
  /** Ventilation TVA multi-taux (ex: restaurant 10% + 20%) */
  vat_breakdown: Array<{
    description: string;
    amount_ht: number;
    tva_rate: number;
    tva_amount: number;
  }> | null;
}

export interface ExpenseFilters {
  status?: 'unclassified' | 'classified' | 'needs_review' | 'ignored' | 'all';
  /** Filtrer par type de transaction: debit (dépenses), credit (entrées), all */
  side?: 'debit' | 'credit' | 'all';
  year?: number;
  /** Année minimum (filtre >= minYear) - pour exclure transactions avant 2025 */
  minYear?: number;
  category?: string;
  hasAttachment?: boolean;
  search?: string;
}

export interface ExpenseStats {
  total: number;
  unclassified: number;
  classified: number;
  needsReview: number;
  ignored: number;
  totalAmount: number;
}

export interface UseExpensesReturn {
  expenses: Expense[];
  stats: ExpenseStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filters: ExpenseFilters;
  setFilters: Dispatch<SetStateAction<ExpenseFilters>>;
}

export function useExpenses(
  initialFilters: ExpenseFilters = {}
): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    unclassified: 0,
    classified: 0,
    needsReview: 0,
    ignored: 0,
    totalAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Récupérer les expenses depuis la vue
      // Cast as any car la vue n'est pas dans les types générés
      let query = (supabase as { from: CallableFunction })
        .from('v_expenses_with_details')
        .select('*')
        .order('emitted_at', { ascending: false });

      // Appliquer les filtres
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filtre par type de transaction (debit = dépenses, credit = entrées)
      if (filters.side && filters.side !== 'all') {
        query = query.eq('side', filters.side);
      }

      if (filters.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('emitted_at', startDate).lte('emitted_at', endDate);
      } else if (filters.minYear) {
        // Filtrer uniquement les transactions à partir de l'année minimum
        const startDate = `${filters.minYear}-01-01`;
        query = query.gte('emitted_at', startDate);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.hasAttachment !== undefined) {
        query = query.eq('has_attachment', filters.hasAttachment);
      }

      if (filters.search) {
        // Recherche dans: libellé, nom contrepartie bancaire, ET nom organisation liée
        query = query.or(
          `label.ilike.%${filters.search}%,transaction_counterparty_name.ilike.%${filters.search}%,organisation_name.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query.limit(500);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const expenseData = (data || []) as Expense[];
      setExpenses(expenseData);

      // Calculer les stats
      const newStats: ExpenseStats = {
        total: expenseData.length,
        unclassified: expenseData.filter(e => e.status === 'unclassified')
          .length,
        classified: expenseData.filter(e => e.status === 'classified').length,
        needsReview: expenseData.filter(e => e.status === 'needs_review')
          .length,
        ignored: expenseData.filter(e => e.status === 'ignored').length,
        totalAmount: expenseData.reduce(
          (sum, e) => sum + Math.abs(e.amount),
          0
        ),
      };
      setStats(newStats);
    } catch (err) {
      console.error('[useExpenses] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    stats,
    isLoading,
    error,
    refetch: fetchExpenses,
    filters,
    setFilters,
  };
}

// Note: Les catégories sont maintenant gérées via pcg-categories.ts
// Utiliser getPcgCategory() et PCG_SUGGESTED_CATEGORIES pour les catégories

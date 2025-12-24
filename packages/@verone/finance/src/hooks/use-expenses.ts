/**
 * Hook pour la gestion des dépenses (expenses)
 *
 * Récupère les dépenses depuis la vue v_expenses_with_details
 * qui inclut les détails des transactions bancaires et counterparties.
 */

'use client';

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
  raw_data: Record<string, unknown>;
  // Counterparty details
  counterparty_display_name: string | null;
  counterparty_name_normalized: string | null;
  // Organisation details
  organisation_name: string | null;
  organisation_type: string | null;
  // Computed
  has_attachment: boolean;
}

export interface ExpenseFilters {
  status?: 'unclassified' | 'classified' | 'needs_review' | 'ignored' | 'all';
  year?: number;
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
  setFilters: (filters: ExpenseFilters) => void;
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

      if (filters.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('emitted_at', startDate).lte('emitted_at', endDate);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.hasAttachment !== undefined) {
        query = query.eq('has_attachment', filters.hasAttachment);
      }

      if (filters.search) {
        query = query.or(
          `label.ilike.%${filters.search}%,transaction_counterparty_name.ilike.%${filters.search}%`
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

// Catégories de dépenses avec emojis
export const EXPENSE_CATEGORIES = [
  { id: 'bank_fees', label: 'Frais bancaires', emoji: '🏦' },
  { id: 'subscription', label: 'Abonnements', emoji: '📱' },
  { id: 'supplies', label: 'Fournitures', emoji: '📦' },
  { id: 'transport', label: 'Transport/Livraison', emoji: '🚚' },
  { id: 'marketing', label: 'Marketing/Publicité', emoji: '📣' },
  { id: 'taxes', label: 'Taxes & Impôts', emoji: '🧾' },
  { id: 'insurance', label: 'Assurances', emoji: '🛡️' },
  {
    id: 'professional_services',
    label: 'Services professionnels',
    emoji: '👔',
  },
  { id: 'software', label: 'Logiciels/SaaS', emoji: '💻' },
  { id: 'telecom', label: 'Télécom/Internet', emoji: '📡' },
  { id: 'rent', label: 'Loyer/Location', emoji: '🏢' },
  { id: 'purchase_stock', label: 'Achats marchandises', emoji: '🛒' },
  { id: 'other', label: 'Autre', emoji: '📋' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['id'];
export type ExpenseCategoryItem = (typeof EXPENSE_CATEGORIES)[number];

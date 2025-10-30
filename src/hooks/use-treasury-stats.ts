/**
 * Hook: Treasury Statistics
 * Description: Statistiques trésorerie en temps réel avec prévisions
 *
 * Features:
 * - KPIs AR (Accounts Receivable) + AP (Accounts Payable)
 * - Prévisions 30/60/90 jours
 * - Évolution historique
 * - Répartition dépenses par catégorie
 *
 * STATUS: DÉSACTIVÉ Phase 1 (returns mocks uniquement)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { featureFlags } from '@/lib/feature-flags'

// =====================================================================
// TYPES
// =====================================================================

export interface TreasuryStats {
  // AR (Accounts Receivable - Clients)
  total_invoiced_ar: number
  total_paid_ar: number
  unpaid_count_ar: number
  overdue_ar: number

  // AP (Accounts Payable - Fournisseurs + Dépenses)
  total_invoiced_ap: number
  total_paid_ap: number
  unpaid_count_ap: number
  overdue_ap: number

  // Balance
  net_balance: number
  net_cash_flow: number
}

export interface TreasuryEvolution {
  date: string
  inbound: number    // AR encaissé
  outbound: number   // AP décaissé
  balance: number    // Net
}

export interface ExpenseBreakdown {
  category_name: string
  category_code: string
  total_amount: number
  count: number
  percentage: number
}

export interface TreasuryForecast {
  period: '30d' | '60d' | '90d'
  expected_inbound: number
  expected_outbound: number
  projected_balance: number
}

// =====================================================================
// HOOK
// =====================================================================

export function useTreasuryStats(
  startDate?: string,
  endDate?: string
) {
  const [stats, setStats] = useState<TreasuryStats | null>(null)
  const [evolution, setEvolution] = useState<TreasuryEvolution[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([])
  const [forecasts, setForecasts] = useState<TreasuryForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bankBalance, setBankBalance] = useState<number | null>(null)

  const supabase = createClient()

  // Dates par défaut : 30 derniers jours
  const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const defaultEndDate = endDate || new Date().toISOString().split('T')[0]

  // ===================================================================
  // HOOKS: useEffect placés AVANT early return (React Rules)
  // ===================================================================

  // Auto-fetch stats when dates change
  useEffect(() => {
    if (!featureFlags.financeEnabled) return
    // fetchStats() will be defined below
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: statsData, error: statsError } = await supabase
          .rpc('get_treasury_stats', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate
          } as any)

        if (statsError) throw statsError

        if (statsData && (statsData as any).length > 0) {
          const row = (statsData as any)[0]
          setStats({
            total_invoiced_ar: row.total_invoiced_ar || 0,
            total_paid_ar: row.total_paid_ar || 0,
            unpaid_count_ar: row.unpaid_count_ar || 0,
            overdue_ar: (row.total_invoiced_ar || 0) - (row.total_paid_ar || 0),
            total_invoiced_ap: row.total_invoiced_ap || 0,
            total_paid_ap: row.total_paid_ap || 0,
            unpaid_count_ap: row.unpaid_count_ap || 0,
            overdue_ap: (row.total_invoiced_ap || 0) - (row.total_paid_ap || 0),
            net_balance: row.net_balance || 0,
            net_cash_flow: (row.total_paid_ar || 0) - (row.total_paid_ap || 0)
          })
        }
      } catch (err: any) {
        console.error('Error fetching treasury stats:', err)
        setError(err.message || 'Erreur chargement statistiques')
        toast.error(err.message || 'Erreur chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [defaultStartDate, defaultEndDate, supabase])

  // Auto-fetch bank balance on mount
  useEffect(() => {
    if (!featureFlags.financeEnabled) return
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/qonto/balance')
        if (response.ok) {
          const data = await response.json()
          setBankBalance(data.balance || null)
        }
      } catch (err) {
        console.warn('Failed to fetch bank balance:', err)
      }
    }
    fetchBalance()
  }, [])

  // ===================================================================
  // FEATURE FLAG: FINANCE MODULE DISABLED (Phase 1)
  // ===================================================================

  if (!featureFlags.financeEnabled) {
    // Return mocks immédiatement pour éviter appels API Qonto/Supabase
    return {
      stats: null,
      evolution: [],
      expenseBreakdown: [],
      forecasts: [],
      bankBalance: null,
      loading: false,
      error: 'Module Finance désactivé (Phase 1)',
      refresh: () => {},
      refreshBankBalance: () => {}
    }
  }

  // ===================================================================
  // FETCH STATS (via RPC get_treasury_stats)
  // ===================================================================

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Récupérer stats via RPC
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_treasury_stats', {
          p_start_date: defaultStartDate,
          p_end_date: defaultEndDate
        } as any)

      if (statsError) throw statsError

      if (statsData && (statsData as any).length > 0) {
        const row = (statsData as any)[0]
        setStats({
          total_invoiced_ar: row.total_invoiced_ar || 0,
          total_paid_ar: row.total_paid_ar || 0,
          unpaid_count_ar: row.unpaid_count_ar || 0,
          overdue_ar: (row.total_invoiced_ar || 0) - (row.total_paid_ar || 0),
          total_invoiced_ap: row.total_invoiced_ap || 0,
          total_paid_ap: row.total_paid_ap || 0,
          unpaid_count_ap: row.unpaid_count_ap || 0,
          overdue_ap: (row.total_invoiced_ap || 0) - (row.total_paid_ap || 0),
          net_balance: row.net_balance || 0,
          net_cash_flow: (row.total_paid_ar || 0) - (row.total_paid_ap || 0)
        })
      }

      // 2. Récupérer évolution mensuelle (paiements par mois)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('financial_payments')
        .select(`
          payment_date,
          amount_paid,
          document:financial_documents!document_id(
            document_direction
          )
        `)
        .gte('payment_date', defaultStartDate)
        .lte('payment_date', defaultEndDate)
        .order('payment_date', { ascending: true })

      if (paymentsError) throw paymentsError

      // Grouper par mois
      const monthlyData: Record<string, { inbound: number; outbound: number }> = {}

      paymentsData?.forEach((payment: any) => {
        const month = payment.payment_date.substring(0, 7) // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { inbound: 0, outbound: 0 }
        }

        if (payment.document?.document_direction === 'inbound') {
          monthlyData[month].inbound += payment.amount_paid
        } else {
          monthlyData[month].outbound += payment.amount_paid
        }
      })

      // Convertir en array et calculer balance cumulative
      let cumulativeBalance = 0
      const evolutionArray: TreasuryEvolution[] = Object.entries(monthlyData)
        .map(([date, data]) => {
          cumulativeBalance += data.inbound - data.outbound
          return {
            date,
            inbound: data.inbound,
            outbound: data.outbound,
            balance: cumulativeBalance
          }
        })
        .sort((a, b) => a.date.localeCompare(b.date))

      setEvolution(evolutionArray)

      // 3. Récupérer répartition dépenses par catégorie
      const { data: expensesData, error: expensesError } = await supabase
        .from('financial_documents')
        .select(`
          total_ttc,
          expense_category:expense_categories(
            name,
            account_code
          )
        `)
        .eq('document_type', 'expense')
        .gte('document_date', defaultStartDate)
        .lte('document_date', defaultEndDate)

      if (expensesError) throw expensesError

      // Grouper par catégorie
      const categoryData: Record<string, { total: number; count: number; code: string }> = {}
      let totalExpenses = 0

      expensesData?.forEach((expense: any) => {
        if (expense.expense_category) {
          const catName = expense.expense_category.name
          const catCode = expense.expense_category.account_code

          if (!categoryData[catName]) {
            categoryData[catName] = { total: 0, count: 0, code: catCode }
          }

          categoryData[catName].total += expense.total_ttc
          categoryData[catName].count += 1
          totalExpenses += expense.total_ttc
        }
      })

      // Convertir en array avec pourcentages
      const breakdownArray: ExpenseBreakdown[] = Object.entries(categoryData)
        .map(([name, data]) => ({
          category_name: name,
          category_code: data.code,
          total_amount: data.total,
          count: data.count,
          percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.total_amount - a.total_amount)

      setExpenseBreakdown(breakdownArray)

      // 4. Calculer prévisions (basées sur échéances à venir)
      const today = new Date()
      const forecasts: TreasuryForecast[] = []

      for (const days of [30, 60, 90]) {
        const forecastDate = new Date(today)
        forecastDate.setDate(forecastDate.getDate() + days)
        const forecastDateStr = forecastDate.toISOString().split('T')[0]

        // Documents AR à encaisser (statut != paid)
        const { data: arDocs } = await supabase
          .from('financial_documents')
          .select('total_ttc, amount_paid')
          .eq('document_direction', 'inbound')
          .neq('status', 'paid')
          .lte('due_date', forecastDateStr)

        const expectedInbound = arDocs?.reduce(
          (sum, doc) => sum + (doc.total_ttc - doc.amount_paid),
          0
        ) || 0

        // Documents AP à payer (statut != paid)
        const { data: apDocs } = await supabase
          .from('financial_documents')
          .select('total_ttc, amount_paid')
          .eq('document_direction', 'outbound')
          .neq('status', 'paid')
          .lte('due_date', forecastDateStr)

        const expectedOutbound = apDocs?.reduce(
          (sum, doc) => sum + (doc.total_ttc - doc.amount_paid),
          0
        ) || 0

        forecasts.push({
          period: `${days}d` as '30d' | '60d' | '90d',
          expected_inbound: expectedInbound,
          expected_outbound: expectedOutbound,
          projected_balance: expectedInbound - expectedOutbound
        })
      }

      setForecasts(forecasts)

    } catch (err: any) {
      console.error('Error fetching treasury stats:', err)
      setError(err.message || 'Erreur chargement statistiques')
      toast.error(err.message || 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  // ===================================================================
  // FETCH BANK BALANCE (via API Qonto)
  // ===================================================================

  const fetchBankBalance = async () => {
    try {
      const response = await fetch('/api/qonto/balance')
      if (response.ok) {
        const data = await response.json()
        setBankBalance(data.balance || null)
      }
    } catch (err) {
      console.warn('Failed to fetch bank balance:', err)
    }
  }

  return {
    // Stats
    stats,
    evolution,
    expenseBreakdown,
    forecasts,
    bankBalance,

    // State
    loading,
    error,

    // Actions
    refresh: fetchStats,
    refreshBankBalance: fetchBankBalance
  }
}

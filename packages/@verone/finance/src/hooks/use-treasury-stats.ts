/**
 * Hook: Treasury Statistics
 * Description: Statistiques trésorerie en temps réel avec prévisions
 *
 * Features:
 * - Solde bancaire Qonto en temps réel (multi-comptes)
 * - KPIs AR (Accounts Receivable) + AP (Accounts Payable)
 * - Prévisions 30/60/90 jours basées sur burn rate
 * - Évolution historique
 * - Runway calculé automatiquement
 *
 * STATUS: ACTIVÉ - Données réelles Qonto + Supabase
 */

import { useState, useEffect } from 'react';

import { featureFlags } from '@verone/utils/feature-flags';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'react-hot-toast';

// =====================================================================
// TYPES
// =====================================================================

export interface TreasuryStats {
  // AR (Accounts Receivable - Clients)
  total_invoiced_ar: number;
  total_paid_ar: number;
  unpaid_count_ar: number;
  overdue_ar: number;

  // AP (Accounts Payable - Fournisseurs + Dépenses)
  total_invoiced_ap: number;
  total_paid_ap: number;
  unpaid_count_ap: number;
  overdue_ap: number;

  // Balance
  net_balance: number;
  net_cash_flow: number;
}

export interface TreasuryEvolution {
  date: string;
  inbound: number; // AR encaissé
  outbound: number; // AP décaissé
  balance: number; // Net
}

export interface ExpenseBreakdown {
  category_name: string;
  category_code: string;
  total_amount: number;
  count: number;
  percentage: number;
}

export interface TreasuryForecast {
  period: '30d' | '60d' | '90d';
  expected_inbound: number;
  expected_outbound: number;
  projected_balance: number;
}

// Types pour les comptes bancaires Qonto
export interface BankAccountBalance {
  id: string;
  name: string;
  iban: string;
  ibanMasked: string;
  balance: number;
  authorizedBalance: number;
  currency: string;
  status: 'active' | 'closed';
  updatedAt: string;
}

export interface BankBalanceData {
  success: boolean;
  accounts: BankAccountBalance[];
  totalBalance: number;
  totalAuthorizedBalance: number;
  currency: string;
  lastUpdated: string;
  error?: string;
}

// =====================================================================
// CACHE MODULE-LEVEL (évite appels API Qonto répétés)
// Pattern: Cache avec timestamp, durée 5 minutes
// =====================================================================

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface QontoCacheEntry {
  data: BankBalanceData;
  timestamp: number;
}

let qontoBalanceCache: QontoCacheEntry | null = null;

function isCacheValid(): boolean {
  if (!qontoBalanceCache) return false;
  const now = Date.now();
  return now - qontoBalanceCache.timestamp < CACHE_DURATION_MS;
}

function getCachedBalance(): BankBalanceData | null {
  if (isCacheValid()) {
    return qontoBalanceCache!.data;
  }
  return null;
}

function setCachedBalance(data: BankBalanceData): void {
  qontoBalanceCache = {
    data,
    timestamp: Date.now(),
  };
}

// Métriques calculées
export interface TreasuryMetrics {
  burnRate: number; // Dépenses moyennes mensuelles
  runwayMonths: number; // Mois avant épuisement
  cashFlowNet: number; // Entrées - Sorties du mois
  cashFlowVariation: number; // % variation vs mois précédent
}

// =====================================================================
// HOOK
// =====================================================================

export function useTreasuryStats(startDate?: string, endDate?: string) {
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [evolution, setEvolution] = useState<TreasuryEvolution[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>(
    []
  );
  const [forecasts, setForecasts] = useState<TreasuryForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nouveaux states pour les comptes bancaires
  const [bankData, setBankData] = useState<BankBalanceData | null>(null);
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  // Legacy: bankBalance pour compatibilité
  const bankBalance = bankData?.totalBalance ?? null;

  const supabase = createClient();

  // Dates par défaut : 30 derniers jours
  const defaultStartDate =
    startDate ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEndDate = endDate || new Date().toISOString().split('T')[0];

  // ===================================================================
  // HOOKS: useEffect placés AVANT early return (React Rules)
  // ===================================================================

  // Auto-fetch stats when dates change - on initial load only
  useEffect(() => {
    if (!featureFlags.financeEnabled) return;
    // Will call fetchStats after it's defined (via refresh())
    // For now, just trigger a re-render when dates change
  }, [defaultStartDate, defaultEndDate]);

  // Auto-fetch bank balance and stats on mount
  useEffect(() => {
    if (!featureFlags.financeEnabled) return;

    const fetchAllData = async () => {
      // 1. Fetch bank balance first (avec cache module-level)
      setBankLoading(true);
      let currentTotalBalance = 0;

      // Vérifier le cache d'abord
      const cachedData = getCachedBalance();
      if (cachedData) {
        setBankData(cachedData);
        currentTotalBalance = cachedData.totalBalance || 0;
        setBankLoading(false);
      } else {
        // Pas de cache valide, faire l'appel API
        try {
          const response = await fetch('/api/qonto/balance');
          if (response.ok) {
            const data: BankBalanceData = await response.json();
            setCachedBalance(data); // Mettre en cache
            setBankData(data);
            currentTotalBalance = data.totalBalance || 0;
          }
        } catch (err) {
          console.warn('Failed to fetch bank balance:', err);
        } finally {
          setBankLoading(false);
        }
      }

      // 2. Fetch transactions and calculate stats
      setLoading(true);
      setError(null);
      try {
        // Récupérer évolution mensuelle depuis bank_transactions (12 derniers mois)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const startDateForEvolution = twelveMonthsAgo
          .toISOString()
          .split('T')[0];

        const { data: transactionsData, error: transactionsError } =
          await supabase
            .from('bank_transactions')
            .select('emitted_at, amount, side')
            .gte('emitted_at', startDateForEvolution)
            .order('emitted_at', { ascending: true });

        if (transactionsError) {
          console.warn('Error fetching bank_transactions:', transactionsError);
        }

        // Grouper par mois
        const monthlyData: Record<
          string,
          { inbound: number; outbound: number }
        > = {};

        transactionsData?.forEach((tx: any) => {
          const month = tx.emitted_at.substring(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { inbound: 0, outbound: 0 };
          }

          if (tx.side === 'credit') {
            monthlyData[month].inbound += Math.abs(tx.amount);
          } else {
            monthlyData[month].outbound += Math.abs(tx.amount);
          }
        });

        // Convertir en array
        let cumulativeBalance = 0;
        const evolutionArray: TreasuryEvolution[] = Object.entries(monthlyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, data]) => {
            cumulativeBalance += data.inbound - data.outbound;
            return {
              date,
              inbound: data.inbound,
              outbound: data.outbound,
              balance: cumulativeBalance,
            };
          });

        setEvolution(evolutionArray);

        // Calculer les KPIs
        const currentMonth = new Date().toISOString().substring(0, 7);
        const currentMonthData = monthlyData[currentMonth] || {
          inbound: 0,
          outbound: 0,
        };

        // Burn rate = moyenne des dépenses sur 6 derniers mois
        const sortedMonths = Object.keys(monthlyData).sort().reverse();
        const lastSixMonths = sortedMonths.slice(0, 6);
        const totalOutboundSixMonths = lastSixMonths.reduce(
          (sum, m) => sum + (monthlyData[m]?.outbound || 0),
          0
        );
        const avgBurnRate =
          totalOutboundSixMonths / Math.max(lastSixMonths.length, 1);

        // Cash flow net du mois courant
        const cashFlowNet =
          currentMonthData.inbound - currentMonthData.outbound;

        // Variation vs mois précédent
        const prevMonth = sortedMonths[1];
        const prevMonthData = prevMonth
          ? monthlyData[prevMonth]
          : { inbound: 0, outbound: 0 };
        const prevCashFlow = prevMonthData.inbound - prevMonthData.outbound;
        const variation =
          prevCashFlow !== 0
            ? ((cashFlowNet - prevCashFlow) / Math.abs(prevCashFlow)) * 100
            : 0;

        // Stats basées sur les transactions réelles
        const totalInbound =
          transactionsData
            ?.filter((tx: any) => tx.side === 'credit')
            .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0) ||
          0;
        const totalOutbound =
          transactionsData
            ?.filter((tx: any) => tx.side === 'debit')
            .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0) ||
          0;

        // Récupérer AR/AP depuis financial_documents (factures réelles)
        let arTotal = 0;
        let arCount = 0;
        let apTotal = 0;
        let apCount = 0;

        try {
          // AR (Accounts Receivable) - Factures clients impayées
          const { data: arData } = await supabase
            .from('financial_documents')
            .select('total_ttc, amount_paid')
            .eq('document_direction', 'inbound')
            .not('status', 'in', '(paid,cancelled)');

          if (arData) {
            arData.forEach((doc: any) => {
              const unpaid = (doc.total_ttc || 0) - (doc.amount_paid || 0);
              if (unpaid > 0) {
                arTotal += unpaid;
                arCount++;
              }
            });
          }

          // AP (Accounts Payable) - Factures fournisseurs impayées
          const { data: apData } = await supabase
            .from('financial_documents')
            .select('total_ttc, amount_paid')
            .eq('document_direction', 'outbound')
            .not('status', 'in', '(paid,cancelled)');

          if (apData) {
            apData.forEach((doc: any) => {
              const unpaid = (doc.total_ttc || 0) - (doc.amount_paid || 0);
              if (unpaid > 0) {
                apTotal += unpaid;
                apCount++;
              }
            });
          }
        } catch (err) {
          console.warn('Error fetching AR/AP from financial_documents:', err);
        }

        setStats({
          total_invoiced_ar: arTotal,
          total_paid_ar: totalInbound,
          unpaid_count_ar: arCount,
          overdue_ar: 0,
          total_invoiced_ap: apTotal,
          total_paid_ap: totalOutbound,
          unpaid_count_ap: apCount,
          overdue_ap: 0,
          net_balance: totalInbound - totalOutbound,
          net_cash_flow: cashFlowNet,
        });

        // Mettre à jour les métriques
        setMetrics({
          burnRate: avgBurnRate,
          runwayMonths:
            avgBurnRate > 0 ? currentTotalBalance / avgBurnRate : 999,
          cashFlowNet,
          cashFlowVariation: variation,
        });

        // Prévisions basées sur le burn rate moyen
        const forecastsArray: TreasuryForecast[] = [];

        for (const days of [30, 60, 90]) {
          const monthsAhead = days / 30;
          const projectedOutbound = avgBurnRate * monthsAhead;
          const avgInbound =
            lastSixMonths.reduce(
              (sum, m) => sum + (monthlyData[m]?.inbound || 0),
              0
            ) / Math.max(lastSixMonths.length, 1);
          const projectedInbound = avgInbound * monthsAhead;

          forecastsArray.push({
            period: `${days}d` as '30d' | '60d' | '90d',
            expected_inbound: projectedInbound,
            expected_outbound: projectedOutbound,
            projected_balance:
              currentTotalBalance + projectedInbound - projectedOutbound,
          });
        }

        setForecasts(forecastsArray);
      } catch (err: any) {
        console.error('Error fetching treasury stats:', err);
        setError(err.message || 'Erreur chargement statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      bankData: null,
      bankAccounts: [],
      totalBalance: 0,
      bankBalance: null,
      bankLoading: false,
      metrics: null,
      burnRate: 0,
      runwayMonths: 0,
      cashFlowNet: 0,
      loading: false,
      error: 'Module Finance désactivé (Phase 1)',
      refresh: () => {},
      refreshBankBalance: () => {},
    };
  }

  // ===================================================================
  // FETCH STATS (via bank_transactions - données réelles)
  // ===================================================================

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer évolution mensuelle depuis bank_transactions (12 derniers mois)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const startDateForEvolution = twelveMonthsAgo.toISOString().split('T')[0];

      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from('bank_transactions')
          .select('emitted_at, amount, side')
          .gte('emitted_at', startDateForEvolution)
          .order('emitted_at', { ascending: true });

      if (transactionsError) {
        console.warn('Error fetching bank_transactions:', transactionsError);
      }

      // Grouper par mois
      const monthlyData: Record<string, { inbound: number; outbound: number }> =
        {};

      transactionsData?.forEach((tx: any) => {
        const month = tx.emitted_at.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { inbound: 0, outbound: 0 };
        }

        if (tx.side === 'credit') {
          monthlyData[month].inbound += Math.abs(tx.amount);
        } else {
          monthlyData[month].outbound += Math.abs(tx.amount);
        }
      });

      // Convertir en array et calculer balance cumulative
      let cumulativeBalance = 0;
      const evolutionArray: TreasuryEvolution[] = Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => {
          cumulativeBalance += data.inbound - data.outbound;
          return {
            date,
            inbound: data.inbound,
            outbound: data.outbound,
            balance: cumulativeBalance,
          };
        });

      setEvolution(evolutionArray);

      // 2. Calculer les KPIs depuis bank_transactions
      const currentMonth = new Date().toISOString().substring(0, 7);
      const currentMonthData = monthlyData[currentMonth] || {
        inbound: 0,
        outbound: 0,
      };

      // Burn rate = moyenne des dépenses sur 6 derniers mois
      const sortedMonths = Object.keys(monthlyData).sort().reverse();
      const lastSixMonths = sortedMonths.slice(0, 6);
      const totalOutboundSixMonths = lastSixMonths.reduce(
        (sum, m) => sum + (monthlyData[m]?.outbound || 0),
        0
      );
      const avgBurnRate =
        totalOutboundSixMonths / Math.max(lastSixMonths.length, 1);

      // Cash flow net du mois courant
      const cashFlowNet = currentMonthData.inbound - currentMonthData.outbound;

      // Variation vs mois précédent
      const prevMonth = sortedMonths[1];
      const prevMonthData = prevMonth
        ? monthlyData[prevMonth]
        : { inbound: 0, outbound: 0 };
      const prevCashFlow = prevMonthData.inbound - prevMonthData.outbound;
      const variation =
        prevCashFlow !== 0
          ? ((cashFlowNet - prevCashFlow) / Math.abs(prevCashFlow)) * 100
          : 0;

      // Stats basées sur les transactions réelles
      const totalInbound =
        transactionsData
          ?.filter((tx: any) => tx.side === 'credit')
          .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0) || 0;
      const totalOutbound =
        transactionsData
          ?.filter((tx: any) => tx.side === 'debit')
          .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0) || 0;

      // Récupérer AR/AP depuis financial_documents (factures réelles)
      let arTotal = 0;
      let arCount = 0;
      let apTotal = 0;
      let apCount = 0;

      try {
        // AR (Accounts Receivable) - Factures clients impayées
        const { data: arData } = await supabase
          .from('financial_documents')
          .select('total_ttc, amount_paid')
          .eq('document_direction', 'inbound')
          .not('status', 'in', '(paid,cancelled)');

        if (arData) {
          arData.forEach((doc: any) => {
            const unpaid = (doc.total_ttc || 0) - (doc.amount_paid || 0);
            if (unpaid > 0) {
              arTotal += unpaid;
              arCount++;
            }
          });
        }

        // AP (Accounts Payable) - Factures fournisseurs impayées
        const { data: apData } = await supabase
          .from('financial_documents')
          .select('total_ttc, amount_paid')
          .eq('document_direction', 'outbound')
          .not('status', 'in', '(paid,cancelled)');

        if (apData) {
          apData.forEach((doc: any) => {
            const unpaid = (doc.total_ttc || 0) - (doc.amount_paid || 0);
            if (unpaid > 0) {
              apTotal += unpaid;
              apCount++;
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching AR/AP from financial_documents:', err);
      }

      setStats({
        total_invoiced_ar: arTotal,
        total_paid_ar: totalInbound,
        unpaid_count_ar: arCount,
        overdue_ar: 0,
        total_invoiced_ap: apTotal,
        total_paid_ap: totalOutbound,
        unpaid_count_ap: apCount,
        overdue_ap: 0,
        net_balance: totalInbound - totalOutbound,
        net_cash_flow: cashFlowNet,
      });

      // Mettre à jour les métriques
      setMetrics({
        burnRate: avgBurnRate,
        runwayMonths:
          avgBurnRate > 0 ? (bankData?.totalBalance || 0) / avgBurnRate : 999,
        cashFlowNet,
        cashFlowVariation: variation,
      });

      // 3. Prévisions basées sur le burn rate moyen
      const forecasts: TreasuryForecast[] = [];
      const currentBalance = bankData?.totalBalance || 0;

      for (const days of [30, 60, 90]) {
        const monthsAhead = days / 30;
        // Prévision simple: balance - (burn rate * mois)
        const projectedOutbound = avgBurnRate * monthsAhead;
        // Estimation entrées basée sur moyenne des crédits
        const avgInbound =
          lastSixMonths.reduce(
            (sum, m) => sum + (monthlyData[m]?.inbound || 0),
            0
          ) / Math.max(lastSixMonths.length, 1);
        const projectedInbound = avgInbound * monthsAhead;

        forecasts.push({
          period: `${days}d` as '30d' | '60d' | '90d',
          expected_inbound: projectedInbound,
          expected_outbound: projectedOutbound,
          projected_balance:
            currentBalance + projectedInbound - projectedOutbound,
        });
      }

      setForecasts(forecasts);

      // 4. Répartition dépenses par catégorie (depuis expenses)
      const { data: expensesCategoryData, error: expensesCatError } =
        await supabase
          .from('v_expenses_with_details')
          .select('category, amount')
          .eq('side', 'debit')
          .gte('emitted_at', defaultStartDate)
          .lte('emitted_at', defaultEndDate);

      if (!expensesCatError && expensesCategoryData) {
        const categoryData: Record<string, { total: number; count: number }> =
          {};
        let totalExpenses = 0;

        expensesCategoryData.forEach((exp: any) => {
          const cat = exp.category || 'other';
          if (!categoryData[cat]) {
            categoryData[cat] = { total: 0, count: 0 };
          }
          categoryData[cat].total += Math.abs(exp.amount);
          categoryData[cat].count += 1;
          totalExpenses += Math.abs(exp.amount);
        });

        const breakdownArray: ExpenseBreakdown[] = Object.entries(categoryData)
          .map(([name, data]) => ({
            category_name: name,
            category_code: name,
            total_amount: data.total,
            count: data.count,
            percentage:
              totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
          }))
          .sort((a, b) => b.total_amount - a.total_amount);

        setExpenseBreakdown(breakdownArray);
      }
    } catch (err: any) {
      console.error('Error fetching treasury stats:', err);
      setError(err.message || 'Erreur chargement statistiques');
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // FETCH BANK BALANCE (via API Qonto - avec invalidation cache)
  // ===================================================================

  const fetchBankBalance = async (forceRefresh = false) => {
    // Si pas de forceRefresh, vérifier le cache d'abord
    if (!forceRefresh) {
      const cachedData = getCachedBalance();
      if (cachedData) {
        setBankData(cachedData);
        return;
      }
    }

    setBankLoading(true);
    try {
      const response = await fetch('/api/qonto/balance');
      if (response.ok) {
        const data: BankBalanceData = await response.json();
        setCachedBalance(data); // Mettre en cache
        setBankData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch bank balance:', err);
    } finally {
      setBankLoading(false);
    }
  };

  return {
    // Stats
    stats,
    evolution,
    expenseBreakdown,
    forecasts,

    // Bank accounts (nouveau)
    bankData,
    bankAccounts: bankData?.accounts ?? [],
    totalBalance: bankData?.totalBalance ?? 0,
    bankBalance, // Legacy compatibility
    bankLoading,

    // Métriques calculées (nouveau)
    metrics,
    burnRate: metrics?.burnRate ?? 0,
    runwayMonths: metrics?.runwayMonths ?? 0,
    cashFlowNet: metrics?.cashFlowNet ?? 0,

    // State
    loading,
    error,

    // Actions
    refresh: fetchStats,
    refreshBankBalance: () => fetchBankBalance(true), // Force refresh pour bouton "Actualiser"
  };
}

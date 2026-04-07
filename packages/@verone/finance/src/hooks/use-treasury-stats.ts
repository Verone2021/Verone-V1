'use client';

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

import { getCachedBalance, setCachedBalance } from './use-treasury-stats.cache';
import { computeTransactionStats } from './use-treasury-stats.helpers';
import type {
  BankBalanceData,
  ExpenseBreakdown,
  TreasuryEvolution,
  TreasuryForecast,
  TreasuryMetrics,
  TreasuryStats,
} from './use-treasury-stats.types';

export type {
  BankAccountBalance,
  BankBalanceData,
  ExpenseBreakdown,
  TreasuryEvolution,
  TreasuryForecast,
  TreasuryMetrics,
  TreasuryStats,
} from './use-treasury-stats.types';

export function useTreasuryStats(startDate?: string, endDate?: string) {
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [evolution, setEvolution] = useState<TreasuryEvolution[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>(
    []
  );
  const [forecasts, setForecasts] = useState<TreasuryForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankData, setBankData] = useState<BankBalanceData | null>(null);
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  const bankBalance = bankData?.totalBalance ?? null;
  const supabase = createClient();

  const defaultStartDate =
    startDate ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEndDate = endDate ?? new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!featureFlags.financeEnabled) return;
    // Trigger re-render when dates change
  }, [defaultStartDate, defaultEndDate]);

  useEffect(() => {
    if (!featureFlags.financeEnabled) return;

    const fetchAllData = async () => {
      // 1. Fetch bank balance (avec cache module-level)
      setBankLoading(true);
      let currentTotalBalance = 0;

      const cachedData = getCachedBalance();
      if (cachedData) {
        setBankData(cachedData);
        currentTotalBalance = cachedData.totalBalance ?? 0;
        setBankLoading(false);
      } else {
        try {
          const response = await fetch('/api/qonto/balance');
          if (response.ok) {
            const data = (await response.json()) as BankBalanceData;
            setCachedBalance(data);
            setBankData(data);
            currentTotalBalance = data.totalBalance ?? 0;
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
        const result = await computeTransactionStats(
          supabase,
          currentTotalBalance,
          defaultStartDate,
          defaultEndDate
        );
        setEvolution(result.evolution);
        setStats(result.stats);
        setMetrics(result.metrics);
        setForecasts(result.forecasts);
        setExpenseBreakdown(result.expenseBreakdown);
      } catch (err: unknown) {
        console.error('Error fetching treasury stats:', err);
        setError(
          err instanceof Error ? err.message : 'Erreur chargement statistiques'
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!featureFlags.financeEnabled) {
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

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await computeTransactionStats(
        supabase,
        bankData?.totalBalance ?? 0,
        defaultStartDate,
        defaultEndDate
      );
      setEvolution(result.evolution);
      setStats(result.stats);
      setMetrics(result.metrics);
      setForecasts(result.forecasts);
      setExpenseBreakdown(result.expenseBreakdown);
    } catch (err: unknown) {
      console.error('Error fetching treasury stats:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur chargement statistiques'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBankBalance = async (forceRefresh = false) => {
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
        const data = (await response.json()) as BankBalanceData;
        setCachedBalance(data);
        setBankData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch bank balance:', err);
    } finally {
      setBankLoading(false);
    }
  };

  return {
    stats,
    evolution,
    expenseBreakdown,
    forecasts,
    bankData,
    bankAccounts: bankData?.accounts ?? [],
    totalBalance: bankData?.totalBalance ?? 0,
    bankBalance,
    bankLoading,
    metrics,
    burnRate: metrics?.burnRate ?? 0,
    runwayMonths: metrics?.runwayMonths ?? 0,
    cashFlowNet: metrics?.cashFlowNet ?? 0,
    loading,
    error,
    refresh: fetchStats,
    refreshBankBalance: () => fetchBankBalance(true),
  };
}

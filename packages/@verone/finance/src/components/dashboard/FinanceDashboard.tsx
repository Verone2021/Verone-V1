'use client';

/**
 * FinanceDashboard — Pilotage style Indy
 *
 * 3 sections :
 * 1. Activite — KPIs (CA, Charges, Resultat) + graphique barres/ligne 12 mois
 * 2. Resultat — Decomposition CA - Charges = Resultat + Donut charges
 * 3. Tresorerie — Solde Qonto + cards (Factures en attente, TVA, IS)
 */

import { useState, useMemo, useCallback } from 'react';

import { useBankTransactionStats } from '../../hooks/use-bank-transaction-stats';
import { useTreasuryStats } from '../../hooks/use-treasury-stats';
import { FinanceDashboardActivity } from './FinanceDashboardActivity';
import { FinanceDashboardFilters } from './FinanceDashboardFilters';
import { FinanceDashboardResult } from './FinanceDashboardResult';
import { FinanceDashboardTreasury } from './FinanceDashboardTreasury';
import {
  ALL_YEARS_VALUE,
  type FinanceFilters,
  getDateRangeForFilters,
} from './finance-dashboard-utils';

export function FinanceDashboard(): React.ReactNode {
  const [filters, setFilters] = useState<FinanceFilters>({
    year: ALL_YEARS_VALUE,
    months: [],
  });

  const dateRange = useMemo(() => getDateRangeForFilters(filters), [filters]);

  const { stats, evolution, categoryBreakdown, loading, error, refresh } =
    useBankTransactionStats({
      months: 24,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  const {
    totalBalance,
    bankLoading,
    stats: treasuryStats,
    refreshBankBalance,
  } = useTreasuryStats();

  const handleYearChange = useCallback((yearStr: string) => {
    setFilters({ year: Number(yearStr), months: [] });
  }, []);

  const handleMonthToggle = useCallback(
    (month: number) => {
      const newMonths = filters.months.includes(month)
        ? filters.months.filter(m => m !== month)
        : [...filters.months, month];
      setFilters({ year: filters.year, months: newMonths });
    },
    [filters.year, filters.months]
  );

  const handleClearMonths = useCallback(() => {
    setFilters({ year: filters.year, months: [] });
  }, [filters.year]);

  const handleRefreshAll = (): void => {
    void refresh();
    void refreshBankBalance();
  };

  const chiffreAffaires = stats?.revenue ?? 0;
  const totalEncaissements = stats?.totalCredit ?? 0;
  const charges = stats?.totalDebit ?? 0;
  const resultat = chiffreAffaires - charges;
  const hasUncategorizedCredit = (stats?.uncategorizedCredit ?? 0) > 0;

  const facturesEnAttente = treasuryStats?.unpaid_count_ar ?? 0;
  const montantAR =
    (treasuryStats?.total_invoiced_ar ?? 0) -
    (treasuryStats?.total_paid_ar ?? 0);

  return (
    <div className="min-h-screen bg-white">
      <FinanceDashboardFilters
        filters={filters}
        onYearChange={handleYearChange}
        onMonthToggle={handleMonthToggle}
        onClearMonths={handleClearMonths}
        onRefresh={handleRefreshAll}
        loading={loading}
      />

      <div className="p-6 space-y-8">
        {error && !loading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        <FinanceDashboardActivity
          chiffreAffaires={chiffreAffaires}
          totalEncaissements={totalEncaissements}
          charges={charges}
          resultat={resultat}
          hasUncategorizedCredit={hasUncategorizedCredit}
          uncategorizedCredit={stats?.uncategorizedCredit ?? 0}
          evolution={evolution}
          loading={loading}
        />

        <FinanceDashboardResult
          chiffreAffaires={chiffreAffaires}
          charges={charges}
          resultat={resultat}
          categoryBreakdown={categoryBreakdown}
          loading={loading}
        />

        <FinanceDashboardTreasury
          totalBalance={totalBalance}
          bankLoading={bankLoading}
          montantAR={montantAR}
          facturesEnAttente={facturesEnAttente}
        />
      </div>
    </div>
  );
}

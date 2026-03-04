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

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  Landmark,
  FileText,
  Percent,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useBankTransactionStats } from '../../hooks/use-bank-transaction-stats';
import { useTreasuryStats } from '../../hooks/use-treasury-stats';

// =====================================================================
// FILTER CONFIG
// =====================================================================

const ALL_YEARS_VALUE = 0;

interface FinanceFilters {
  year: number;
  months: number[];
}

const MONTHS = [
  { value: 1, label: 'Janv.', fullLabel: 'Janvier' },
  { value: 2, label: 'Fevr.', fullLabel: 'Fevrier' },
  { value: 3, label: 'Mars', fullLabel: 'Mars' },
  { value: 4, label: 'Avr.', fullLabel: 'Avril' },
  { value: 5, label: 'Mai', fullLabel: 'Mai' },
  { value: 6, label: 'Juin', fullLabel: 'Juin' },
  { value: 7, label: 'Juil.', fullLabel: 'Juillet' },
  { value: 8, label: 'Aout', fullLabel: 'Aout' },
  { value: 9, label: 'Sept.', fullLabel: 'Septembre' },
  { value: 10, label: 'Oct.', fullLabel: 'Octobre' },
  { value: 11, label: 'Nov.', fullLabel: 'Novembre' },
  { value: 12, label: 'Dec.', fullLabel: 'Decembre' },
];

const AVAILABLE_YEARS = Array.from(
  { length: new Date().getFullYear() - 2022 },
  (_, i) => new Date().getFullYear() - i
);

function getDateRangeForFilters(filters: FinanceFilters): {
  startDate: Date | null;
  endDate: Date | null;
} {
  if (filters.year === ALL_YEARS_VALUE) {
    return { startDate: null, endDate: null };
  }
  const year = filters.year;
  const months = filters.months;
  if (months.length === 0) {
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  }
  const sortedMonths = [...months].sort((a, b) => a - b);
  const firstMonth = sortedMonths[0];
  const lastMonth = sortedMonths[sortedMonths.length - 1];
  const lastDay = new Date(year, lastMonth, 0).getDate();
  return {
    startDate: new Date(year, firstMonth - 1, 1),
    endDate: new Date(year, lastMonth - 1, lastDay, 23, 59, 59),
  };
}

function formatFiltersLabel(filters: FinanceFilters): string {
  if (filters.year === ALL_YEARS_VALUE) return 'Toutes les donnees';
  if (filters.months.length === 0) return `Annee ${filters.year}`;
  if (filters.months.length === 1) {
    const month = MONTHS.find(m => m.value === filters.months[0]);
    return `${month?.fullLabel} ${filters.year}`;
  }
  if (filters.months.length === 12) return `Annee ${filters.year}`;
  const sortedMonths = [...filters.months].sort((a, b) => a - b);
  const monthLabels = sortedMonths.map(
    m => MONTHS.find(mo => mo.value === m)?.label
  );
  return `${monthLabels.join(', ')} ${filters.year}`;
}

// =====================================================================
// FORMATTERS
// =====================================================================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const DONUT_COLORS = [
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#64748b', // slate
];

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function FinanceDashboard() {
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

  // Treasury data (Qonto balance + AR/AP)
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

  const handleRefreshAll = () => {
    refresh();
    refreshBankBalance();
  };

  const isAllTime = filters.year === ALL_YEARS_VALUE;
  const dateLabel = formatFiltersLabel(filters);

  // Metrics
  const chiffreAffaires = stats?.totalCredit || 0;
  const charges = stats?.totalDebit || 0;
  const resultat = chiffreAffaires - charges;

  // AR/AP from treasury
  const facturesEnAttente = treasuryStats?.unpaid_count_ar ?? 0;
  const montantAR =
    (treasuryStats?.total_invoiced_ar ?? 0) -
    (treasuryStats?.total_paid_ar ?? 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header + Filtres */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pilotage</h1>
              <p className="text-sm text-gray-500">
                Vue d&apos;ensemble de votre activite financiere
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Tabs
                value={String(filters.year)}
                onValueChange={handleYearChange}
              >
                <TabsList className="bg-gray-100">
                  <TabsTrigger
                    value={String(ALL_YEARS_VALUE)}
                    className="text-xs data-[state=active]:bg-rose-500 data-[state=active]:text-white px-4"
                  >
                    Tout
                  </TabsTrigger>
                  {AVAILABLE_YEARS.map(year => (
                    <TabsTrigger
                      key={year}
                      value={String(year)}
                      className="text-xs data-[state=active]:bg-white px-3"
                    >
                      {year}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-600 border-gray-200"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                {dateLabel}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={cn('h-4 w-4', loading && 'animate-spin')}
                />
                Actualiser
              </Button>
            </div>

            {!isAllTime && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 mr-1">Mois:</span>
                {MONTHS.map(month => {
                  const isSelected = filters.months.includes(month.value);
                  return (
                    <button
                      key={month.value}
                      onClick={() => handleMonthToggle(month.value)}
                      className={cn(
                        'text-xs px-2 py-1 rounded border transition-colors',
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                      {month.label}
                    </button>
                  );
                })}
                {filters.months.length > 0 && (
                  <button
                    onClick={handleClearMonths}
                    className="text-xs text-rose-600 hover:underline ml-2"
                  >
                    Tout effacer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {error && !loading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 1 — ACTIVITE                                         */}
        {/* ============================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activite</h2>
          <div className="flex gap-6">
            {/* KPIs verticaux a gauche */}
            <div className="w-56 flex-shrink-0 space-y-3">
              <KpiSideCard
                label="Chiffre d'affaires"
                value={chiffreAffaires}
                color="green"
              />
              <KpiSideCard
                label="Charges d'exploitation"
                value={charges}
                color="rose"
              />
              <KpiSideCard
                label="Resultat d'exploitation"
                value={resultat}
                color={resultat >= 0 ? 'green' : 'red'}
              />
            </div>

            {/* Graphique central — Barres (Charges) + Ligne (CA) */}
            <Card className="flex-1">
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : evolution.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                    Aucune donnee disponible
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={evolution}>
                      <XAxis
                        dataKey="monthLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'credit'
                            ? 'CA'
                            : name === 'debit'
                              ? 'Charges'
                              : name,
                        ]}
                      />
                      <Bar
                        dataKey="debit"
                        fill="#fda4af"
                        radius={[4, 4, 0, 0]}
                        name="debit"
                      />
                      <Line
                        type="monotone"
                        dataKey="credit"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#22c55e' }}
                        name="credit"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tableau mensuel expansible */}
          {!loading && evolution.length > 0 && (
            <Card className="mt-4">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-4 px-4 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 border-b uppercase tracking-wide">
                  <div>Mois</div>
                  <div className="text-right">CA</div>
                  <div className="text-right">Charges</div>
                </div>
                {evolution.slice(-12).map(row => (
                  <div
                    key={row.monthLabel}
                    className="grid grid-cols-3 gap-4 px-4 py-2 border-b last:border-b-0 hover:bg-gray-50 text-sm"
                  >
                    <div className="capitalize text-gray-700">
                      {row.monthLabel}
                    </div>
                    <div className="text-right text-green-600 font-medium">
                      {formatCurrency(row.credit)}
                    </div>
                    <div className="text-right text-rose-600 font-medium">
                      {formatCurrency(row.debit)}
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="grid grid-cols-3 gap-4 px-4 py-2.5 bg-gray-100 font-bold text-sm border-t">
                  <div>Total</div>
                  <div className="text-right text-green-700">
                    {formatCurrency(chiffreAffaires)}
                  </div>
                  <div className="text-right text-rose-700">
                    {formatCurrency(charges)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECTION 2 — RESULTAT                                         */}
        {/* ============================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultat</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card decomposition resultat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Resultat apres impot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ResultRow
                  label="Chiffre d'affaires"
                  value={chiffreAffaires}
                  positive
                />
                <ResultRow label="Charges d'exploitation" value={-charges} />
                <div className="border-t pt-3">
                  <ResultRow
                    label="Resultat d'exploitation"
                    value={resultat}
                    bold
                    positive={resultat >= 0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Donut charges par categorie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Charges d&apos;exploitation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : categoryBreakdown.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                    Aucune donnee
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={categoryBreakdown.slice(0, 7)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="totalAmount"
                          stroke="none"
                        >
                          {categoryBreakdown.slice(0, 7).map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {categoryBreakdown.slice(0, 6).map((cat, index) => (
                        <div
                          key={cat.code}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  DONUT_COLORS[index % DONUT_COLORS.length],
                              }}
                            />
                            <span className="truncate text-gray-700">
                              {cat.label}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(cat.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3 — TRESORERIE                                       */}
        {/* ============================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tresorerie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Solde Qonto */}
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Solde bancaire</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {bankLoading ? (
                    <span className="text-gray-400">...</span>
                  ) : (
                    formatCurrency(totalBalance)
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">Qonto</p>
              </CardContent>
            </Card>

            {/* Factures en attente */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Factures en attente
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(montantAR)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {facturesEnAttente} facture
                  {facturesEnAttente > 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Solde TVA estimee */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Solde TVA</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-400 mt-1">
                  Voir Documents &gt; TVA
                </p>
              </CardContent>
            </Card>

            {/* IS a payer */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">IS a payer</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-400 mt-1">
                  Estim. expert-comptable
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function KpiSideCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'green' | 'rose' | 'red';
}) {
  const colorMap = {
    green: 'border-l-green-500 bg-green-50',
    rose: 'border-l-rose-400 bg-rose-50',
    red: 'border-l-red-500 bg-red-50',
  };
  const textColor = {
    green: 'text-green-700',
    rose: 'text-rose-700',
    red: 'text-red-700',
  };

  return (
    <div className={cn('rounded-lg border border-l-4 p-3', colorMap[color])}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn('text-lg font-bold', textColor[color])}>
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)}
      </p>
    </div>
  );
}

function ResultRow({
  label,
  value,
  bold,
  positive,
}: {
  label: string;
  value: number;
  bold?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn('text-sm', bold ? 'font-semibold' : 'text-gray-600')}>
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium',
          bold && 'text-base font-bold',
          positive === true && 'text-green-600',
          positive === false && 'text-red-600',
          positive === undefined && 'text-gray-900'
        )}
      >
        {value >= 0 ? '+' : ''}
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)}
      </span>
    </div>
  );
}

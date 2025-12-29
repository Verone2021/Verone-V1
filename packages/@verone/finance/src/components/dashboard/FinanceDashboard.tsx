'use client';

/**
 * FinanceDashboard - Dashboard Finance complet
 * Design: Haute qualité inspiré Qonto/Pennylane/Stripe
 *
 * CORRIGÉ: Utilise maintenant useBankTransactionStats qui récupère
 * les vraies données des transactions bancaires classifiées.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │ Filtres Année/Mois                                  │
 * ├─────────────────────────────────────────────────────┤
 * │ KPI Header (5 cartes)                               │
 * ├────────────────────────────┬────────────────────────┤
 * │ Évolution Trésorerie       │ Dépenses par Org       │
 * │ (AreaChart)                │ (DonutChart)           │
 * ├────────────────────────────┴────────────────────────┤
 * │ Entrées / Sorties Mensuelles (BarChart)             │
 * └─────────────────────────────────────────────────────┘
 */

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';

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
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  Minus,
  Percent,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useBankTransactionStats } from '../../hooks/use-bank-transaction-stats';

// =====================================================================
// FILTER TYPES & CONFIG
// =====================================================================

const ALL_YEARS_VALUE = 0;

interface FinanceFilters {
  year: number; // 0 = Tout
  months: number[]; // 1-12, vide = tous les mois
}

const MONTHS = [
  { value: 1, label: 'Janv.', fullLabel: 'Janvier' },
  { value: 2, label: 'Févr.', fullLabel: 'Février' },
  { value: 3, label: 'Mars', fullLabel: 'Mars' },
  { value: 4, label: 'Avr.', fullLabel: 'Avril' },
  { value: 5, label: 'Mai', fullLabel: 'Mai' },
  { value: 6, label: 'Juin', fullLabel: 'Juin' },
  { value: 7, label: 'Juil.', fullLabel: 'Juillet' },
  { value: 8, label: 'Août', fullLabel: 'Août' },
  { value: 9, label: 'Sept.', fullLabel: 'Septembre' },
  { value: 10, label: 'Oct.', fullLabel: 'Octobre' },
  { value: 11, label: 'Nov.', fullLabel: 'Novembre' },
  { value: 12, label: 'Déc.', fullLabel: 'Décembre' },
];

const AVAILABLE_YEARS = [2023, 2024, 2025];

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
  if (filters.year === ALL_YEARS_VALUE) {
    return 'Toutes les données';
  }

  if (filters.months.length === 0) {
    return `Année ${filters.year}`;
  }

  if (filters.months.length === 1) {
    const month = MONTHS.find(m => m.value === filters.months[0]);
    return `${month?.fullLabel} ${filters.year}`;
  }

  if (filters.months.length === 12) {
    return `Année ${filters.year}`;
  }

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

const formatPercent = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

// Couleurs pour le donut chart
const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#64748b', // slate (autres)
];

// =====================================================================
// COMPOSANTS
// =====================================================================

function KpiCard({
  title,
  value,
  variation,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  variation?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Icon size={20} className="text-slate-600" />
          </div>
          {variation !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-slate-500'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight size={14} />
              ) : trend === 'down' ? (
                <ArrowDownRight size={14} />
              ) : (
                <Minus size={14} />
              )}
              {formatPercent(variation)}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function FinanceDashboard() {
  // État des filtres
  const [filters, setFilters] = useState<FinanceFilters>({
    year: ALL_YEARS_VALUE,
    months: [],
  });

  // Calculer la plage de dates selon les filtres
  const dateRange = useMemo(() => getDateRangeForFilters(filters), [filters]);

  // Hook avec les options de filtrage
  const {
    stats,
    evolution,
    organisationBreakdown,
    categoryBreakdown,
    loading,
    error,
    refresh,
  } = useBankTransactionStats({
    months: 24, // Fallback si pas de filtre
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Handlers pour les filtres
  const handleYearChange = useCallback((yearStr: string) => {
    const newYear = Number(yearStr);
    setFilters({ year: newYear, months: [] });
  }, []);

  const handleMonthToggle = useCallback(
    (month: number) => {
      const currentMonths = filters.months;
      const newMonths = currentMonths.includes(month)
        ? currentMonths.filter(m => m !== month)
        : [...currentMonths, month];
      setFilters({ year: filters.year, months: newMonths });
    },
    [filters.year, filters.months]
  );

  const handleClearMonths = useCallback(() => {
    setFilters({ year: filters.year, months: [] });
  }, [filters.year]);

  const isAllTime = filters.year === ALL_YEARS_VALUE;
  const dateLabel = formatFiltersLabel(filters);

  // Calculer les métriques pertinentes
  const chiffreAffaires = stats?.totalCredit || 0;
  const depenses = stats?.totalDebit || 0;
  const resultatNet = chiffreAffaires - depenses;
  const marge = chiffreAffaires > 0 ? (resultatNet / chiffreAffaires) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Titre */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Dashboard Finance
              </h1>
              <p className="text-sm text-slate-500">
                Vue d'ensemble de votre trésorerie et dépenses
              </p>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-3">
            {/* Row 1: Year selector + Badge + Refresh */}
            <div className="flex items-center gap-3 flex-wrap">
              <Tabs
                value={String(filters.year)}
                onValueChange={handleYearChange}
              >
                <TabsList className="bg-gray-100">
                  <TabsTrigger
                    value={String(ALL_YEARS_VALUE)}
                    className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4"
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
                onClick={refresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={cn('h-4 w-4', loading && 'animate-spin')}
                />
                Actualiser
              </Button>
            </div>

            {/* Row 2: Month selector (hidden when "Tout") */}
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
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
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
                    className="text-xs text-indigo-600 hover:underline ml-2"
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
      <div className="p-6">
        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {/* KPIs - 4 métriques pertinentes */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            title="Chiffre d'Affaires"
            value={formatCurrency(chiffreAffaires)}
            icon={TrendingUp}
            trend="up"
          />
          <KpiCard
            title="Dépenses"
            value={formatCurrency(depenses)}
            icon={TrendingDown}
            trend="down"
          />
          <KpiCard
            title="Résultat Net"
            value={formatCurrency(resultatNet)}
            icon={Wallet}
            trend={resultatNet >= 0 ? 'up' : 'down'}
          />
          <KpiCard
            title="Marge"
            value={`${marge.toFixed(1)}%`}
            icon={Percent}
            trend={marge >= 0 ? 'up' : 'down'}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Évolution Trésorerie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Évolution Trésorerie
              </CardTitle>
              <p className="text-xs text-slate-500">12 derniers mois</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : evolution.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <AreaChart data={evolution}>
                    <defs>
                      <linearGradient
                        id="balanceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
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
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [
                        formatCurrency(value),
                        'Balance',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#balanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Dépenses par Catégorie PCG */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Dépenses par Catégorie
              </CardTitle>
              <p className="text-xs text-slate-500">
                Répartition selon le Plan Comptable
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : categoryBreakdown.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Aucune donnée disponible
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
                            fill={COLORS[index % COLORS.length]}
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
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="truncate text-slate-700">
                            {cat.label}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">
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

        {/* Charts Row 2 - Entrées/Sorties Mensuelles */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Entrées / Sorties Mensuelles
            </CardTitle>
            <p className="text-xs text-slate-500">6 derniers mois</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : evolution.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={evolution.slice(-6)}>
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
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
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
                      name === 'credit' ? 'Entrées' : 'Sorties',
                    ]}
                  />
                  <Bar dataKey="credit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debit" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Link href="/finance/transactions">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <CreditCard size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Transactions</p>
                  <p className="text-sm text-slate-500">
                    Toutes les opérations
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-400" />
            </div>
          </Link>

          <Link href="/finance/depenses">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Dépenses</p>
                  <p className="text-sm text-slate-500">Liste détaillée</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-400" />
            </div>
          </Link>

          <Link href="/finance/rapprochement">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <CreditCard size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Rapprochement</p>
                  <p className="text-sm text-slate-500">Matcher commandes</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-400" />
            </div>
          </Link>

          <Link href="/finance/depenses/regles">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                  <Settings size={20} className="text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Règles</p>
                  <p className="text-sm text-slate-500">Classification auto</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

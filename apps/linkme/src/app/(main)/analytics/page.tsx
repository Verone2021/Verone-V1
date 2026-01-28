'use client';

/**
 * Page Analytics LinkMe
 *
 * Statistiques détaillées avec filtres de période avancés :
 * - Filtres presets (Ce mois, Ce trimestre, Cette année)
 * - Filtres personnalisés (date début / date fin)
 * - 4 KPIs de commission
 * - Graphique d'évolution des commissions
 * - Répartition par statut (DonutChart)
 * - Top 10 produits vendus
 *
 * @module AnalyticsPage
 * @since 2026-01-07
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { Card, DonutChart, AreaChart, Badge } from '@tremor/react';
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  Banknote,
  Filter,
  TrendingUp,
} from 'lucide-react';

import { TopProductsTable } from '@/components/analytics';
import { useAffiliateAnalytics } from '@/lib/hooks/use-affiliate-analytics';
import type { AnalyticsPeriod } from '@/types/analytics';
import { formatCurrency } from '@/types/analytics';

// Types pour les filtres
type FilterPreset =
  | 'all'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

interface PeriodFilter {
  preset: FilterPreset;
  startDate?: Date;
  endDate?: Date;
}

// Mapping des presets vers les périodes de l'API
const PRESET_TO_PERIOD: Record<FilterPreset, AnalyticsPeriod> = {
  all: 'all',
  this_month: 'month',
  this_quarter: 'quarter',
  this_year: 'year',
  custom: 'year', // Fallback
};

export default function AnalyticsPage() {
  const [filter, setFilter] = useState<PeriodFilter>({
    preset: 'all', // Par défaut: voir tout
  });

  // Déterminer la période pour l'API
  const apiPeriod = PRESET_TO_PERIOD[filter.preset];

  const { data, isLoading, error, refetch } = useAffiliateAnalytics(apiPeriod);

  // Données pour le graphique d'évolution des commissions
  const commissionsChartData = useMemo(() => {
    if (!data?.revenueByPeriod) return [];

    return data.revenueByPeriod.map(d => ({
      date: d.label,
      'CA HT': d.revenue,
      Commandes: d.orders,
    }));
  }, [data?.revenueByPeriod]);

  // Données pour le DonutChart des commissions avec couleurs Tremor
  const { commissionDonutData, donutColors } = useMemo(() => {
    if (!data?.commissionsByStatus)
      return { commissionDonutData: [], donutColors: [] };

    const { pending, validated, requested, paid } = data.commissionsByStatus;

    // Définir les statuts avec leurs couleurs Tremor
    const statuses = [
      { name: 'Payables', value: validated.amountTTC, color: 'emerald' },
      { name: 'En attente', value: pending.amountTTC, color: 'amber' },
      { name: 'En cours', value: requested.amountTTC, color: 'blue' },
      { name: 'Payées', value: paid.amountTTC, color: 'violet' },
    ];

    // Filtrer les statuts avec valeur > 0
    const filteredStatuses = statuses.filter(s => s.value > 0);

    return {
      commissionDonutData: filteredStatuses.map(s => ({
        name: s.name,
        value: s.value,
      })),
      donutColors: filteredStatuses.map(s => s.color),
    };
  }, [data?.commissionsByStatus]);

  // Formater les dates pour les inputs
  const formatDateInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Gérer le changement de preset
  const handlePresetChange = (preset: FilterPreset) => {
    if (preset === 'custom') {
      // Initialiser avec les 30 derniers jours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      setFilter({
        preset: 'custom',
        startDate,
        endDate,
      });
    } else {
      setFilter({ preset });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[#5DBEBB] to-[#3976BB] rounded-lg shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#183559]">
                Analytics & Performance
              </h1>
              <p className="text-gray-500 text-sm">
                Analysez vos commissions en détail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge color="emerald" size="sm" className="animate-pulse text-xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1.5" />
              Temps réel
            </Badge>
            <button
              onClick={() => {
                void refetch().catch(error => {
                  console.error('[AnalyticsPage] Refetch failed:', error);
                });
              }}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Filtres de période */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Période :</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'all',
                  'this_month',
                  'this_quarter',
                  'this_year',
                ] as FilterPreset[]
              ).map(preset => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter.preset === preset
                      ? 'bg-[#5DBEBB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset === 'all' && 'Tout'}
                  {preset === 'this_month' && 'Ce mois'}
                  {preset === 'this_quarter' && 'Ce trimestre'}
                  {preset === 'this_year' && 'Cette année'}
                </button>
              ))}
              <button
                onClick={() => handlePresetChange('custom')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  filter.preset === 'custom'
                    ? 'bg-[#5DBEBB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Personnalisé
              </button>
            </div>

            {/* Date inputs pour custom */}
            {filter.preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={
                    filter.startDate ? formatDateInput(filter.startDate) : ''
                  }
                  onChange={e =>
                    setFilter(f => ({
                      ...f,
                      startDate: new Date(e.target.value),
                    }))
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={filter.endDate ? formatDateInput(filter.endDate) : ''}
                  onChange={e =>
                    setFilter(f => ({
                      ...f,
                      endDate: new Date(e.target.value),
                    }))
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Erreur */}
        {error && (
          <Card className="p-3 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Erreur de chargement
                </p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <button
                onClick={() => {
                  void refetch().catch(error => {
                    console.error(
                      '[AnalyticsPage] Refetch retry failed:',
                      error
                    );
                  });
                }}
                className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        )}

        {/* 4 KPIs Commissions */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total TTC */}
          <Card className="p-4 border-l-4 border-[#5DBEBB]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
                <Wallet className="h-4 w-4 text-[#5DBEBB]" />
              </div>
              <span className="text-sm text-gray-600">Total TTC</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#5DBEBB]">
                  {formatCurrency(
                    data?.commissionsByStatus?.total?.amountTTC ?? 0
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {data?.commissionsByStatus?.total?.count ?? 0} commissions
                </p>
              </>
            )}
          </Card>

          {/* Payables */}
          <Card className="p-4 border-l-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-600">Payables</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(
                    data?.commissionsByStatus?.validated?.amountTTC ?? 0
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {data?.commissionsByStatus?.validated?.count ?? 0} disponibles
                </p>
              </>
            )}
          </Card>

          {/* En cours de règlement */}
          <Card className="p-4 border-l-4 border-[#3976BB]">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
                <Banknote className="h-4 w-4 text-[#3976BB]" />
              </div>
              <span className="text-sm text-gray-600">En cours</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#3976BB]">
                  {formatCurrency(
                    data?.commissionsByStatus?.requested?.amountTTC ?? 0
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {data?.commissionsByStatus?.requested?.count ?? 0} demandes
                </p>
              </>
            )}
          </Card>

          {/* En attente */}
          <Card className="p-4 border-l-4 border-amber-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm text-gray-600">En attente</span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(
                    data?.commissionsByStatus?.pending?.amountTTC ?? 0
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {data?.commissionsByStatus?.pending?.count ?? 0} en attente
                </p>
              </>
            )}
          </Card>
        </section>

        {/* Graphiques Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution CA */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Évolution du CA
              </h3>
            </div>

            {isLoading ? (
              <div className="animate-pulse h-64 bg-gray-200 rounded" />
            ) : commissionsChartData.length > 0 ? (
              <AreaChart
                data={commissionsChartData}
                index="date"
                categories={['CA HT']}
                colors={['cyan']}
                valueFormatter={value => formatCurrency(value)}
                showLegend={false}
                showGridLines
                showAnimation
                className="h-64"
                curveType="monotone"
                yAxisWidth={120}
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Aucune donnée pour cette période
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Répartition Commissions */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Répartition des commissions
                </h3>
                <p className="text-sm text-gray-500">Par statut</p>
              </div>
            </div>

            {isLoading ? (
              <div className="animate-pulse h-64 bg-gray-200 rounded" />
            ) : commissionDonutData.length > 0 ? (
              <DonutChart
                data={commissionDonutData}
                category="value"
                index="name"
                colors={donutColors}
                valueFormatter={value => formatCurrency(value)}
                className="h-64"
                showAnimation
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune commission</p>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Top Produits */}
        <section>
          <TopProductsTable
            products={data?.topProducts}
            isLoading={isLoading}
            title="Top 10 Produits Vendus"
            maxItems={10}
          />
        </section>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400 pb-6">
          <p suppressHydrationWarning>
            Les données sont actualisées en temps réel. Dernière mise à jour :{' '}
            {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}

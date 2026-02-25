'use client';

/**
 * Page Statistiques — Performances produits
 *
 * Affiche les stats de ventes produits de l'affilié :
 * - 2 KPIs : CA HT + Quantité vendue
 * - Graphique évolution du CA
 * - Top 10 produits vendus
 *
 * Source de données : useAffiliateAnalytics (linkme_commissions + order_items)
 *
 * @module StatistiquesPage
 * @since 2026-02-25
 */

import { useState, useMemo, Suspense } from 'react';

import { Card, AreaChart } from '@tremor/react';
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Filter,
  Calendar,
} from 'lucide-react';

import { TopProductsTable } from '@/components/analytics';
import { useAffiliateAnalytics } from '@/lib/hooks/use-affiliate-analytics';
import { formatCurrency } from '@/types/analytics';
import type { AnalyticsPeriod } from '@/types/analytics';

// ─── Types filtres période ─────────────────────────────────────────────────────

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

const PRESET_TO_PERIOD: Record<FilterPreset, AnalyticsPeriod> = {
  all: 'all',
  this_month: 'month',
  this_quarter: 'quarter',
  this_year: 'year',
  custom: 'year',
};

// ─── Contenu ──────────────────────────────────────────────────────────────────

function StatistiquesContent(): JSX.Element {
  const [filter, setFilter] = useState<PeriodFilter>({ preset: 'all' });

  const apiPeriod = PRESET_TO_PERIOD[filter.preset];
  const { data, isLoading, error, refetch } = useAffiliateAnalytics(apiPeriod);

  const caChartData = useMemo(() => {
    if (!data?.revenueByPeriod) return [];
    return data.revenueByPeriod.map(d => ({
      date: d.label,
      'CA HT': d.revenue,
    }));
  }, [data?.revenueByPeriod]);

  const formatDateInput = (date: Date): string =>
    date.toISOString().split('T')[0];

  const handlePresetChange = (preset: FilterPreset): void => {
    if (preset === 'custom') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      setFilter({ preset: 'custom', startDate, endDate });
    } else {
      setFilter({ preset });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#5DBEBB] to-[#3976BB] rounded-lg shadow-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#183559]">Statistiques</h1>
            <p className="text-gray-500 text-sm">
              Performances produits — quantités et chiffre d&apos;affaires
            </p>
          </div>
        </div>

        {/* Filtres période */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Période :</span>
            </div>

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
                  void refetch().catch(err => {
                    console.error('[Statistiques] Refetch failed:', err);
                  });
                }}
                className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        )}

        {/* 2 KPIs produits */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-l-4 border-[#5DBEBB]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-[#5DBEBB]" />
              </div>
              <span className="text-sm text-gray-600 font-medium">
                Chiffre d&apos;affaires HT
              </span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#5DBEBB]">
                  {formatCurrency(data?.totalRevenueHT ?? 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data?.totalOrders ?? 0} commande
                  {(data?.totalOrders ?? 0) > 1 ? 's' : ''}
                </p>
              </>
            )}
          </Card>

          <Card className="p-5 border-l-4 border-[#3976BB]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-[#3976BB]" />
              </div>
              <span className="text-sm text-gray-600 font-medium">
                Éléments vendus
              </span>
            </div>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#3976BB]">
                  {(data?.totalQuantitySold ?? 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  unités vendues sur la période
                </p>
              </>
            )}
          </Card>
        </section>

        {/* Graphique évolution du CA */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution du chiffre d&apos;affaires
            </h3>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-64 bg-gray-200 rounded" />
          ) : caChartData.length > 0 ? (
            <AreaChart
              data={caChartData}
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

        {/* Top produits */}
        <section>
          <TopProductsTable
            products={data?.topProducts}
            isLoading={isLoading}
            title="Top 10 Produits Vendus"
            maxItems={10}
          />
        </section>

        <div className="text-center text-xs text-gray-400 pb-2">
          <p suppressHydrationWarning>
            Données actualisées en temps réel · Dernière mise à jour :{' '}
            {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function StatistiquesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
        </div>
      }
    >
      <StatistiquesContent />
    </Suspense>
  );
}

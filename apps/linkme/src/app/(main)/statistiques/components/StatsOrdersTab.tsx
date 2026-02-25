'use client';

/**
 * StatsOrdersTab — Onglet Commandes de la page Statistiques
 *
 * Affiche :
 * - 4 KPIs : Nombre commandes, CA HT, Panier moyen, Taux de conversion
 * - Graphique évolution CA cumulatif
 *
 * @module StatsOrdersTab
 * @since 2026-02-25
 */

import { useMemo } from 'react';

import { Card, AreaChart } from '@tremor/react';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Target,
  Eye,
} from 'lucide-react';

import type { AffiliateAnalyticsData } from '@/types/analytics';
import { formatCurrency, formatPercentage } from '@/types/analytics';

interface StatsOrdersTabProps {
  data: AffiliateAnalyticsData | null | undefined;
  isLoading: boolean;
}

export function StatsOrdersTab({ data, isLoading }: StatsOrdersTabProps) {
  const caChartData = useMemo(() => {
    if (!data?.revenueByPeriod) return [];
    return data.revenueByPeriod.map(d => ({
      date: d.label,
      'CA HT': d.revenue,
    }));
  }, [data?.revenueByPeriod]);

  return (
    <div className="space-y-6">
      {/* 4 KPIs Commandes */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-[#5DBEBB]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-[#5DBEBB]" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Commandes</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-20" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#5DBEBB]">
                {data?.totalOrders ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">sur la période</p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-[#3976BB]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-[#3976BB]" />
            </div>
            <span className="text-sm text-gray-600 font-medium">CA HT</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#3976BB]">
                {formatCurrency(data?.totalRevenueHT ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                chiffre d&apos;affaires hors taxes
              </p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Panier moyen
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-24" />
          ) : (
            <>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(data?.averageBasket ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">par commande</p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Conversion
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercentage(data?.conversionRate ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(data?.totalViews ?? 0).toLocaleString('fr-FR')} vues
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
              <p className="text-gray-500">Aucune donnée pour cette période</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

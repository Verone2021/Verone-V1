/**
 * CommissionsChart
 * Graphique d'évolution des commissions
 *
 * @module CommissionsChart
 * @since 2025-12-10
 */

'use client';

import { Card, AreaChart } from '@tremor/react';
import { TrendingUp } from 'lucide-react';

import type { RevenueDataPoint } from '../../types/analytics';
import { formatCurrency } from '../../types/analytics';

interface CommissionsChartProps {
  data: RevenueDataPoint[];
  isLoading?: boolean;
}

export function CommissionsChart({ data, isLoading }: CommissionsChartProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  // Transformer les données pour Tremor
  const chartData = data.map(point => ({
    date: point.label,
    "Chiffre d'affaires": point.revenue,
    Commandes: point.orders,
  }));

  // Si pas de données
  if (chartData.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Évolution du chiffre d&apos;affaires
          </h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Pas de données pour cette période
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Évolution du chiffre d&apos;affaires
          </h3>
        </div>
        <span className="text-xs text-gray-500">{chartData.length} points</span>
      </div>

      <AreaChart
        data={chartData}
        index="date"
        categories={["Chiffre d'affaires"]}
        colors={['blue']}
        valueFormatter={value => formatCurrency(value)}
        className="h-48"
        showAnimation
        showLegend={false}
        showGradient
        curveType="monotone"
      />
    </Card>
  );
}

export default CommissionsChart;

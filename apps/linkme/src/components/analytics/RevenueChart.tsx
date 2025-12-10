/**
 * RevenueChart
 * Graphique d'évolution du CA avec Tremor AreaChart
 *
 * Design premium avec gradient cyan/indigo
 */

'use client';

import { Card, AreaChart, TabGroup, TabList, Tab } from '@tremor/react';
import { TrendingUp } from 'lucide-react';

import type { RevenueDataPoint, AnalyticsPeriod } from '../../types/analytics';
import { formatCurrency, PERIOD_LABELS } from '../../types/analytics';

interface RevenueChartProps {
  data: RevenueDataPoint[] | undefined;
  period: AnalyticsPeriod;
  onPeriodChange?: (period: AnalyticsPeriod) => void;
  isLoading?: boolean;
}

export function RevenueChart({
  data,
  period,
  onPeriodChange,
  isLoading,
}: RevenueChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  // Transformer les données pour Tremor
  const chartData = (data || []).map(d => ({
    date: d.label,
    "Chiffre d'affaires": d.revenue,
    Commandes: d.orders,
  }));

  // Calculer le total
  const totalRevenue = (data || []).reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = (data || []).reduce((sum, d) => sum + d.orders, 0);

  const periods: AnalyticsPeriod[] = ['week', 'month', 'quarter', 'year'];
  const currentPeriodIndex = periods.indexOf(period);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution du CA
            </h3>
            <p className="text-sm text-gray-500">
              {formatCurrency(totalRevenue)} sur {totalOrders} commandes
            </p>
          </div>
        </div>

        {onPeriodChange && (
          <TabGroup
            index={currentPeriodIndex}
            onIndexChange={index => onPeriodChange(periods[index])}
          >
            <TabList variant="solid" className="bg-gray-100">
              {periods.map(p => (
                <Tab key={p} className="text-sm">
                  {PERIOD_LABELS[p]}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        )}
      </div>

      {chartData.length > 0 ? (
        <AreaChart
          data={chartData}
          index="date"
          categories={["Chiffre d'affaires"]}
          colors={['cyan']}
          valueFormatter={value => formatCurrency(value)}
          showLegend={false}
          showGridLines
          showAnimation
          className="h-64"
          curveType="monotone"
          yAxisWidth={80}
          customTooltip={({ payload, active }) => {
            if (!active || !payload || payload.length === 0) return null;
            const data = payload[0].payload;
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <p className="text-sm font-medium text-gray-900">{data.date}</p>
                <p className="text-sm text-cyan-600">
                  CA: {formatCurrency(data["Chiffre d'affaires"])}
                </p>
                <p className="text-sm text-gray-500">
                  {data.Commandes} commande{data.Commandes > 1 ? 's' : ''}
                </p>
              </div>
            );
          }}
        />
      ) : (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Aucune donnée pour cette période</p>
            <p className="text-sm text-gray-400">Les ventes apparaîtront ici</p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default RevenueChart;

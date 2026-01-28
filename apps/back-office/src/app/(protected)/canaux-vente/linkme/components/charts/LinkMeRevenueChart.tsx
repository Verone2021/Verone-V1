/**
 * LinkMe Revenue Chart - Évolution du CA
 *
 * LineChart Recharts affichant l'évolution du CA LinkMe
 * Design Vérone : Noir #000, tooltip formatté €, grid gris élégant
 */

'use client';

import { TrendingUp } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

import type {
  RevenueDataPoint,
  AnalyticsPeriod,
} from '../../hooks/use-linkme-analytics';

interface LinkMeRevenueChartProps {
  data: RevenueDataPoint[];
  period: AnalyticsPeriod;
  isLoading?: boolean;
}

// Custom Tooltip avec formatage €
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RevenueDataPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const revenue = payload[0].value || 0;
  const dataPoint = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600 mb-1">{dataPoint.date}</p>
      <p className="text-base font-semibold text-black">
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(revenue)}
      </p>
    </div>
  );
}

export function LinkMeRevenueChart({
  data,
  period,
  isLoading = false,
}: LinkMeRevenueChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <div className="text-sm text-gray-400">Chargement des données...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <TrendingUp className="h-10 w-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">
          Aucune donnée pour cette période
        </p>
      </div>
    );
  }

  // Déterminer le label de l'axe X selon la période
  const _getXAxisLabel = () => {
    switch (period) {
      case 'week':
        return 'Jour';
      case 'month':
        return 'Jour';
      case 'quarter':
        return 'Semaine';
      case 'year':
        return 'Mois';
    }
  };

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#000000" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#000000" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
            axisLine={{ stroke: '#E5E5E5' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
            axisLine={{ stroke: '#E5E5E5' }}
            tickFormatter={value =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k€` : `${value}€`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#000000"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            dot={{ fill: '#000000', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#000000' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

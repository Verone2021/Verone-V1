/**
 * Top Affiliates Chart - Classement des meilleurs affiliés
 *
 * BarChart horizontal Recharts affichant le top 10 des affiliés par CA
 * Design Vérone : Barres noires, tooltip détaillé
 */

'use client';

import { Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import type { TopAffiliateData } from '../../hooks/use-linkme-analytics';

interface TopAffiliatesChartProps {
  data: TopAffiliateData[];
  isLoading?: boolean;
}

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TopAffiliateData }>;
}) {
  if (!active || !payload?.length) return null;

  const affiliate = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-sm font-semibold text-black mb-2">{affiliate.name}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">CA:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            }).format(affiliate.revenue)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Commandes:</span>
          <span className="font-medium">{affiliate.orders}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Commissions:</span>
          <span className="font-medium text-green-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
            }).format(affiliate.commissions)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopAffiliatesChart({
  data,
  isLoading = false,
}: TopAffiliatesChartProps) {
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
        <Users className="h-10 w-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">
          Aucun affilié pour cette période
        </p>
      </div>
    );
  }

  // Tronquer les noms trop longs
  const chartData = data.map(d => ({
    ...d,
    shortName: d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name,
  }));

  // Couleurs dégradées du noir au gris
  const getBarColor = (index: number) => {
    const opacity = 1 - index * 0.08;
    return `rgba(0, 0, 0, ${Math.max(opacity, 0.3)})`;
  };

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E5E5E5"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
            axisLine={{ stroke: '#E5E5E5' }}
            tickFormatter={value =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k€` : `${value}€`
            }
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 11, fill: '#333333' }}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

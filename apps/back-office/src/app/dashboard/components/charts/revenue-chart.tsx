'use client';

/**
 * Graphique: CA 30 jours
 * Evolution du chiffre d'affaires sur les 30 derniers jours
 *
 * @created 2026-01-12
 * @updated 2026-01-12 - Implementee avec Recharts + useDashboardAnalytics
 */

import { useDashboardAnalytics } from '@verone/dashboard/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { BarChart3, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { CHART_CATALOG } from '../../lib/chart-catalog';

const chart = CHART_CATALOG.revenue_30d;

interface RevenueChartProps {
  onRemove?: () => void;
}

// Custom Tooltip avec formatage EUR
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { date: string; revenue: number };
  }>;
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
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(revenue)}
      </p>
    </div>
  );
}

export function RevenueChart({ onRemove }: RevenueChartProps) {
  const { analytics, isLoading, error } = useDashboardAnalytics();

  const data = analytics?.revenue || [];

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="w-full h-[200px] flex items-center justify-center bg-muted/20 rounded-lg animate-pulse">
            <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {error || 'Aucune donnee pour cette periode'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={{ stroke: '#E5E5E5' }}
                axisLine={{ stroke: '#E5E5E5' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={{ stroke: '#E5E5E5' }}
                axisLine={{ stroke: '#E5E5E5' }}
                tickFormatter={value =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                }
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#000000"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={false}
                activeDot={{ r: 4, fill: '#000000' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

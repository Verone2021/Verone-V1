'use client';

/**
 * Graphique: Tresorerie 12 mois
 * Evolution de la tresorerie sur 12 mois (entrees/sorties/balance)
 *
 * @created 2026-01-12
 * @updated 2026-01-12 - Implementee avec Recharts + useCashFlowForecast
 */

import { useCashFlowForecast } from '@verone/dashboard/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Wallet, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { CHART_CATALOG } from '../../lib/chart-catalog';

const chart = CHART_CATALOG.treasury_12m;

interface TreasuryChartProps {
  onRemove?: () => void;
}

// Custom Tooltip avec formatage EUR
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-800 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TreasuryChart({ onRemove }: TreasuryChartProps) {
  const { forecast, isLoading, error } = useCashFlowForecast();

  const data = forecast?.data || [];

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Wallet className="h-4 w-4 text-muted-foreground" />
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
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground/50 mb-2" />
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
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="month"
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
              <Legend
                verticalAlign="top"
                height={30}
                iconType="line"
                formatter={(value: string) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="incoming"
                name="Entrees"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#16a34a' }}
              />
              <Line
                type="monotone"
                dataKey="outgoing"
                name="Sorties"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#dc2626' }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name="Solde cumule"
                stroke="#000000"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: '#000000' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

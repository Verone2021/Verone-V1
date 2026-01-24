'use client';

/**
 * Graphique: Repartition par canal
 * CA par canal de vente (Site, LinkMe, B2B) en donut
 *
 * @created 2026-01-12
 * @updated 2026-01-12 - Implemente avec Recharts PieChart
 */

import { useEffect, useState } from 'react';

import { useCompleteDashboardMetrics } from '@verone/dashboard/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { PieChart, RefreshCw } from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_LABEL = 'Repartition par canal';

interface ChannelPieChartProps {
  onRemove?: () => void;
}

interface ChannelData {
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

const COLORS = ['#000000', '#3b82f6', '#10b981', '#f59e0b'];

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: ChannelData }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="text-sm font-medium">{data.name}</span>
      </div>
      <p className="text-base font-semibold">{formatCurrency(data.value)}</p>
    </div>
  );
}

export function ChannelPieChart({ onRemove }: ChannelPieChartProps) {
  const { metrics, isLoading } = useCompleteDashboardMetrics();
  const [data, setData] = useState<ChannelData[]>([]);

  useEffect(() => {
    if (metrics) {
      // Construire les donnees par canal
      const channelData: ChannelData[] = [
        {
          name: 'B2B Direct',
          value: metrics.orders.monthRevenue - (metrics.linkme.revenue || 0),
          color: COLORS[0],
        },
        {
          name: 'LinkMe',
          value: metrics.linkme.revenue || 0,
          color: COLORS[1],
        },
      ].filter(d => d.value > 0);

      setData(channelData);
    }
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{CHART_LABEL}</CardTitle>
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

  if (data.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{CHART_LABEL}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PieChart className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune donnee</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{CHART_LABEL}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string, entry: any) => {
                  const item = data.find(d => d.name === value);
                  const percentage = item
                    ? ((item.value / total) * 100).toFixed(0)
                    : 0;
                  return (
                    <span className="text-xs text-gray-600">
                      {value} ({percentage}%)
                    </span>
                  );
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

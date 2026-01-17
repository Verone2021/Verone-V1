'use client';

/**
 * Graphique: Vieillissement stock
 * Répartition des produits par ancienneté (0-30j, 31-60j, 61-90j, 91-180j, 180+j)
 *
 * @created 2026-01-12
 * @updated 2026-01-12 - Implémenté avec Recharts BarChart + useAgingReport
 */

import { useEffect } from 'react';

import { useAgingReport } from '@verone/finance/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Clock, RefreshCw } from 'lucide-react';
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

import { CHART_CATALOG } from '../../lib/chart-catalog';

const chart = CHART_CATALOG.aging_report;

interface AgingReportChartProps {
  onRemove?: () => void;
}

// Couleurs par tranche (du vert au rouge)
const BUCKET_COLORS: Record<string, string> = {
  '0-30': '#16a34a', // vert
  '31-60': '#3b82f6', // bleu
  '61-90': '#eab308', // jaune
  '91-180': '#f97316', // orange
  '180+': '#dc2626', // rouge
};

interface ChartData {
  bucket_id: string;
  label: string;
  value: number;
  percentage: number;
  count: number;
}

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartData }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
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
          style={{ backgroundColor: BUCKET_COLORS[data.bucket_id] }}
        />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      <p className="text-base font-semibold">{formatCurrency(data.value)}</p>
      <p className="text-xs text-gray-500">
        {data.count} produits ({data.percentage.toFixed(0)}% de la valeur)
      </p>
    </div>
  );
}

export function AgingReportChart({ onRemove }: AgingReportChartProps) {
  const { report, loading, generateReport } = useAgingReport();

  // Charger le rapport au montage
  useEffect(() => {
    generateReport();
  }, [generateReport]);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
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

  if (!report || report.buckets.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune donnee</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transformer les données pour le graphique
  const chartData: ChartData[] = report.buckets.map(b => ({
    bucket_id: b.bucket_id,
    label: b.label,
    value: b.value,
    percentage: b.percentage,
    count: b.count,
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
        </div>
        <div className="text-xs text-muted-foreground">
          Moy. {report.summary.average_age_days}j
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#666666' }}
                tickLine={{ stroke: '#E5E5E5' }}
                axisLine={{ stroke: '#E5E5E5' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={40}
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BUCKET_COLORS[entry.bucket_id] || '#9ca3af'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

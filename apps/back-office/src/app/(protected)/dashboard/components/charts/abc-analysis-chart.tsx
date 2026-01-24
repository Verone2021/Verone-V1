'use client';

/**
 * Graphique: Classification ABC
 * Répartition valeur stock (A: 80%, B: 15%, C: 5%)
 *
 * @created 2026-01-12
 * @updated 2026-01-12 - Implémenté avec Recharts BarChart + useABCAnalysis
 */

import { useEffect } from 'react';

import { useABCAnalysis } from '@verone/finance/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { BarChart3, RefreshCw } from 'lucide-react';
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

const CHART_LABEL = 'Classification ABC';

interface ABCAnalysisChartProps {
  onRemove?: () => void;
}

// Couleurs pour les classes ABC
const CLASS_COLORS: Record<string, string> = {
  A: '#16a34a', // vert
  B: '#3b82f6', // bleu
  C: '#9ca3af', // gris
};

interface ChartData {
  class_id: string;
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
          style={{ backgroundColor: CLASS_COLORS[data.class_id] }}
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

export function ABCAnalysisChart({ onRemove }: ABCAnalysisChartProps) {
  const { report, loading, generateReport } = useABCAnalysis();

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
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
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

  if (!report || report.classes.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-medium">{CHART_LABEL}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune donnee</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transformer les données pour le graphique
  const chartData: ChartData[] = report.classes.map(c => ({
    class_id: c.class_id,
    label: c.label,
    value: c.value,
    percentage: c.percentage,
    count: c.count,
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{CHART_LABEL}</CardTitle>
        </div>
        <div className="text-xs text-muted-foreground">
          {report.summary.total_products} produits
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={{ stroke: '#E5E5E5' }}
                axisLine={{ stroke: '#E5E5E5' }}
                tickFormatter={value =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                }
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={{ stroke: '#E5E5E5' }}
                axisLine={{ stroke: '#E5E5E5' }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CLASS_COLORS[entry.class_id] || '#9ca3af'}
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

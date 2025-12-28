'use client';

/**
 * MonthlyFlowChart - Entrées et sorties mensuelles
 * Design: BarChart avec barres vertes (entrées) et rouges (sorties)
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { TreasuryEvolution } from '../../hooks/use-treasury-stats';

interface MonthlyFlowChartProps {
  data: TreasuryEvolution[];
  isLoading?: boolean;
}

// Formateur de montant en K€
function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`;
  }
  return `${value.toFixed(0)}€`;
}

// Formateur de date (YYYY-MM → Jan, Fév, etc.)
function formatMonth(dateStr: string): string {
  const months = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];
  const month = parseInt(dateStr.split('-')[1], 10) - 1;
  return months[month] || dateStr;
}

// Tooltip personnalisé
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-600">{entry.name}:</span>
          <span className="text-sm font-bold text-slate-900">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Légende personnalisée
function CustomLegend() {
  return (
    <div className="mt-2 flex items-center justify-center gap-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-sm bg-green-500" />
        <span className="text-sm text-slate-600">Entrées</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-sm bg-red-500" />
        <span className="text-sm text-slate-600">Sorties</span>
      </div>
    </div>
  );
}

export function MonthlyFlowChart({ data, isLoading }: MonthlyFlowChartProps) {
  // Prendre les 6 derniers mois
  const chartData = data.slice(-6).map(item => ({
    month: formatMonth(item.date),
    inbound: item.inbound,
    outbound: item.outbound,
    fullDate: item.date,
  }));

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-1 h-4 w-28 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Entrées / Sorties Mensuelles
        </h3>
        <p className="text-sm text-slate-500">6 derniers mois</p>
        <div className="mt-4 flex h-64 items-center justify-center text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        Entrées / Sorties Mensuelles
      </h3>
      <p className="text-sm text-slate-500">6 derniers mois</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="inbound"
              name="Entrées"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="outbound"
              name="Sorties"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

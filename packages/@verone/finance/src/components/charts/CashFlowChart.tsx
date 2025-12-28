'use client';

/**
 * CashFlowChart - Évolution de la trésorerie sur 12 mois
 * Design: AreaChart minimaliste avec gradient bleu
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { TreasuryEvolution } from '../../hooks/use-treasury-stats';

interface CashFlowChartProps {
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
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(payload[0].value)}
      </p>
    </div>
  );
}

export function CashFlowChart({ data, isLoading }: CashFlowChartProps) {
  // Transformer les données pour le graphique
  const chartData = data.map(item => ({
    month: formatMonth(item.date),
    balance: item.balance,
    fullDate: item.date,
  }));

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-1 h-4 w-24 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Évolution Trésorerie
        </h3>
        <p className="text-sm text-slate-500">12 derniers mois</p>
        <div className="mt-4 flex h-64 items-center justify-center text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">
        Évolution Trésorerie
      </h3>
      <p className="text-sm text-slate-500">12 derniers mois</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              fill="url(#balanceGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#3b82f6',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

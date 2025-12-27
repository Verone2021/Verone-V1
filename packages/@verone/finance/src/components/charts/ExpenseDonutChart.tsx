'use client';

/**
 * ExpenseDonutChart - Répartition des dépenses par catégorie
 * Design: Donut chart minimaliste avec légende intégrée
 */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { ExpenseBreakdown } from '../../hooks/use-treasury-stats';

interface ExpenseDonutChartProps {
  data: ExpenseBreakdown[];
  isLoading?: boolean;
  selectedYear?: number | null;
  availableYears?: number[];
  onYearChange?: (year: number | null) => void;
}

// Type local pour Recharts avec index signature
interface ChartDataItem {
  category_name: string;
  category_code: string;
  total_amount: number;
  count: number;
  percentage: number;
  [key: string]: string | number;
}

// Palette de couleurs pour les catégories
const CATEGORY_COLORS: Record<string, string> = {
  bank_fees: '#6366f1', // indigo
  subscription: '#3b82f6', // blue
  supplies: '#22c55e', // green
  transport: '#f59e0b', // amber
  marketing: '#ec4899', // pink
  taxes: '#8b5cf6', // violet
  insurance: '#14b8a6', // teal
  professional_services: '#f97316', // orange
  software: '#06b6d4', // cyan
  telecom: '#10b981', // emerald
  rent: '#a855f7', // purple
  purchase_stock: '#eab308', // yellow
  other: '#64748b', // slate
  _aggregated_other: '#64748b', // slate (pour les catégories regroupées)
};

// Couleurs par défaut si catégorie inconnue
const DEFAULT_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
];

function getColor(categoryCode: string, index: number): string {
  return (
    CATEGORY_COLORS[categoryCode] ||
    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  );
}

// Formateur de montant
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

// Tooltip personnalisé
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      category_name: string;
      total_amount: number;
      percentage: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  // Nettoie le nom de catégorie pour le tooltip aussi
  const cleanName = data.category_name.replace(/^Compte\s+/i, '');
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-slate-900">{cleanName}</p>
      <p className="text-lg font-bold text-slate-900">
        {formatCurrency(data.total_amount)}
      </p>
      <p className="text-xs text-slate-500">{data.percentage.toFixed(1)}%</p>
    </div>
  );
}

// Nettoie le nom de catégorie (enlève "Compte " au début)
function cleanCategoryName(name: string): string {
  return name.replace(/^Compte\s+/i, '');
}

export function ExpenseDonutChart({
  data,
  isLoading,
  selectedYear,
  availableYears,
  onYearChange,
}: ExpenseDonutChartProps) {
  // Trier par montant décroissant et prendre les top 6 + "Autres"
  const sortedData = [...data].sort((a, b) => b.total_amount - a.total_amount);
  const topCategories: ChartDataItem[] = sortedData.slice(0, 6).map(item => ({
    ...item,
  }));
  const otherCategories = sortedData.slice(6);

  const chartData: ChartDataItem[] =
    otherCategories.length > 0
      ? [
          ...topCategories,
          {
            category_name: 'Autres',
            category_code: '_aggregated_other',
            total_amount: otherCategories.reduce(
              (sum, c) => sum + c.total_amount,
              0
            ),
            count: otherCategories.reduce((sum, c) => sum + c.count, 0),
            percentage: otherCategories.reduce(
              (sum, c) => sum + c.percentage,
              0
            ),
          },
        ]
      : topCategories;

  const totalAmount = chartData.reduce(
    (sum, item) => sum + item.total_amount,
    0
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-1 h-4 w-20 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex items-center justify-center">
          <div className="h-48 w-48 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Dépenses par Catégorie
        </h3>
        <p className="text-sm text-slate-500">Ce mois</p>
        <div className="mt-4 flex h-48 items-center justify-center text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Dépenses par Catégorie
          </h3>
          <p className="text-sm text-slate-500">
            {selectedYear ? `Année ${selectedYear}` : 'Toutes les données'}
          </p>
        </div>
        {onYearChange && availableYears && availableYears.length > 0 && (
          <select
            value={selectedYear ?? ''}
            onChange={e =>
              onYearChange(e.target.value ? parseInt(e.target.value) : null)
            }
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">Toutes</option>
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative h-48 w-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="total_amount"
                nameKey="category_name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.category_code}
                    fill={getColor(entry.category_code, index)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centre du donut */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex-1 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.category_code}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: getColor(item.category_code, index),
                  }}
                />
                <span
                  className="text-slate-600 truncate max-w-[120px]"
                  title={item.category_name}
                >
                  {cleanCategoryName(item.category_name)}
                </span>
              </div>
              <span className="font-medium text-slate-900 whitespace-nowrap ml-2">
                {formatCurrency(item.total_amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

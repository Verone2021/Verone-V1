'use client';

/**
 * ProductStatsCharts - Section graphiques pour les statistiques produits
 *
 * 2 graphiques côte à côte (desktop) :
 * 1. DonutChart - Répartition du CA HT par source produit (Recharts PieChart)
 * 2. Top 5 produits par quantité vendue (barres horizontales CSS)
 *
 * 100% orienté produit. Zero commission.
 *
 * @module ProductStatsCharts
 * @since 2026-02-10
 * @updated 2026-02-10 - DonutChart CA par source + Top 5 quantité
 */

import { useMemo } from 'react';

import { Card } from '@tremor/react';
import { PieChart as PieChartIcon, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import type { ProductStatsData } from '@/lib/hooks/use-all-products-stats';

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)} %`;
}

// Couleurs par source produit
const SOURCE_COLORS: Record<string, string> = {
  catalogue: '#5DBEBB', // teal
  'mes-produits': '#8B5CF6', // violet
  'sur-mesure': '#F59E0B', // amber
};

const SOURCE_LABELS: Record<string, string> = {
  catalogue: 'Catalogue',
  'mes-produits': 'Mes produits',
  'sur-mesure': 'Sur-mesure',
};

// ============================================
// TYPES
// ============================================

interface ProductStatsChartsProps {
  products: ProductStatsData[];
  isLoading?: boolean;
}

interface SourceData {
  [key: string]: string | number;
  name: string;
  value: number;
  color: string;
  source: string;
}

// ============================================
// COMPONENT
// ============================================

export function ProductStatsCharts({
  products,
  isLoading = false,
}: ProductStatsChartsProps): JSX.Element {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return <></>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DonutChartBySource products={products} />
      <Top5ProductsByQuantity products={products} />
    </div>
  );
}

// ============================================
// SUB-COMPONENT: Donut Chart CA HT par source
// ============================================

function DonutChartBySource({
  products,
}: {
  products: ProductStatsData[];
}): JSX.Element {
  const { chartData, totalCA } = useMemo(() => {
    const bySource: Record<string, number> = {};

    products.forEach(p => {
      bySource[p.productSource] =
        (bySource[p.productSource] ?? 0) + p.revenueHT;
    });

    const total = Object.values(bySource).reduce((s, v) => s + v, 0);

    const data: SourceData[] = Object.entries(bySource)
      .filter(([, value]) => value > 0)
      .map(([source, value]) => ({
        name: SOURCE_LABELS[source] ?? source,
        value,
        color: SOURCE_COLORS[source] ?? '#94A3B8',
        source,
      }))
      .sort((a, b) => b.value - a.value);

    return { chartData: data, totalCA: total };
  }, [products]);

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <PieChartIcon className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Répartition CA par source
            </h3>
          </div>
        </div>
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Aucune donnée disponible</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-teal-100 rounded-lg">
          <PieChartIcon className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Répartition CA par source
          </h3>
          <p className="text-xs text-gray-500">
            {formatCurrency(totalCA)} CA HT total
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centre du donut : total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-bold text-[#183559]">
                {formatCurrency(totalCA)}
              </p>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex-1 space-y-3">
          {chartData.map(entry => {
            const percentage = totalCA > 0 ? (entry.value / totalCA) * 100 : 0;
            return (
              <div key={entry.source} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{entry.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(entry.value)} · {formatPercent(percentage)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// SUB-COMPONENT: Top 5 produits par quantité
// ============================================

function Top5ProductsByQuantity({
  products,
}: {
  products: ProductStatsData[];
}): JSX.Element {
  const top5 = useMemo(() => {
    return [...products]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);
  }, [products]);

  const maxQuantity = useMemo(() => {
    if (top5.length === 0) return 0;
    return top5[0].quantitySold;
  }, [top5]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Top 5 Produits
          </h3>
          <p className="text-xs text-gray-500">Par quantité vendue</p>
        </div>
      </div>

      {top5.length === 0 ? (
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {top5.map((product, index) => {
            const percentage =
              maxQuantity > 0 ? (product.quantitySold / maxQuantity) * 100 : 0;

            return (
              <div key={product.productId} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate">
                      {product.productName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-sm font-semibold text-[#3976BB]">
                      {product.quantitySold.toLocaleString('fr-FR')} u.
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(product.revenueHT)}
                    </span>
                  </div>
                </div>
                <div className="ml-7 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7E84C0] to-[#3976BB] transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

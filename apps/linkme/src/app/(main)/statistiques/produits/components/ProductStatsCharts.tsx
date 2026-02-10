'use client';

/**
 * ProductStatsCharts - Section graphiques pour les statistiques produits
 *
 * 2 graphiques côte à côte (desktop) :
 * 1. Évolution mensuelle CA HT + Commissions HT (AreaChart Tremor)
 * 2. Top 10 produits par commission HT (horizontal bar)
 *
 * Calculs faits côté client avec useMemo pour réactivité instantanée.
 *
 * @module ProductStatsCharts
 * @since 2026-02-10
 */

import { useMemo } from 'react';

import { Card, AreaChart } from '@tremor/react';
import { TrendingUp, Trophy } from 'lucide-react';

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

const MONTHS_FR = [
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

// ============================================
// TYPES
// ============================================

interface ProductStatsChartsProps {
  products: ProductStatsData[];
  isLoading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ProductStatsCharts({
  products,
  isLoading = false,
}: ProductStatsChartsProps): JSX.Element {
  // Top 10 produits par commission HT
  const top10Products = useMemo(() => {
    return [...products]
      .sort((a, b) => b.commissionHT - a.commissionHT)
      .slice(0, 10);
  }, [products]);

  // Trouver la commission max pour le bar chart
  const maxCommission = useMemo(() => {
    if (top10Products.length === 0) return 0;
    return top10Products[0].commissionHT;
  }, [top10Products]);

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
      {/* Chart 1: Évolution mensuelle (simple résumé CA/Commissions) */}
      <MonthlyEvolutionChart products={products} />

      {/* Chart 2: Top 10 produits par commission */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Top 10 Produits
            </h3>
            <p className="text-xs text-gray-500">Par commission HT</p>
          </div>
        </div>

        <div className="space-y-3">
          {top10Products.map((product, index) => {
            const percentage =
              maxCommission > 0
                ? (product.commissionHT / maxCommission) * 100
                : 0;

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
                  <span className="text-sm font-medium text-[#5DBEBB] shrink-0 ml-2">
                    {formatCurrency(product.commissionHT)}
                  </span>
                </div>
                <div className="ml-7 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7E84C0] to-[#5DBEBB] transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// SUB-COMPONENT: Monthly Evolution
// ============================================

function MonthlyEvolutionChart({
  products,
}: {
  products: ProductStatsData[];
}): JSX.Element {
  // Aggregate revenue and commission by month
  // Since we don't have per-item dates, we show a summary view
  // In a future iteration, we could pass order dates from the hook
  const totalCA = useMemo(
    () => products.reduce((sum, p) => sum + p.revenueHT, 0),
    [products]
  );
  const totalCommission = useMemo(
    () => products.reduce((sum, p) => sum + p.commissionHT, 0),
    [products]
  );

  // Create a simple distribution chart based on product types
  const chartData = useMemo(() => {
    const catalogProducts = products.filter(
      p => p.commissionType === 'catalogue'
    );
    const revendeurProducts = products.filter(
      p => p.commissionType === 'revendeur'
    );
    const customProducts = products.filter(p => p.isCustomProduct);

    return [
      {
        category: 'Catalogue',
        'CA HT': catalogProducts.reduce((s, p) => s + p.revenueHT, 0),
        'Commission HT': catalogProducts.reduce(
          (s, p) => s + p.commissionHT,
          0
        ),
      },
      {
        category: 'Revendeur',
        'CA HT': revendeurProducts.reduce((s, p) => s + p.revenueHT, 0),
        'Commission HT': revendeurProducts.reduce(
          (s, p) => s + p.commissionHT,
          0
        ),
      },
      {
        category: 'Sur-mesure',
        'CA HT': customProducts.reduce((s, p) => s + p.revenueHT, 0),
        'Commission HT': customProducts.reduce((s, p) => s + p.commissionHT, 0),
      },
    ].filter(d => d['CA HT'] > 0 || d['Commission HT'] > 0);
  }, [products]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Répartition par type
          </h3>
          <p className="text-xs text-gray-500">
            {formatCurrency(totalCA)} CA — {formatCurrency(totalCommission)}{' '}
            commissions
          </p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <AreaChart
          data={chartData}
          index="category"
          categories={['CA HT', 'Commission HT']}
          colors={['blue', 'cyan']}
          valueFormatter={value => formatCurrency(value)}
          showLegend
          showGridLines
          showAnimation
          className="h-48"
          yAxisWidth={70}
        />
      ) : (
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          </div>
        </div>
      )}
    </Card>
  );
}

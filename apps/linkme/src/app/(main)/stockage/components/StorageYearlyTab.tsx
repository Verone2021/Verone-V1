'use client';

/**
 * StorageYearlyTab — Onglet Historique annuel du stockage
 *
 * Comparaison année par année : volumes moyens, coûts totaux, évolution
 *
 * @module StorageYearlyTab
 * @since 2026-02-25
 */

import { useMemo } from 'react';

import { Card, BarChart } from '@tremor/react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

import type {
  StorageMonthlyRow,
  StoragePricingTier,
} from '@/lib/hooks/use-affiliate-storage';
import {
  formatVolume,
  formatPrice,
  calculateStoragePrice,
} from '@/lib/hooks/use-affiliate-storage';

interface StorageYearlyTabProps {
  monthlyData: StorageMonthlyRow[] | undefined;
  pricingTiers: StoragePricingTier[] | undefined;
  isLoading: boolean;
}

interface YearlySummary {
  year: number;
  avgUnitsPerMonth: number;
  avgProductsPerMonth: number;
  avgVolumePerMonth: number;
  totalCost: number;
  avgCostPerMonth: number;
  monthsCount: number;
  isYTD: boolean;
  evolutionPct: number | null;
}

export function StorageYearlyTab({
  monthlyData,
  pricingTiers,
  isLoading,
}: StorageYearlyTabProps) {
  const currentYear = new Date().getFullYear();

  // Agrégation par année
  const yearlySummaries = useMemo((): YearlySummary[] => {
    if (!monthlyData || !pricingTiers) return [];

    const byYear = new Map<number, StorageMonthlyRow[]>();
    for (const row of monthlyData) {
      const existing = byYear.get(row.year_val) ?? [];
      existing.push(row);
      byYear.set(row.year_val, existing);
    }

    const summaries: YearlySummary[] = [];
    const sortedYears = [...byYear.keys()].sort();

    for (let i = 0; i < sortedYears.length; i++) {
      const year = sortedYears[i];
      const rows = byYear.get(year) ?? [];
      const monthsCount = rows.length;
      if (monthsCount === 0) continue;

      const totalUnits = rows.reduce((s, r) => s + r.total_units, 0);
      const totalProducts = rows.reduce((s, r) => s + r.products_count, 0);
      const totalVolume = rows.reduce((s, r) => s + r.total_volume_m3, 0);
      const totalCost = rows.reduce(
        (s, r) => s + calculateStoragePrice(r.billable_volume_m3, pricingTiers),
        0
      );

      const avgCostPerMonth = totalCost / monthsCount;

      // Évolution par rapport à l'année précédente
      let evolutionPct: number | null = null;
      if (i > 0) {
        const prevYear = sortedYears[i - 1];
        const prevRows = byYear.get(prevYear) ?? [];
        const prevTotalCost = prevRows.reduce(
          (s, r) =>
            s + calculateStoragePrice(r.billable_volume_m3, pricingTiers),
          0
        );
        const prevAvgCost = prevTotalCost / prevRows.length;
        if (prevAvgCost > 0) {
          evolutionPct = ((avgCostPerMonth - prevAvgCost) / prevAvgCost) * 100;
        }
      }

      summaries.push({
        year,
        avgUnitsPerMonth: Math.round(totalUnits / monthsCount),
        avgProductsPerMonth: Math.round(totalProducts / monthsCount),
        avgVolumePerMonth: totalVolume / monthsCount,
        totalCost,
        avgCostPerMonth,
        monthsCount,
        isYTD: year === currentYear,
        evolutionPct,
      });
    }

    return summaries;
  }, [monthlyData, pricingTiers, currentYear]);

  // Données graphique
  const chartData = useMemo(() => {
    return yearlySummaries.map(s => ({
      année: s.isYTD ? `${s.year} (YTD)` : `${s.year}`,
      'Coût moyen/mois': Math.round(s.avgCostPerMonth * 100) / 100,
      'Unités moy./mois': s.avgUnitsPerMonth,
    }));
  }, [yearlySummaries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  if (yearlySummaries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500">Aucune donnée historique disponible</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique comparatif */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparaison annuelle
        </h3>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            index="année"
            categories={['Coût moyen/mois', 'Unités moy./mois']}
            colors={['cyan', 'violet']}
            showLegend
            showGridLines
            showAnimation
            className="h-56"
            yAxisWidth={80}
          />
        ) : (
          <div className="h-56 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Pas assez de données</p>
          </div>
        )}
      </Card>

      {/* Table récapitulative */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">
            Récapitulatif par année
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Année</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Mois
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Unités moy./mois
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Vol. moy./mois
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Coût total
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Coût moy./mois
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Évolution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {yearlySummaries.map(s => (
                <tr key={s.year} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.year}
                    {s.isYTD && (
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">
                        (YTD)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {s.monthsCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {s.avgUnitsPerMonth}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatVolume(s.avgVolumePerMonth)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatPrice(s.totalCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#5DBEBB]">
                    {formatPrice(s.avgCostPerMonth)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.evolutionPct !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          s.evolutionPct > 0
                            ? 'text-red-600'
                            : s.evolutionPct < 0
                              ? 'text-green-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {s.evolutionPct > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : s.evolutionPct < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                        {s.evolutionPct > 0 ? '+' : ''}
                        {s.evolutionPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

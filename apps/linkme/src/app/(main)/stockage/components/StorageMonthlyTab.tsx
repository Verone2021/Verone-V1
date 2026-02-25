'use client';

/**
 * StorageMonthlyTab — Onglet Historique mensuel du stockage
 *
 * Graphique combo (barres unités + ligne produits) + table détaillée par mois
 *
 * @module StorageMonthlyTab
 * @since 2026-02-25
 */

import { useState, useMemo } from 'react';

import { Card, BarChart } from '@tremor/react';
import { CalendarDays, RefreshCw } from 'lucide-react';

import type {
  StorageMonthlyRow,
  StoragePricingTier,
} from '@/lib/hooks/use-affiliate-storage';
import {
  formatMonthLabel,
  formatVolume,
  formatPrice,
  calculateStoragePrice,
} from '@/lib/hooks/use-affiliate-storage';

interface StorageMonthlyTabProps {
  monthlyData: StorageMonthlyRow[] | undefined;
  pricingTiers: StoragePricingTier[] | undefined;
  isLoading: boolean;
}

export function StorageMonthlyTab({
  monthlyData,
  pricingTiers,
  isLoading,
}: StorageMonthlyTabProps) {
  // Années disponibles dans les données
  const availableYears = useMemo(() => {
    if (!monthlyData) return [];
    const years = [...new Set(monthlyData.map(d => d.year_val))];
    return years.sort((a, b) => b - a);
  }, [monthlyData]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear =
    selectedYear ?? availableYears[0] ?? new Date().getFullYear();

  // Filtrer données par année sélectionnée
  const filteredData = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.filter(d => d.year_val === activeYear);
  }, [monthlyData, activeYear]);

  // Données pour le graphique
  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      mois: formatMonthLabel(d.month_val, d.year_val),
      'Unités stockées': d.total_units,
      Produits: d.products_count,
    }));
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur d'année */}
      <div className="flex items-center gap-3">
        <CalendarDays className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600">Année :</span>
        <div className="flex gap-2">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeYear === year
                  ? 'bg-[#5DBEBB] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique barres */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Évolution du stockage — {activeYear}
        </h3>
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            index="mois"
            categories={['Unités stockées', 'Produits']}
            colors={['cyan', 'violet']}
            showLegend
            showGridLines
            showAnimation
            className="h-64"
            yAxisWidth={60}
          />
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucune donnée pour {activeYear}</p>
          </div>
        )}
      </Card>

      {/* Table détaillée */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">
            Détail mensuel — {activeYear}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Mois</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Produits
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Unités
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Volume (m³)
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Vol. facturable
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Coût estimé
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map(row => {
                const cost = pricingTiers
                  ? calculateStoragePrice(row.billable_volume_m3, pricingTiers)
                  : 0;
                return (
                  <tr key={row.month_date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatMonthLabel(row.month_val, row.year_val)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {row.products_count}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {row.total_units}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatVolume(row.total_volume_m3)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatVolume(row.billable_volume_m3)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#5DBEBB]">
                      {formatPrice(cost)}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Aucune donnée pour cette année
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

'use client';

/**
 * StatsProductsTab — Onglet Produits & Sélections de la page Statistiques
 *
 * Affiche :
 * - 3 KPIs : Quantités vendues, Sélections actives, Top produit
 * - Top 10 produits vendus (via TopProductsTable)
 * - Performance par sélection (via SelectionPerformanceCard)
 *
 * @module StatsProductsTab
 * @since 2026-02-25
 */

import { Card } from '@tremor/react';
import { Package, Star, Award } from 'lucide-react';

import {
  TopProductsTable,
  SelectionPerformanceCard,
} from '@/components/analytics';
import type { AffiliateAnalyticsData } from '@/types/analytics';
import { formatCurrency } from '@/types/analytics';

interface StatsProductsTabProps {
  data: AffiliateAnalyticsData | null | undefined;
  isLoading: boolean;
}

export function StatsProductsTab({ data, isLoading }: StatsProductsTabProps) {
  const topProduct = data?.topProducts?.[0];
  const activeSelections =
    data?.selectionsPerformance?.filter(s => s.publishedAt) ?? [];

  return (
    <div className="space-y-6">
      {/* 3 KPIs Produits */}
      <section className="grid grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-[#3976BB]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#3976BB]/10 rounded-lg">
              <Package className="h-4 w-4 text-[#3976BB]" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Éléments vendus
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-20" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#3976BB]">
                {(data?.totalQuantitySold ?? 0).toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">unités vendues</p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-[#5DBEBB]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#5DBEBB]/10 rounded-lg">
              <Star className="h-4 w-4 text-[#5DBEBB]" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Sélections actives
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-12" />
          ) : (
            <>
              <p className="text-2xl font-bold text-[#5DBEBB]">
                {activeSelections.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                sur {data?.selectionsPerformance?.length ?? 0} au total
              </p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Meilleur produit
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32" />
          ) : topProduct ? (
            <>
              <p className="text-lg font-bold text-amber-600 truncate">
                {topProduct.productName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {topProduct.quantitySold} vendus ·{' '}
                {formatCurrency(topProduct.commissionHT)} comm.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Aucune vente</p>
          )}
        </Card>
      </section>

      {/* Top 10 produits */}
      <TopProductsTable
        products={data?.topProducts}
        isLoading={isLoading}
        title="Top 10 Produits Vendus"
        maxItems={10}
      />

      {/* Performance par sélection */}
      {(data?.selectionsPerformance?.length ?? 0) > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance par sélection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.selectionsPerformance?.map(selection => (
              <SelectionPerformanceCard
                key={selection.id}
                selection={selection}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

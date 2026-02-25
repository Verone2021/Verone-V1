'use client';

/**
 * StatsSelectionsTab — Onglet Sélections de la page Statistiques
 *
 * Affiche :
 * - 2 KPIs : Sélections actives, Vues totales
 * - Performance par sélection (via SelectionPerformanceCard)
 *
 * @module StatsSelectionsTab
 * @since 2026-02-25
 */

import { Card } from '@tremor/react';
import { Star, Eye, Package } from 'lucide-react';

import { SelectionPerformanceCard } from '@/components/analytics';
import type { AffiliateAnalyticsData } from '@/types/analytics';

interface StatsSelectionsTabProps {
  data: AffiliateAnalyticsData | null | undefined;
  isLoading: boolean;
}

export function StatsSelectionsTab({
  data,
  isLoading,
}: StatsSelectionsTabProps) {
  const selections = data?.selectionsPerformance ?? [];
  const activeSelections = selections.filter(s => s.publishedAt);

  return (
    <div className="space-y-6">
      {/* 2 KPIs Sélections */}
      <section className="grid grid-cols-2 gap-4">
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
                sur {selections.length} au total
              </p>
            </>
          )}
        </Card>

        <Card className="p-5 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Vues totales
            </span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold text-purple-600">
                {(data?.totalViews ?? 0).toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                sur toutes les sélections
              </p>
            </>
          )}
        </Card>
      </section>

      {/* Performance par sélection */}
      {selections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selections.map(selection => (
            <SelectionPerformanceCard
              key={selection.id}
              selection={selection}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune sélection créée</p>
          <p className="text-sm text-gray-400">
            Vos sélections et leurs performances apparaîtront ici
          </p>
        </Card>
      )}
    </div>
  );
}

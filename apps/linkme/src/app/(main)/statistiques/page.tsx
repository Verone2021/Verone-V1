/**
 * Page Statistiques & Performance
 * Dashboard analytics complet pour l'affilié
 *
 * Affiche :
 * - KPIs principaux (6 métriques)
 * - Évolution CA (graphique Tremor)
 * - Répartition commissions (donut chart)
 * - Top 10 produits vendus
 * - Performance par sélection (drill-down)
 */

'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Card, Badge } from '@tremor/react';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

import {
  AffiliateKPIGrid,
  CommissionsOverview,
  RevenueChart,
  TopProductsTable,
  SelectionPerformanceCard,
} from '@/components/analytics';
import { useAffiliateAnalytics } from '@/lib/hooks/use-affiliate-analytics';
import type { AnalyticsPeriod } from '@/types/analytics';

export default function StatistiquesPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [expandedSelectionId, setExpandedSelectionId] = useState<string | null>(
    null
  );

  const { data, isLoading, error, refetch } = useAffiliateAnalytics(period);

  const handleToggleSelection = (selectionId: string) => {
    setExpandedSelectionId(
      expandedSelectionId === selectionId ? null : selectionId
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Statistiques & Performance
              </h1>
              <p className="text-gray-500 text-sm">
                Analysez vos performances de vente en temps réel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge temps réel */}
            <Badge color="emerald" size="sm" className="animate-pulse text-xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1.5" />
              Temps réel
            </Badge>

            {/* Bouton refresh */}
            <button
              onClick={() => {
                void refetch().catch(error => {
                  console.error('[StatistiquesPage] Refetch failed:', error);
                });
              }}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <Card className="p-3 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Erreur de chargement
                </p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <button
                onClick={() => {
                  void refetch().catch(error => {
                    console.error(
                      '[StatistiquesPage] Refetch retry failed:',
                      error
                    );
                  });
                }}
                className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        )}

        {/* KPIs Grid */}
        <section>
          <AffiliateKPIGrid data={data} isLoading={isLoading} />
        </section>

        {/* Graphiques Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Évolution CA */}
          <RevenueChart
            data={data?.revenueByPeriod}
            period={period}
            onPeriodChange={setPeriod}
            isLoading={isLoading}
          />

          {/* Répartition Commissions */}
          <CommissionsOverview
            data={data?.commissionsByStatus}
            isLoading={isLoading}
          />
        </section>

        {/* Top Produits */}
        <section>
          <TopProductsTable
            products={data?.topProducts}
            isLoading={isLoading}
            title="Top 10 Produits Vendus"
            maxItems={10}
          />
        </section>

        {/* Performance par Sélection */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Performance par Sélection
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cliquez sur une sélection pour voir ses produits les plus vendus
              </p>
            </div>
            <Badge color="gray" size="sm" className="text-xs">
              {data?.selectionsPerformance?.length ?? 0} sélections
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-0 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-24 bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                      <div className="h-2 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : data?.selectionsPerformance &&
            data.selectionsPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.selectionsPerformance.map(selection => (
                <SelectionPerformanceCard
                  key={selection.id}
                  selection={selection}
                  isExpanded={expandedSelectionId === selection.id}
                  onToggle={() => handleToggleSelection(selection.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                Aucune sélection créée
              </h3>
              <p className="text-gray-500 mb-3 text-sm">
                Créez votre première sélection pour commencer à vendre
              </p>
              <Link
                href="/ma-selection"
                className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
              >
                Créer une sélection
              </Link>
            </Card>
          )}
        </section>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400 pb-6">
          <p suppressHydrationWarning>
            Les données sont actualisées en temps réel. Dernière mise à jour :{' '}
            {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, lazy, Suspense } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useCompleteDashboardMetrics } from '@verone/dashboard';
import { cn } from '@verone/ui';
import { Button } from '@verone/ui';
import { RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

import { DashboardTabs, type DashboardTab } from './dashboard-tabs';
import { KPIGrid } from './kpi-grid';

// OPTIMISATION: Lazy loading des widgets et graphiques
// Réduit le bundle initial et charge les composants uniquement quand nécessaires
const RevenueChart = lazy(() =>
  import('./charts').then(mod => ({ default: mod.RevenueChart }))
);
const TreasuryChart = lazy(() =>
  import('./charts').then(mod => ({ default: mod.TreasuryChart }))
);
const RecentOrdersWidget = lazy(() =>
  import('./widgets').then(mod => ({ default: mod.RecentOrdersWidget }))
);
const StockAlertsWidget = lazy(() =>
  import('./widgets').then(mod => ({ default: mod.StockAlertsWidget }))
);
const StockMovementsWidget = lazy(() =>
  import('./widgets').then(mod => ({ default: mod.StockMovementsWidget }))
);

// Skeleton loader pour les composants lazy
function ChartSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-[300px] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Chargement du graphique...</p>
      </div>
    </div>
  );
}

function WidgetSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-[300px] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    </div>
  );
}

export function ConfigurableDashboard(): React.ReactElement {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DashboardTab>('apercu');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    metrics,
    isLoading,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error: metricsError,
  } = useCompleteDashboardMetrics();

  // Gestion des erreurs
  if (metricsError) {
    const errorMessage =
      typeof metricsError === 'string'
        ? metricsError
        : ((metricsError as Error)?.message ?? 'Données indisponibles');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-medium">Erreur de chargement</p>
          <p className="text-slate-600 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  // Rafraîchir toutes les données du dashboard
  const handleRefreshAll = async (): Promise<void> => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header avec navigation et actions */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRefreshAll()}
                disabled={isRefreshing}
                className="text-slate-600"
              >
                <RotateCcw
                  className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
                />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Navigation par onglets */}
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6 space-y-6">
        {/* Grille KPIs */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">KPIs</h2>
          <KPIGrid
            activeTab={activeTab}
            metrics={metrics as unknown as Record<string, unknown>}
          />
        </section>

        {/* Graphiques - OPTIMISATION: Lazy loading avec Suspense */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Graphiques
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-h-[300px]">
              <Suspense fallback={<ChartSkeleton />}>
                <RevenueChart />
              </Suspense>
            </div>
            <div className="min-h-[300px]">
              <Suspense fallback={<ChartSkeleton />}>
                <TreasuryChart />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Widgets - OPTIMISATION: Lazy loading avec Suspense */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Widgets</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="min-h-[300px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <RecentOrdersWidget />
              </Suspense>
            </div>
            <div className="min-h-[300px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <StockAlertsWidget />
              </Suspense>
            </div>
            <div className="min-h-[300px]">
              <Suspense fallback={<WidgetSkeleton />}>
                <StockMovementsWidget />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

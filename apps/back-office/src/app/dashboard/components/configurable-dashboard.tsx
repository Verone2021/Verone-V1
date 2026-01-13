'use client';

import React, { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useCompleteDashboardMetrics } from '@verone/dashboard';
import { cn } from '@verone/ui';
import { Button } from '@verone/ui';
import { Settings, RotateCcw, AlertCircle, AlertTriangle } from 'lucide-react';

import { RevenueChart, TreasuryChart } from './charts';
import { DashboardTabs, type DashboardTab } from './dashboard-tabs';
import { KPIGrid } from './kpi-grid';
import { KPISelectorModal } from './kpi-selector-modal';
import {
  RecentOrdersWidget,
  StockAlertsWidget,
  StockMovementsWidget,
} from './widgets';
import { useDashboardPreferences } from '../hooks/use-dashboard-preferences';
import type { KPIPeriod } from '../lib/kpi-catalog';

export function ConfigurableDashboard(): React.ReactElement {
  // Query client pour rafraîchissement global
  const queryClient = useQueryClient();

  // État local
  const [activeTab, setActiveTab] = useState<DashboardTab>('apercu');
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook métriques
  const {
    metrics,
    isLoading: metricsLoading,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    error: metricsError,
  } = useCompleteDashboardMetrics();

  // Hook préférences dashboard
  const {
    widgets,
    isLoading: prefsLoading,
    updateWidgetPeriod,
    removeWidget,
    addWidget,
    resetToDefaults,
  } = useDashboardPreferences(activeTab);

  // États de chargement combinés
  const isLoading = metricsLoading || prefsLoading;

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

  // Handlers
  const handlePeriodChange = (kpiId: string, period: KPIPeriod): void => {
    void updateWidgetPeriod(kpiId, period);
  };

  const handleRemoveWidget = (kpiId: string): void => {
    void removeWidget(kpiId);
  };

  const handleAddWidget = (): void => {
    if (widgets.length < 6) {
      setIsKpiModalOpen(true);
    }
  };

  const handleSelectKpi = (kpiId: string): void => {
    void addWidget(kpiId);
  };

  const handleResetToDefaults = (): void => {
    void resetToDefaults();
    setIsConfigMode(false);
  };

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
              {/* Bouton Actualiser tout (toujours visible) */}
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

              {isConfigMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaults}
                  className="text-slate-600"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              )}

              <Button
                variant={isConfigMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsConfigMode(!isConfigMode)}
                className={cn(isConfigMode && 'bg-blue-600 hover:bg-blue-700')}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isConfigMode ? 'Terminer' : 'Configurer'}
              </Button>
            </div>
          </div>

          {/* Navigation par onglets */}
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6 space-y-6">
        {/* Message mode configuration */}
        {isConfigMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Mode configuration actif
              </p>
              <p className="text-sm text-blue-700">
                Utilisez le menu (⋮) de chaque carte pour modifier la période ou
                retirer le KPI. Cliquez sur &quot;Terminer&quot; pour
                sauvegarder.
              </p>
            </div>
          </div>
        )}

        {/* Message si maximum atteint (en mode config) */}
        {isConfigMode && widgets.length >= 6 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Maximum de 6 KPIs atteint
              </p>
              <p className="text-sm text-amber-700">
                Retirez un KPI existant pour pouvoir en ajouter un autre.
              </p>
            </div>
          </div>
        )}

        {/* Grille KPIs */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            KPIs{' '}
            <span className="text-slate-400 font-normal">
              ({widgets.length}/6)
            </span>
          </h2>
          <KPIGrid
            widgets={widgets}
            metrics={metrics as unknown as Record<string, unknown>}
            isConfigMode={isConfigMode}
            onPeriodChange={handlePeriodChange}
            onRemoveWidget={handleRemoveWidget}
            onAddWidget={isConfigMode ? handleAddWidget : undefined}
          />
        </section>

        {/* Graphiques */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Graphiques
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-h-[300px]">
              <RevenueChart />
            </div>
            <div className="min-h-[300px]">
              <TreasuryChart />
            </div>
          </div>
        </section>

        {/* Widgets */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Widgets</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="min-h-[300px]">
              <RecentOrdersWidget />
            </div>
            <div className="min-h-[300px]">
              <StockAlertsWidget />
            </div>
            <div className="min-h-[300px]">
              <StockMovementsWidget />
            </div>
          </div>
        </section>
      </div>

      {/* Modal sélection KPI */}
      <KPISelectorModal
        open={isKpiModalOpen}
        onOpenChange={setIsKpiModalOpen}
        currentTab={activeTab}
        existingKpiIds={widgets.map(w => w.kpi_id)}
        onAddKpi={handleSelectKpi}
      />
    </div>
  );
}

'use client';

import { useEffect } from 'react';

import {
  useStockDashboard,
  useStockAlerts,
  useMovementsHistory,
} from '@verone/stock';
import { Loader2 } from 'lucide-react';

import {
  StockAlertsCard,
  RecentMovementsCard,
  AnalyticsCard,
  PrevisionnelCard,
  AjustementsCard,
  StockageCard,
} from './components/stock-dashboard-cards';
import { StockDashboardAlertsBanner } from './components/stock-dashboard-alerts-banner';
import { StockDashboardHeader } from './components/stock-dashboard-header';
import { StockDashboardKPIs } from './components/stock-dashboard-kpis';

export default function StocksDashboardPage() {
  const { metrics, loading, refetch } = useStockDashboard();
  const {
    alerts: activeAlerts,
    criticalAlerts,
    loading: alertsLoading,
  } = useStockAlerts();
  const {
    movements: lastMovements,
    loading: movementsLoading,
    fetchMovements,
  } = useMovementsHistory();

  useEffect(() => {
    void fetchMovements({ affects_forecast: false, limit: 5 }).catch(
      (error: unknown) => {
        console.error('[StocksPage] fetchMovements failed:', error);
      }
    );
  }, [fetchMovements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  const overview = metrics?.overview ?? {
    total_value: 0,
    products_in_stock: 0,
    products_out_of_stock: 0,
    products_below_min: 0,
    total_products: 0,
    total_quantity: 0,
  };

  const movements = metrics?.movements ?? {
    last_7_days: {
      entries: { count: 0, quantity: 0 },
      exits: { count: 0, quantity: 0 },
    },
  };

  const criticalCount =
    criticalAlerts?.filter(a => a.stock_real < a.min_stock).length ?? 0;
  const rotation7j =
    (movements.last_7_days?.entries?.quantity ?? 0) +
    (movements.last_7_days?.exits?.quantity ?? 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <StockDashboardHeader
          onRefetch={() => {
            void refetch().catch((error: unknown) => {
              console.error('[StocksPage] refetch failed:', error);
            });
          }}
        />

        <StockDashboardAlertsBanner
          realAlertsCount={activeAlerts.length}
          criticalCount={criticalCount}
          productsOutOfStock={overview.products_out_of_stock}
        />

        <StockDashboardKPIs
          totalQuantity={overview.total_quantity}
          totalValue={overview.total_value ?? 0}
          alertsCount={activeAlerts.length}
          rotation7j={rotation7j}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StockAlertsCard alerts={activeAlerts} loading={alertsLoading} />
          <RecentMovementsCard
            movements={lastMovements}
            loading={movementsLoading}
          />
          <AnalyticsCard
            totalProducts={overview.total_products}
            totalValue={overview.total_value ?? 0}
          />
          <PrevisionnelCard />
          <AjustementsCard />
          <StockageCard />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ProductThumbnail } from '@verone/products';
import { useStockDashboard } from '@verone/stock';
import { useStockAlerts } from '@verone/stock';
import { useMovementsHistory } from '@verone/stock';
import { Badge, ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Package,
  BarChart3,
  ArrowUpDown,
  AlertTriangle,
  Grid3x3,
  TrendingUp,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

import { StockKPICard } from '@/components/ui-v2/stock/stock-kpi-card';

export default function StocksDashboardPage() {
  const router = useRouter();
  const { metrics, loading, error: _error, refetch } = useStockDashboard();

  // Hooks pour widgets
  const {
    alerts: activeAlerts, // Renommé pour compatibilité
    criticalAlerts,
    loading: alertsLoading,
    fetchAlerts,
  } = useStockAlerts();
  const {
    movements: lastMovements,
    loading: movementsLoading,
    fetchMovements,
  } = useMovementsHistory();

  // Charger derniers mouvements réels au montage
  useEffect(() => {
    void fetchMovements({ affects_forecast: false, limit: 5 }).catch(error => {
      console.error('[StocksPage] fetchMovements failed:', error);
    });
  }, [fetchMovements]);

  // Auto-refresh alertes stock toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchAlerts().catch(error => {
        console.error('[StocksPage] fetchAlerts failed:', error);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Extraction des métriques avec fallbacks
  const overview = metrics?.overview ?? {
    total_value: 0,
    products_in_stock: 0,
    products_out_of_stock: 0,
    products_below_min: 0,
    total_products: 0,
    total_quantity: 0,
    total_available: 0,
  };

  const movements = metrics?.movements ?? {
    last_7_days: {
      entries: { count: 0, quantity: 0 },
      exits: { count: 0, quantity: 0 },
      adjustments: { count: 0, quantity: 0 },
    },
    today: { entries: 0, exits: 0, adjustments: 0 },
    total_movements: 0,
  };

  // Vraies alertes actives depuis useStockAlerts (filtrées: stock_real < min_stock)
  const realAlertsCount = activeAlerts.length;
  const criticalCount =
    criticalAlerts?.filter(a => a.stock_real < a.min_stock).length || 0;

  // Rotation 7 jours = entrées + sorties
  const rotation7j =
    (movements.last_7_days?.entries?.quantity ?? 0) +
    (movements.last_7_days?.exits?.quantity ?? 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Ultra-Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Stocks</h2>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch().catch(error => {
                  console.error('[StocksPage] refetch failed:', error);
                });
              }}
              disabled={loading}
              className="border-black text-black hover:bg-black hover:text-white transition-all duration-200"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="text-xs">Actualiser</span>
            </ButtonV2>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6 space-y-4">
        {/* KPIs EN HAUT - Best Practice ERP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* KPI 1: Stock Total */}
          <StockKPICard
            title="Stock Total"
            value={overview.total_quantity}
            icon={Package}
            variant="success"
            subtitle={`${overview.products_in_stock} produits en stock`}
          />

          {/* KPI 2: Alertes (vraies données!) */}
          <StockKPICard
            title="Alertes"
            value={realAlertsCount}
            icon={AlertTriangle}
            variant={
              criticalCount > 0
                ? 'danger'
                : realAlertsCount > 0
                  ? 'warning'
                  : 'success'
            }
            subtitle={
              criticalCount > 0
                ? `${criticalCount} critiques`
                : realAlertsCount > 0
                  ? `${realAlertsCount} à traiter`
                  : 'Aucune alerte'
            }
          />

          {/* KPI 3: Rotation 7 jours (remplace "Disponible") */}
          <StockKPICard
            title="Rotation 7j"
            value={rotation7j}
            icon={ArrowUpDown}
            variant="info"
            subtitle="entrées + sorties"
          />

          {/* KPI 4: Valeur Stock */}
          <StockKPICard
            title="Valeur Stock"
            value={new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(overview.total_value || 0)}
            icon={BarChart3}
            variant="default"
            subtitle="HT"
          />
        </div>

        {/* Navigation Compacte - 1 seule ligne */}
        <div className="flex flex-wrap items-center gap-2 py-2 px-1">
          {/* Boutons Pages Stock */}
          <ButtonV2
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors h-8"
            onClick={() => router.push('/stocks/inventaire')}
          >
            <Grid3x3 className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Inventaire</span>
          </ButtonV2>

          <ButtonV2
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors h-8"
            onClick={() => router.push('/stocks/mouvements')}
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Mouvements</span>
          </ButtonV2>

          <ButtonV2
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors h-8"
            onClick={() => router.push('/stocks/alertes')}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Alertes</span>
            {realAlertsCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1.5 h-4 px-1 text-[10px]"
              >
                {realAlertsCount}
              </Badge>
            )}
          </ButtonV2>

          <ButtonV2
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors h-8"
            onClick={() => router.push('/stocks/previsionnel')}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Prévisionnels</span>
          </ButtonV2>

          {/* Séparateur */}
          <span className="text-gray-300 mx-1">|</span>

          {/* Liens Connexes */}
          <Link
            href="/produits/catalogue"
            className="text-xs text-gray-500 hover:text-black hover:underline transition-colors"
          >
            Catalogue
          </Link>
          <Link
            href="/commandes/fournisseurs"
            className="text-xs text-gray-500 hover:text-black hover:underline transition-colors"
          >
            Fournisseurs
          </Link>
          <Link
            href="/commandes/clients"
            className="text-xs text-gray-500 hover:text-black hover:underline transition-colors"
          >
            Clients
          </Link>
        </div>

        {/* Widgets en 2 colonnes - Cartes compactes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Widget: Alertes Stock */}
          <Card className="border-gray-200 rounded-[10px] min-h-[500px] flex flex-col">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-black text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Alertes Stock ({activeAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-3 pb-3">
              <div className="space-y-1">
                {alertsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-5 w-5 text-gray-300 mx-auto mb-2 animate-spin" />
                    <p className="text-xs text-gray-500">Chargement...</p>
                  </div>
                ) : activeAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Aucune alerte</p>
                  </div>
                ) : (
                  <>
                    {activeAlerts.slice(0, 10).map(alert => {
                      const stockPrevisionnel =
                        alert.stock_real +
                        (alert.stock_forecasted_in || 0) -
                        (alert.stock_forecasted_out || 0);
                      const seuilAtteint =
                        stockPrevisionnel >= (alert.min_stock || 0);

                      // Couleur indicateur vertical
                      const indicatorColor =
                        alert.validated && seuilAtteint
                          ? 'bg-green-500'
                          : alert.is_in_draft
                            ? 'bg-orange-500'
                            : 'bg-red-500';

                      return (
                        <div
                          key={alert.id}
                          className="flex items-center gap-2 bg-white border border-gray-100 rounded py-1.5 px-2"
                        >
                          {/* Indicateur vertical coloré */}
                          <div
                            className={`w-1 h-8 rounded-full ${indicatorColor} flex-shrink-0`}
                          />

                          <ProductThumbnail
                            src={alert.product_image_url}
                            alt={alert.product_name}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/produits/catalogue/${alert.product_id}`}
                              className="text-xs font-medium text-black hover:text-blue-600 block truncate"
                            >
                              {alert.product_name}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>{alert.sku}</span>
                              <span>•</span>
                              <span>Stock: {alert.stock_real}</span>
                              <span>→</span>
                              <span
                                className={
                                  seuilAtteint
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {stockPrevisionnel}
                              </span>
                              <span>/ {alert.min_stock}</span>
                            </div>
                          </div>
                          {alert.is_in_draft && (
                            <span className="text-[9px] text-orange-600 bg-orange-50 px-1 rounded">
                              ⏳
                            </span>
                          )}
                          {alert.validated && seuilAtteint && (
                            <span className="text-[9px] text-green-600 bg-green-50 px-1 rounded">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/stocks/alertes')}
                      className="w-full text-orange-600 hover:bg-orange-50 text-[10px] mt-1 h-6"
                    >
                      Voir tout ({activeAlerts.length})
                    </ButtonV2>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Widget: Derniers Mouvements */}
          <Card className="border-gray-200 rounded-[10px] min-h-[500px] flex flex-col">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-black text-sm font-semibold flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-blue-500" />
                Derniers Mouvements
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 px-3 pb-3">
              <div className="space-y-1">
                {movementsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-5 w-5 text-gray-300 mx-auto mb-2 animate-spin" />
                    <p className="text-xs text-gray-500">Chargement...</p>
                  </div>
                ) : lastMovements.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Aucun mouvement</p>
                  </div>
                ) : (
                  <>
                    {lastMovements.slice(0, 12).map(movement => {
                      // Couleur indicateur selon type
                      const indicatorColor =
                        movement.movement_type === 'IN'
                          ? 'bg-green-500'
                          : movement.movement_type === 'OUT'
                            ? 'bg-red-500'
                            : 'bg-blue-500';

                      return (
                        <div
                          key={movement.id}
                          className="flex items-center gap-2 bg-white border border-gray-100 rounded py-1.5 px-2"
                        >
                          {/* Indicateur vertical coloré */}
                          <div
                            className={`w-1 h-8 rounded-full ${indicatorColor} flex-shrink-0`}
                          />

                          <ProductThumbnail
                            src={movement.product_image_url}
                            alt={movement.product_name ?? 'Produit'}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black truncate">
                              {movement.product_name ?? 'Produit'}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {new Date(movement.performed_at).toLocaleString(
                                'fr-FR',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              movement.quantity_change > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {movement.quantity_change > 0 ? '+' : ''}
                            {movement.quantity_change}
                          </span>
                        </div>
                      );
                    })}
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/stocks/mouvements')}
                      className="w-full text-blue-600 hover:bg-blue-50 text-[10px] mt-1 h-6"
                    >
                      Voir l'historique complet
                    </ButtonV2>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

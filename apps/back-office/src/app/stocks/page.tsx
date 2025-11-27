'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ProductThumbnail } from '@verone/products';
import { useStockDashboard } from '@verone/stock';
import { useStockAlerts } from '@verone/stock';
import { useMovementsHistory } from '@verone/stock';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Package,
  BarChart3,
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Grid3x3,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';

import { StockKPICard } from '@/components/ui-v2/stock/stock-kpi-card';

export default function StocksDashboardPage() {
  const router = useRouter();
  const { metrics, loading, error, refetch } = useStockDashboard();

  // 🆕 Phase 3.6: Hooks widgets minimalistes
  const {
    alerts,
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
    fetchMovements({ affects_forecast: false, limit: 5 });
  }, [fetchMovements]);

  // ✅ Auto-refresh alertes stock toutes les 30 secondes (cohérent avec /stocks/alertes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Extraction des métriques avec fallbacks
  const overview = metrics?.overview || {
    total_value: 0,
    products_in_stock: 0,
    products_out_of_stock: 0,
    products_below_min: 0,
    total_products: 0,
    total_quantity: 0,
    total_available: 0,
  };

  const movements = metrics?.movements || {
    last_7_days: {
      entries: { count: 0, quantity: 0 },
      exits: { count: 0, quantity: 0 },
      adjustments: { count: 0, quantity: 0 },
    },
    today: { entries: 0, exits: 0, adjustments: 0 },
    total_movements: 0,
  };

  const lowStockProducts = metrics?.low_stock_products || [];
  const recentMovements = metrics?.recent_movements || [];
  const incomingOrders = metrics?.incoming_orders || [];
  const outgoingOrders = metrics?.outgoing_orders || [];

  const totalAlerts =
    overview.products_out_of_stock + overview.products_below_min;

  // Handler pour ouvrir les détails de commande (modal)
  const handleOrderClick = (
    orderId: string,
    orderType: 'purchase' | 'sales'
  ) => {
    if (orderType === 'purchase') {
      router.push(`/commandes/fournisseurs/${orderId}`);
    } else {
      router.push(`/commandes/clients/${orderId}`);
    }
  };

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
              onClick={() => refetch()}
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

      <div className="w-full px-4 py-6 space-y-6">
        {/* Navigation - TOUJOURS VISIBLE EN HAUT */}
        <Card className="border-gray-300 rounded-[10px] shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-4">
            {/* Section Pages Stock */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Pages Stock
              </p>
              <div className="flex gap-2 flex-wrap">
                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/inventaire')}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  <span className="text-xs">Inventaire</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/mouvements')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <span className="text-xs">Mouvements</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/alertes')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-xs">Alertes</span>
                  {totalAlerts > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 px-1.5 text-xs"
                    >
                      {totalAlerts}
                    </Badge>
                  )}
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/previsionnel')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span className="text-xs">Prévisionnels</span>
                  <Badge
                    variant="outline"
                    className="ml-2 h-5 px-1.5 text-[10px] border-blue-400 text-blue-600"
                  >
                    NEW
                  </Badge>
                </ButtonV2>
              </div>
            </div>

            {/* Section Pages Connexes */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Pages Connexes
              </p>
              <div className="flex gap-4 flex-wrap items-center text-sm">
                <Link
                  href="/produits/catalogue"
                  className="text-gray-600 hover:text-black hover:underline decoration-wavy transition-colors flex items-center gap-1"
                >
                  <span>→</span>
                  <span>Catalogue</span>
                </Link>

                <Link
                  href="/commandes/fournisseurs"
                  className="text-gray-600 hover:text-black hover:underline decoration-wavy transition-colors flex items-center gap-1"
                >
                  <span>→</span>
                  <span>Commandes Fournisseurs</span>
                </Link>

                <Link
                  href="/commandes/clients"
                  className="text-gray-600 hover:text-black hover:underline decoration-wavy transition-colors flex items-center gap-1"
                >
                  <span>→</span>
                  <span>Commandes Clients</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Compacts - 4 Cards Design System V2 (Height 80px) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* KPI 1: Stock Réel */}
          <StockKPICard
            title="Stock Réel"
            value={overview.total_quantity}
            icon={Package}
            variant="success"
            subtitle={`${overview.products_in_stock} produits en stock`}
          />

          {/* KPI 2: Stock Disponible */}
          <StockKPICard
            title="Disponible"
            value={overview.total_available || 0}
            icon={CheckCircle}
            variant="info"
            subtitle="Réel - Réservé"
          />

          {/* KPI 3: Alertes Stock */}
          <StockKPICard
            title="Alertes"
            value={totalAlerts}
            icon={AlertTriangle}
            variant={
              totalAlerts > 5
                ? 'danger'
                : totalAlerts > 0
                  ? 'warning'
                  : 'success'
            }
            subtitle={
              totalAlerts > 0
                ? `${totalAlerts} actions requises`
                : 'Aucune alerte'
            }
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

        {/* Section Stock Réel - Design sobre fond blanc */}
        <Card className="border-gray-200 rounded-[10px] shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-300"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mouvements Effectués
              </Badge>
              <CardTitle className="text-xl text-black">Stock Réel</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Inventaire actuel et mouvements confirmés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 🆕 Widget: Alertes Stock (toutes sévérités) */}
            <Card className="border-gray-200 rounded-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Alertes Stock
                </CardTitle>
                <CardDescription className="text-xs">
                  Top 3 alertes nécessitant attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsLoading ? (
                    <div className="text-center py-6">
                      <RefreshCw className="h-6 w-6 text-gray-300 mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-gray-500">
                        Chargement alertes...
                      </p>
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Aucune alerte stock actuellement
                      </p>
                    </div>
                  ) : (
                    <>
                      {alerts.slice(0, 3).map(alert => {
                        // ✅ Phase 3.7: Calcul stock prévisionnel pour affichage
                        const stockPrevisionnel =
                          alert.stock_real +
                          (alert.stock_forecasted_in || 0) -
                          (alert.stock_forecasted_out || 0);
                        const seuilAtteint =
                          stockPrevisionnel >= (alert.min_stock || 0);

                        return (
                          <div
                            key={alert.id}
                            className={`flex items-center gap-3 border-l-4 rounded-r-lg px-3 py-2 mb-2 last:mb-0 ${
                              alert.validated && seuilAtteint
                                ? 'border-green-500 bg-green-50'
                                : alert.is_in_draft
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-red-500 bg-red-50'
                            }`}
                          >
                            {/* Photo produit */}
                            <ProductThumbnail
                              src={alert.product_image_url}
                              alt={alert.product_name}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/produits/catalogue/${alert.product_id}`}
                                className="text-sm font-medium text-black hover:text-blue-600 hover:underline transition-colors block truncate"
                              >
                                {alert.product_name}
                              </Link>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {alert.sku}
                              </p>
                              {/* ✅ Phase 3.7: Afficher statut commande si disponible */}
                              {alert.is_in_draft &&
                                alert.draft_order_number && (
                                  <p className="text-xs text-orange-600 mt-1 font-medium">
                                    ⏳ En attente: {alert.draft_order_number} (
                                    {alert.quantity_in_draft} unités)
                                  </p>
                                )}
                              {alert.validated && seuilAtteint && (
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                  ✅ Validé - Stock prévu suffisant
                                </p>
                              )}
                            </div>
                            <div className="text-right flex flex-col gap-1 ml-2 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600 text-xs"
                              >
                                {alert.stock_real} réel → {stockPrevisionnel}{' '}
                                prévu
                              </Badge>
                              {alert.min_stock && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    seuilAtteint
                                      ? 'border-green-300 text-green-600'
                                      : 'border-red-300 text-red-600'
                                  }`}
                                >
                                  Seuil: {alert.min_stock}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/stocks/alertes')}
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs mt-2"
                      >
                        <AlertTriangle className="h-3 w-3 mr-2" />
                        Voir toutes les alertes ({alerts.length})
                      </ButtonV2>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Widget: Historique des Stocks */}
            <Card className="border-gray-200 rounded-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-blue-500" />
                  Historique des Stocks
                </CardTitle>
                <CardDescription className="text-xs">
                  Derniers mouvements et ajustements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {movementsLoading ? (
                    <div className="text-center py-6">
                      <RefreshCw className="h-6 w-6 text-gray-300 mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-gray-500">
                        Chargement mouvements...
                      </p>
                    </div>
                  ) : lastMovements.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Aucun mouvement récent
                      </p>
                    </div>
                  ) : (
                    <>
                      {lastMovements.slice(0, 5).map(movement => (
                        <div
                          key={movement.id}
                          className="flex items-center gap-3 border-b border-gray-100 pb-2 last:border-0"
                        >
                          {/* Photo produit */}
                          <ProductThumbnail
                            src={movement.product_image_url}
                            alt={movement.product_name || 'Produit'}
                            size="sm"
                          />
                          {/* Icône type mouvement */}
                          {movement.movement_type === 'IN' ? (
                            <ArrowDownToLine className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : movement.movement_type === 'OUT' ? (
                            <ArrowUpFromLine className="h-4 w-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <RotateCcw className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">
                              {movement.product_name || 'Produit inconnu'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {movement.product_sku}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(movement.performed_at).toLocaleString(
                                'fr-FR',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              movement.quantity_change > 0
                                ? 'border-green-300 text-green-600 text-xs'
                                : 'border-red-300 text-red-600 text-xs'
                            }
                          >
                            {movement.quantity_change > 0 ? '+' : ''}
                            {movement.quantity_change}
                          </Badge>
                        </div>
                      ))}
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/stocks/mouvements')}
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors text-xs mt-2"
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        Voir l'historique complet
                      </ButtonV2>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* eslint-disable max-lines */
'use client';

import { useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  useStockDashboard,
  useStockAlerts,
  useMovementsHistory,
} from '@verone/stock';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Box,
  ClipboardCheck,
  Loader2,
  Package,
  TrendingUp,
  Warehouse,
} from 'lucide-react';

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

  const realAlertsCount = activeAlerts.length;
  const criticalCount =
    criticalAlerts?.filter(a => a.stock_real < a.min_stock).length ?? 0;
  const rotation7j =
    (movements.last_7_days?.entries?.quantity ?? 0) +
    (movements.last_7_days?.exits?.quantity ?? 0);

  const totalAlerts =
    (realAlertsCount > 0 ? 1 : 0) +
    (overview.products_out_of_stock > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header + Navigation rapide */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stocks</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/stocks/inventaire"
                className="text-gray-500 hover:text-gray-900"
              >
                Inventaire
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/mouvements"
                className="text-gray-500 hover:text-gray-900"
              >
                Mouvements
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/alertes"
                className="text-gray-500 hover:text-gray-900"
              >
                Alertes
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/analytics"
                className="text-gray-500 hover:text-gray-900"
              >
                Analytics
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/previsionnel"
                className="text-gray-500 hover:text-gray-900"
              >
                Previsionnel
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/ajustements"
                className="text-gray-500 hover:text-gray-900"
              >
                Ajustements
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/stockage"
                className="text-gray-500 hover:text-gray-900"
              >
                Stockage
              </Link>
            </div>
          </div>
          <button
            onClick={() => {
              void refetch().catch((error: unknown) => {
                console.error('[StocksPage] refetch failed:', error);
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Actualiser
          </button>
        </div>

        {/* Alertes - A traiter */}
        {totalAlerts > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900">
                A traiter ({realAlertsCount + overview.products_out_of_stock})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {realAlertsCount > 0 && (
                <Link
                  href="/stocks/alertes"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{realAlertsCount}</strong> produit(s) sous le
                      seuil minimum
                      {criticalCount > 0 && (
                        <span className="text-red-600 ml-1">
                          dont {criticalCount} critique(s)
                        </span>
                      )}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {overview.products_out_of_stock > 0 && (
                <Link
                  href="/stocks/inventaire"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{overview.products_out_of_stock}</strong>{' '}
                      produit(s) en rupture de stock
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Stock total
            </p>
            <p className="text-base font-bold text-gray-900">
              {overview.total_quantity.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Valeur stock
            </p>
            <p className="text-base font-bold text-gray-900">
              {(overview.total_value ?? 0).toLocaleString('fr-FR')} &euro;
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Alertes
            </p>
            <p className="text-base font-bold text-gray-900">
              {realAlertsCount}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Rotation 7j
            </p>
            <p className="text-base font-bold text-gray-900">{rotation7j}</p>
          </div>
        </div>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Alertes Stock */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Alertes Stock
                </h2>
              </div>
              <Link
                href="/stocks/alertes"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir toutes &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {alertsLoading ? (
                <div className="px-4 py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Chargement...</p>
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Package className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune alerte</p>
                </div>
              ) : (
                activeAlerts.slice(0, 5).map(alert => (
                  <Link
                    key={alert.id}
                    href={`/produits/catalogue/${alert.product_id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                  >
                    {alert.product_image_url ? (
                      <Image
                        src={alert.product_image_url}
                        alt=""
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {alert.sku} · Stock: {alert.stock_real} / Min:{' '}
                        {alert.min_stock}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${alert.stock_real <= 0 ? 'text-red-600' : 'text-orange-600'}`}
                    >
                      {alert.stock_real <= 0 ? 'Rupture' : 'Bas'}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Derniers Mouvements */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Derniers Mouvements
                </h2>
              </div>
              <Link
                href="/stocks/mouvements"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {movementsLoading ? (
                <div className="px-4 py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Chargement...</p>
                </div>
              ) : lastMovements.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <ArrowUpDown className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun mouvement</p>
                </div>
              ) : (
                lastMovements.slice(0, 5).map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    {m.product_image_url ? (
                      <Image
                        src={m.product_image_url}
                        alt=""
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {m.product_name ?? 'Produit'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(m.performed_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {m.quantity_change > 0 ? '+' : ''}
                      {m.quantity_change}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Analytics
                </h2>
              </div>
              <Link
                href="/stocks/analytics"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir detail &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              <Link
                href="/stocks/analytics"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {overview.total_products} produits · Classification ABC/XYZ
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/stocks/analytics"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Valeur {(overview.total_value ?? 0).toLocaleString('fr-FR')}{' '}
                    &euro; · Rotation · Couverture
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/stocks/analytics"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Top 20 haute valeur · Produits inactifs
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Previsionnel */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Previsionnel
                </h2>
              </div>
              <Link
                href="/stocks/previsionnel"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir detail &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              <Link
                href="/stocks/previsionnel"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Entrees et sorties prevues (commandes en cours)
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/stocks/previsionnel"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Box className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Impact stock par commande client et fournisseur
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Ajustements */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Ajustements
                </h2>
              </div>
              <Link
                href="/stocks/ajustements"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tout &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              <Link
                href="/stocks/ajustements"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Historique des ajustements · Audit et tracabilite
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/stocks/mouvements"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Nouveau mouvement · Correction de stock
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Stockage */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Stockage
                </h2>
              </div>
              <Link
                href="/stocks/stockage"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir detail &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              <Link
                href="/stocks/stockage"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Warehouse className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Stockage entrepot · Volume et facturation m3
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/stocks/stockage"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Box className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Allocations par enseigne et organisation
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

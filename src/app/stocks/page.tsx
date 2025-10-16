"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  BarChart3,
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Grid3x3,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  RefreshCw,
  Clock,
  Euro
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStockDashboard } from '@/hooks/use-stock-dashboard'
import { ForecastSummaryWidget } from '@/components/business/forecast-summary-widget'
import { formatPrice } from '@/lib/utils'

export default function StocksDashboardPage() {
  const router = useRouter()
  const { metrics, loading, error, refetch } = useStockDashboard()

  // Extraction des métriques avec fallbacks
  const overview = metrics?.overview || {
    total_value: 0,
    products_in_stock: 0,
    products_out_of_stock: 0,
    products_below_min: 0,
    total_products: 0,
    total_quantity: 0
  }

  const movements = metrics?.movements || {
    last_7_days: { entries: { count: 0, quantity: 0 }, exits: { count: 0, quantity: 0 }, adjustments: { count: 0, quantity: 0 } },
    today: { entries: 0, exits: 0, adjustments: 0 },
    total_movements: 0
  }

  const lowStockProducts = metrics?.low_stock_products || []
  const recentMovements = metrics?.recent_movements || []
  const incomingOrders = metrics?.incoming_orders || []
  const outgoingOrders = metrics?.outgoing_orders || []

  const totalAlerts = overview.products_out_of_stock + overview.products_below_min

  // Handler pour ouvrir les détails de commande (modal)
  const handleOrderClick = (orderId: string, orderType: 'purchase' | 'sales') => {
    // TODO: Ouvrir modal avec détails commande
    if (orderType === 'purchase') {
      router.push(`/commandes/fournisseurs/${orderId}`)
    } else {
      router.push(`/commandes/clients/${orderId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard Stocks</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble de l'inventaire et des mouvements Vérone</p>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonV2
                variant="outline"
                onClick={() => refetch()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </ButtonV2>
              <ButtonV2
                variant="outline"
                onClick={() => router.push('/stocks/mouvements')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir Mouvements
              </ButtonV2>
              <ButtonV2
                onClick={() => router.push('/stocks/entrees')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Entrée
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Cards - 4 KPIs compacts en 1 ligne */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* KPI 1: Stock Réel Total */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stock Réel</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-black">{overview.total_quantity}</div>
              <p className="text-xs text-gray-600">
                {overview.products_in_stock} produits en stock
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: Stock Disponible */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Stock Disponible</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-black">{overview.total_available || 0}</div>
              <p className="text-xs text-gray-600">
                Réel - Réservations clients
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: Alertes Stock */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alertes Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-black">{totalAlerts}</div>
              <p className="text-xs text-gray-600">
                {overview.products_below_min} sous seuil · {overview.products_out_of_stock} ruptures
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: Valeur Stock Réel */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valeur Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-black">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(overview.total_value || 0)}
              </div>
              <p className="text-xs text-gray-600">
                TVA {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((overview.total_value || 0) * 0.2)} · TTC {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((overview.total_value || 0) * 1.2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation organisée par sections */}
        <div className="space-y-3">
          {/* Section Pages Stock */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pages Stock</p>
            <div className="flex gap-2 flex-wrap">
              <ButtonV2
                variant="outline"
                size="sm"
                className="h-12 border-black text-black hover:bg-black hover:text-white transition-colors"
                onClick={() => router.push('/stocks/inventaire')}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                <span className="text-xs">Inventaire</span>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                size="sm"
                className="h-12 border-black text-black hover:bg-black hover:text-white transition-colors"
                onClick={() => router.push('/stocks/mouvements')}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span className="text-xs">Mouvements</span>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                size="sm"
                className="h-12 border-black text-black hover:bg-black hover:text-white transition-colors"
                onClick={() => router.push('/stocks/alertes')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-xs">Alertes</span>
                {totalAlerts > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                    {totalAlerts}
                  </Badge>
                )}
              </ButtonV2>

              <ButtonV2
                variant="outline"
                size="sm"
                className="h-12 border-black text-black hover:bg-black hover:text-white transition-colors"
                onClick={() => router.push('/stocks/entrees')}
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                <span className="text-xs">Entrées</span>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                size="sm"
                className="h-12 border-black text-black hover:bg-black hover:text-white transition-colors"
                onClick={() => router.push('/stocks/sorties')}
              >
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                <span className="text-xs">Sorties</span>
              </ButtonV2>
            </div>
          </div>

          {/* Section Pages Connexes */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pages Connexes</p>
            <div className="flex gap-4 flex-wrap items-center text-sm">
              <Link
                href="/produits/catalogue"
                className="text-gray-600 hover:text-black hover:underline transition-colors flex items-center gap-1"
              >
                <span>→</span>
                <span>Catalogue</span>
              </Link>

              <Link
                href="/commandes/fournisseurs"
                className="text-gray-600 hover:text-black hover:underline transition-colors flex items-center gap-1"
              >
                <span>→</span>
                <span>Commandes Fournisseurs</span>
              </Link>

              <Link
                href="/commandes/clients"
                className="text-gray-600 hover:text-black hover:underline transition-colors flex items-center gap-1"
              >
                <span>→</span>
                <span>Commandes Clients</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Widget Prévisionnel Stock - Entrées/Sorties */}
        <ForecastSummaryWidget
          incomingOrders={incomingOrders}
          outgoingOrders={outgoingOrders}
          totalIn={overview.total_forecasted_in || 0}
          totalOut={Math.abs(overview.total_forecasted_out || 0)}
          onOrderClick={handleOrderClick}
        />

        {/* Performance et Activité - Données Réelles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mouvements 7 Jours Détaillés */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Mouvements 7 Derniers Jours</CardTitle>
              <CardDescription>Activité récente des stocks avec quantités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDownToLine className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Entrées</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">{movements.last_7_days.entries.count} mouvements</span>
                    <Badge variant="outline" className="border-green-300 text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{movements.last_7_days.entries.quantity} unités
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Sorties</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">{movements.last_7_days.exits.count} mouvements</span>
                    <Badge variant="outline" className="border-red-300 text-red-600">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -{movements.last_7_days.exits.quantity} unités
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Ajustements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-black">{movements.last_7_days.adjustments.count} corrections</span>
                    <Badge variant="outline" className="border-blue-300 text-blue-600">
                      {movements.last_7_days.adjustments.quantity >= 0 ? '+' : ''}{movements.last_7_days.adjustments.quantity}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Activité aujourd'hui</span>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-green-600">{movements.today.entries} IN</span>
                      <span className="text-red-600">{movements.today.exits} OUT</span>
                      <span className="text-blue-600">{movements.today.adjustments} ADJ</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produits Faible Stock - Liste Réelle */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Alertes Stock Faible</CardTitle>
              <CardDescription>Produits nécessitant réapprovisionnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune alerte stock actuellement</p>
                  </div>
                ) : (
                  <>
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex-1">
                          <Link
                            href={`/catalogue/${product.id}`}
                            className="text-sm font-medium text-black hover:text-blue-600 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <Badge variant="outline" className="border-orange-300 text-orange-600">
                            Réel: {product.stock_quantity}
                          </Badge>
                          {Math.abs(product.stock_forecasted_out || 0) > 0 && (
                            <Badge variant="outline" className="border-red-300 text-red-600">
                              Réservé: {Math.abs(product.stock_forecasted_out)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/stocks/alertes')}
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Voir toutes les alertes ({totalAlerts})
                      </ButtonV2>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mouvements Récents - Timeline Réelle */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Derniers Mouvements</CardTitle>
            <CardDescription>5 mouvements les plus récents</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun mouvement récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-start gap-4 border-b pb-3">
                    <div className={`mt-1 p-2 rounded-md ${
                      movement.movement_type === 'IN' ? 'bg-green-50' :
                      movement.movement_type === 'OUT' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      {movement.movement_type === 'IN' ? (
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      ) : movement.movement_type === 'OUT' ? (
                        <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/catalogue/${movement.product_id}`}
                        className="font-medium text-black hover:text-blue-600 hover:underline"
                      >
                        {movement.product_name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {movement.product_sku}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} unités
                        </span>
                        <span className="text-xs text-gray-400">
                          {movement.quantity_before} → {movement.quantity_after}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>{new Date(movement.performed_at).toLocaleDateString('fr-FR')}</div>
                      <div>{new Date(movement.performed_at).toLocaleTimeString('fr-FR')}</div>
                      <div className="text-gray-400">{movement.performer_name}</div>
                    </div>
                  </div>
                ))}
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/stocks/mouvements')}
                  className="w-full border-black text-black hover:bg-black hover:text-white mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir tous les mouvements
                </ButtonV2>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
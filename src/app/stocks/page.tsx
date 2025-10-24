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
  RefreshCw,
  Clock,
  CheckCircle,
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
    total_quantity: 0,
    total_available: 0,
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
    if (orderType === 'purchase') {
      router.push(`/commandes/fournisseurs/${orderId}`)
    } else {
      router.push(`/commandes/clients/${orderId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Ultra-Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Stocks</h2>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="border-black text-black hover:bg-black hover:text-white transition-all duration-200"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs">Actualiser</span>
            </ButtonV2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Navigation - TOUJOURS VISIBLE EN HAUT */}
        <Card className="border-gray-300 rounded-[10px] shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-4">
            {/* Section Pages Stock */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pages Stock</p>
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
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                      {totalAlerts}
                    </Badge>
                  )}
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => router.push('/stocks/entrees')}
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  <span className="text-xs">Entrées</span>
                </ButtonV2>

                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white transition-colors"
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
        {/* KPIs Compacts - 4 Cards en 1 ligne (Height 80px) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* KPI 1: Stock Réel */}
          <Card className="h-20 border-black rounded-[10px] shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Stock Réel</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-2 px-4">
              <div className="text-lg font-bold text-black">{overview.total_quantity}</div>
              <Badge className="text-xs bg-green-50 text-green-600 border-green-200 mt-0.5">
                <TrendingUp className="h-3 w-3 mr-1" />
                {overview.products_in_stock} en stock
              </Badge>
            </CardContent>
          </Card>

          {/* KPI 2: Stock Disponible */}
          <Card className="h-20 border-black rounded-[10px] shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Disponible</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-2 px-4">
              <div className="text-lg font-bold text-black">{overview.total_available || 0}</div>
              <Badge className="text-xs bg-purple-50 text-purple-600 border-purple-200 mt-0.5">
                Réel - Réservé
              </Badge>
            </CardContent>
          </Card>

          {/* KPI 3: Alertes Stock */}
          <Card className="h-20 border-black rounded-[10px] shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Alertes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="pb-2 px-4">
              <div className="text-lg font-bold text-black">{totalAlerts}</div>
              <Badge className={`text-xs mt-0.5 ${
                totalAlerts > 5
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : totalAlerts > 0
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                {totalAlerts > 0 ? `${totalAlerts} actions requises` : 'Aucune alerte'}
              </Badge>
            </CardContent>
          </Card>

          {/* KPI 4: Valeur Stock */}
          <Card className="h-20 border-black rounded-[10px] shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Valeur Stock</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-2 px-4">
              <div className="text-lg font-bold text-black">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(overview.total_value || 0)}
              </div>
              <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200 mt-0.5">
                HT · Trend ↗
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Section STOCK RÉEL - Border Accent Vert Gauche */}
        <Card className="border-l-4 border-green-500 rounded-[10px] shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Mouvements Effectués
              </Badge>
              <CardTitle className="text-xl text-black">STOCK RÉEL</CardTitle>
            </div>
            <CardDescription>
              Inventaire actuel et mouvements confirmés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Widget 1: Mouvements 7 Jours */}
            <Card className="border-gray-200 rounded-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base">Mouvements 7 Derniers Jours</CardTitle>
                <CardDescription className="text-xs">Activité récente confirmée</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-green-50 rounded-md">
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">Entrées</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-black text-sm">{movements.last_7_days.entries.count} mvts</span>
                      <Badge variant="outline" className="border-green-300 text-green-600 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{movements.last_7_days.entries.quantity} unités
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-red-50 rounded-md">
                        <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm text-gray-700">Sorties</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-black text-sm">{movements.last_7_days.exits.count} mvts</span>
                      <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -{movements.last_7_days.exits.quantity} unités
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-50 rounded-md">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">Ajustements</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-black text-sm">{movements.last_7_days.adjustments.count} corrections</span>
                      <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">
                        {movements.last_7_days.adjustments.quantity >= 0 ? '+' : ''}{movements.last_7_days.adjustments.quantity}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Activité aujourd'hui</span>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-green-600 font-medium">{movements.today.entries} IN</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-red-600 font-medium">{movements.today.exits} OUT</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-blue-600 font-medium">{movements.today.adjustments} ADJ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget 2: Alertes Stock Faible */}
            <Card className="border-gray-200 rounded-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base">Alertes Stock Faible</CardTitle>
                <CardDescription className="text-xs">Produits nécessitant réapprovisionnement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune alerte stock actuellement</p>
                    </div>
                  ) : (
                    <>
                      {lowStockProducts.slice(0, 3).map((product) => (
                        <div key={product.id} className="flex items-start justify-between border-b border-gray-100 pb-2 last:border-0">
                          <div className="flex-1">
                            <Link
                              href={`/produits/catalogue/${product.id}`}
                              className="text-sm font-medium text-black hover:text-blue-600 hover:underline transition-colors"
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5">{product.sku}</p>
                          </div>
                          <div className="text-right flex items-center gap-2 ml-4">
                            <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">
                              {product.stock_quantity} réel
                            </Badge>
                            {Math.abs(product.stock_forecasted_out || 0) > 0 && (
                              <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
                                {Math.abs(product.stock_forecasted_out)} réservé
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/stocks/alertes')}
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs mt-2"
                      >
                        <AlertTriangle className="h-3 w-3 mr-2" />
                        Voir toutes les alertes ({totalAlerts})
                      </ButtonV2>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Widget 3: Derniers Mouvements */}
            <Card className="border-gray-200 rounded-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base">Derniers Mouvements</CardTitle>
                <CardDescription className="text-xs">5 mouvements les plus récents</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMovements.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucun mouvement récent</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentMovements.map((movement) => (
                      <div key={movement.id} className="flex items-start gap-3 border-b border-gray-100 pb-2 last:border-0">
                        <div className={`mt-0.5 p-1.5 rounded-md ${
                          movement.movement_type === 'IN' ? 'bg-green-50' :
                          movement.movement_type === 'OUT' ? 'bg-red-50' : 'bg-blue-50'
                        }`}>
                          {movement.movement_type === 'IN' ? (
                            <ArrowDownToLine className="h-3 w-3 text-green-600" />
                          ) : movement.movement_type === 'OUT' ? (
                            <ArrowUpFromLine className="h-3 w-3 text-red-600" />
                          ) : (
                            <BarChart3 className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/produits/catalogue/${movement.product_id}`}
                            className="font-medium text-black text-sm hover:text-blue-600 hover:underline transition-colors"
                          >
                            {movement.product_name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-xs border-gray-300">
                              {movement.product_sku}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} unités
                            </span>
                            <span className="text-xs text-gray-400">
                              ({movement.quantity_before} → {movement.quantity_after})
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 ml-2 shrink-0">
                          <div>{new Date(movement.performed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                          <div className="text-gray-400">{new Date(movement.performed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))}
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/stocks/mouvements')}
                      className="w-full border-black text-black hover:bg-black hover:text-white mt-2 text-xs transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      Voir tous les mouvements
                    </ButtonV2>
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Section STOCK PRÉVISIONNEL - Border Accent Bleu Gauche */}
        <Card className="border-l-4 border-blue-500 rounded-[10px] shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-300 text-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Commandes En Cours
              </Badge>
              <CardTitle className="text-xl text-black">STOCK PRÉVISIONNEL</CardTitle>
            </div>
            <CardDescription>
              Impact futur des commandes confirmées sur le stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastSummaryWidget
              incomingOrders={incomingOrders}
              outgoingOrders={outgoingOrders}
              totalIn={overview.total_forecasted_in || 0}
              totalOut={Math.abs(overview.total_forecasted_out || 0)}
              onOrderClick={handleOrderClick}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

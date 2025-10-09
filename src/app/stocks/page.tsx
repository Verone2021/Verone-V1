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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStockDashboard } from '@/hooks/use-stock-dashboard'
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

  const totalAlerts = overview.products_out_of_stock + overview.products_below_min

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
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/stocks/mouvements')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir Mouvements
              </Button>
              <Button
                onClick={() => router.push('/stocks/entrees')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Entrée
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Cards - Métriques Professionnelles ERP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: Valeur Stock Totale */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valeur Stock Totale</CardTitle>
              <Euro className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{formatPrice(overview.total_value)}</div>
              <p className="text-xs text-gray-600">
                {overview.total_quantity} unités · {overview.total_products} produits
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: Produits en Stock */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Produits Actifs</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{overview.products_in_stock}</div>
              <p className="text-xs text-gray-600">
                {overview.products_out_of_stock} en rupture de stock
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: Alertes Stock */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alertes Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{totalAlerts}</div>
              <p className="text-xs text-gray-600">
                {overview.products_below_min} sous seuil · {overview.products_out_of_stock} ruptures
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: Mouvements 7 Jours */}
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mouvements 7 Jours</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{movements.total_movements}</div>
              <p className="text-xs text-gray-600">
                {movements.last_7_days.entries.count} entrées · {movements.last_7_days.exits.count} sorties
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités de gestion des stocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/inventaire')}
              >
                <div className="flex flex-col items-center">
                  <Grid3x3 className="h-6 w-6 mb-2" />
                  <span>Inventaire</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/entrees')}
              >
                <div className="flex flex-col items-center">
                  <ArrowDownToLine className="h-6 w-6 mb-2" />
                  <span>Entrées</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/sorties')}
              >
                <div className="flex flex-col items-center">
                  <ArrowUpFromLine className="h-6 w-6 mb-2" />
                  <span>Sorties</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/stocks/alertes')}
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Alertes</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

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
                        <div className="text-right">
                          <Badge variant="outline" className="border-orange-300 text-orange-600">
                            {product.stock_quantity}/{product.min_stock}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/stocks/alertes')}
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Voir toutes les alertes ({totalAlerts})
                      </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/stocks/mouvements')}
                  className="w-full border-black text-black hover:bg-black hover:text-white mt-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir tous les mouvements
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation vers autres modules */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Modules Connexes</CardTitle>
            <CardDescription>Accès rapide aux autres sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/catalogue')}
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  <span>Catalogue Produits</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/fournisseurs')}
              >
                <div className="flex items-center">
                  <ArrowDownToLine className="h-5 w-5 mr-2" />
                  <span>Commandes Fournisseurs</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/clients')}
              >
                <div className="flex items-center">
                  <ArrowUpFromLine className="h-5 w-5 mr-2" />
                  <span>Commandes Clients</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
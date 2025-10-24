"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Filter,
  Search,
  Download,
  Package,
  TrendingDown,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Zap,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { ButtonV2 } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useStockOptimized } from '../../../hooks/use-stock-optimized'
import { useToast } from '../../../hooks/use-toast'

type AlertSeverity = 'critical' | 'warning' | 'info'
type AlertCategory = 'stock' | 'movement' | 'forecast' | 'system'

interface StockAlert {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  productId?: string
  productName?: string
  productSku?: string
  currentStock?: number
  minStock?: number
  reorderPoint?: number
  timestamp: string
  acknowledged: boolean
  action?: {
    label: string
    handler: () => void
  }
}

export default function StockAlertesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    acknowledged: false,
    limit: 100
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set())

  const {
    stockSummary,
    lowStockProducts,
    movements,
    loading,
    error,
    stats,
    refetch
  } = useStockOptimized({ limit: 50 })

  // Générer les alertes à partir des données
  const alerts = useMemo<StockAlert[]>(() => {
    const alertList: StockAlert[] = []

    // Alertes critiques - Ruptures de stock
    const outOfStockProducts = lowStockProducts.filter(p => p.stock_real === 0)
    outOfStockProducts.forEach(product => {
      alertList.push({
        id: `out-of-stock-${product.id}`,
        severity: 'critical',
        category: 'stock',
        title: 'Rupture de stock',
        message: `${product.name} est en rupture de stock`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        currentStock: product.stock_real,
        minStock: product.min_stock,
        timestamp: new Date().toISOString(),
        acknowledged: acknowledgedAlerts.has(`out-of-stock-${product.id}`),
        action: {
          label: 'Commander',
          handler: () => {
            router.push(`/commandes/fournisseurs?product=${product.id}`)
          }
        }
      })
    })

    // Alertes d'avertissement - Stock faible
    const lowStockAlerts = lowStockProducts.filter(p => p.stock_real > 0 && p.stock_real <= p.min_stock)
    lowStockAlerts.forEach(product => {
      alertList.push({
        id: `low-stock-${product.id}`,
        severity: 'warning',
        category: 'stock',
        title: 'Stock faible',
        message: `${product.name} approche du seuil minimum (${product.stock_real}/${product.min_stock})`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        currentStock: product.stock_real,
        minStock: product.min_stock,
        reorderPoint: product.reorder_point,
        timestamp: new Date().toISOString(),
        acknowledged: acknowledgedAlerts.has(`low-stock-${product.id}`),
        action: {
          label: 'Réapprovisionner',
          handler: () => {
            router.push(`/commandes/fournisseurs?product=${product.id}`)
          }
        }
      })
    })

    // Alertes de mouvement - Mouvements inhabituels
    const todayMovements = movements.filter(m =>
      new Date(m.performed_at).toDateString() === new Date().toDateString()
    )

    if (todayMovements.length > 20) {
      alertList.push({
        id: 'high-activity',
        severity: 'info',
        category: 'movement',
        title: 'Activité élevée',
        message: `${todayMovements.length} mouvements de stock aujourd'hui`,
        timestamp: new Date().toISOString(),
        acknowledged: acknowledgedAlerts.has('high-activity')
      })
    }

    // Alertes système - Performance
    const avgMovementTime = 2.1 // Simulé - pourrait venir d'une vraie métrique
    if (avgMovementTime > 2) {
      alertList.push({
        id: 'performance-warning',
        severity: 'warning',
        category: 'system',
        title: 'Performance dégradée',
        message: `Temps de traitement moyen: ${avgMovementTime}s (>2s SLO)`,
        timestamp: new Date().toISOString(),
        acknowledged: acknowledgedAlerts.has('performance-warning')
      })
    }

    // Alertes de prévision - Stock disponible négatif simulé
    const productsWithForecast = lowStockProducts.filter(p => p.stock_real > 0 && p.stock_real < 5)
    productsWithForecast.forEach(product => {
      if (product.stock_real < 3) {
        alertList.push({
          id: `forecast-${product.id}`,
          severity: 'warning',
          category: 'forecast',
          title: 'Prévision stock critique',
          message: `${product.name} risque de rupture prochainement`,
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          currentStock: product.stock_real,
          timestamp: new Date().toISOString(),
          acknowledged: acknowledgedAlerts.has(`forecast-${product.id}`)
        })
      }
    })

    return alertList.sort((a, b) => {
      // Tri par sévérité puis par date
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [lowStockProducts, movements, acknowledgedAlerts, router])

  // Statistiques des alertes
  const alertStats = useMemo(() => {
    const unacknowledged = alerts.filter(a => !a.acknowledged)
    return {
      total: alerts.length,
      unacknowledged: unacknowledged.length,
      critical: unacknowledged.filter(a => a.severity === 'critical').length,
      warning: unacknowledged.filter(a => a.severity === 'warning').length,
      info: unacknowledged.filter(a => a.severity === 'info').length
    }
  }, [alerts])

  // Gestionnaire d'acquittement
  const handleAcknowledge = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]))
    toast({
      title: "Alerte acquittée",
      description: "L'alerte a été marquée comme vue"
    })
  }

  // Acquitter toutes les alertes
  const acknowledgeAll = () => {
    const allAlertIds = alerts.map(a => a.id)
    setAcknowledgedAlerts(new Set(allAlertIds))
    toast({
      title: "Toutes les alertes acquittées",
      description: `${alerts.length} alertes marquées comme vues`
    })
  }

  // Filtres appliqués
  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity && alert.severity !== filters.severity) return false
    if (filters.category && alert.category !== filters.category) return false
    if (filters.acknowledged && !alert.acknowledged) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        alert.title.toLowerCase().includes(search) ||
        alert.message.toLowerCase().includes(search) ||
        alert.productName?.toLowerCase().includes(search) ||
        alert.productSku?.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000) // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval)
  }, [refetch])

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-black" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'border-red-300 text-red-600 bg-red-50'
      case 'warning': return 'border-gray-300 text-black bg-gray-50'
      case 'info': return 'border-blue-300 text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </ButtonV2>
              <div>
                <h1 className="text-3xl font-bold text-black">Alertes Stock</h1>
                <p className="text-gray-600 mt-1">
                  Surveillance temps réel et alertes automatiques
                </p>
              </div>
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
                onClick={acknowledgeAll}
                disabled={alertStats.unacknowledged === 0}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Acquitter tout
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Alertes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Alertes Actives</CardTitle>
              <Bell className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{alertStats.unacknowledged}</div>
              <p className="text-xs text-gray-600">
                sur {alertStats.total} total
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critique</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
              <p className="text-xs text-gray-600">
                action immédiate requise
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avertissement</CardTitle>
              <AlertTriangle className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{alertStats.warning}</div>
              <p className="text-xs text-gray-600">
                surveillance requise
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Information</CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{alertStats.info}</div>
              <p className="text-xs text-gray-600">
                informations système
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtres et recherche
              </span>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                {showFilters ? 'Masquer' : 'Afficher'} filtres
              </ButtonV2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recherche globale */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher alertes, produits, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-black"
                  />
                </div>
              </div>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Sévérité</Label>
                  <Select onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Toutes les sévérités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les sévérités</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="info">Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="movement">Mouvement</SelectItem>
                      <SelectItem value="forecast">Prévision</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>État</Label>
                  <Select onValueChange={(value) => setFilters(prev => ({ ...prev, acknowledged: value === 'true' }))}>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Toutes les alertes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les alertes</SelectItem>
                      <SelectItem value="false">Non acquittées</SelectItem>
                      <SelectItem value="true">Acquittées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <ButtonV2
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        severity: '',
                        category: '',
                        acknowledged: false,
                        limit: 100
                      })
                      setSearchTerm('')
                    }}
                    className="w-full border-black text-black hover:bg-black hover:text-white"
                  >
                    Réinitialiser
                  </ButtonV2>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des alertes */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Alertes ({filteredAlerts.length})</span>
              {loading && (
                <Badge variant="outline" className="border-blue-300 text-blue-600">
                  Actualisation...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Surveillance automatique avec actions recommandées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <ButtonV2 variant="outline" onClick={() => refetch()}>
                  Réessayer
                </ButtonV2>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucune alerte trouvée</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || filters.severity || filters.category
                    ? 'Essayez de modifier vos filtres'
                    : 'Tous les systèmes fonctionnent normalement'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 transition-all ${
                      alert.acknowledged
                        ? 'border-gray-200 bg-gray-50 opacity-75'
                        : `border-l-4 ${getSeverityColor(alert.severity)}`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <h3 className="font-medium text-black">
                            {alert.title}
                          </h3>
                          {alert.productSku && (
                            <Badge variant="outline" className="text-xs">
                              {alert.productSku}
                            </Badge>
                          )}
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            {alert.category}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-3">{alert.message}</p>

                        {(alert.currentStock !== undefined || alert.minStock !== undefined) && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            {alert.currentStock !== undefined && (
                              <div>
                                <span className="font-medium">Stock actuel:</span> {alert.currentStock}
                              </div>
                            )}
                            {alert.minStock !== undefined && (
                              <div>
                                <span className="font-medium">Stock minimum:</span> {alert.minStock}
                              </div>
                            )}
                            {alert.reorderPoint !== undefined && (
                              <div>
                                <span className="font-medium">Point commande:</span> {alert.reorderPoint}
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {alert.action && !alert.acknowledged && (
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={alert.action.handler}
                            className="border-black text-black hover:bg-black hover:text-white"
                          >
                            {alert.action.label}
                          </ButtonV2>
                        )}
                        {!alert.acknowledged && (
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-gray-500 hover:text-black"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </ButtonV2>
                        )}
                        {alert.acknowledged && (
                          <Badge variant="outline" className="border-green-300 text-green-600">
                            Acquittée
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
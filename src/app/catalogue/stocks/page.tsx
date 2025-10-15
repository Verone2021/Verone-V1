'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Package,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Eye,
  History,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  ArrowUpDown,
  X,
  Clock,
  Boxes
} from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useCatalogue } from '@/hooks/use-catalogue'
import { useStock } from '@/hooks/use-stock'
import { StockMovementModal } from '@/components/business/stock-movement-modal'
import { GeneralStockMovementModal } from '@/components/business/general-stock-movement-modal'
import { ProductStockHistoryModal } from '@/components/business/product-stock-history-modal'
import { StockDisplay, StockSummaryCard } from '@/components/business/stock-display'
import { formatPrice } from '@/lib/utils'

interface StockFilters {
  search: string
  status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'forecasted_shortage'
  category: string
  sortBy: 'name' | 'sku' | 'stock_real' | 'stock_available' | 'updated_at'
  sortOrder: 'asc' | 'desc'
}

export default function CatalogueStocksPage() {
  const [filters, setFilters] = useState<StockFilters>({
    search: '',
    status: 'all',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showGeneralMovementModal, setShowGeneralMovementModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { toast } = useToast()
  const { products, loading: productsLoading, loadCatalogueData } = useCatalogue()
  const {
    stockData,
    summary,
    loading: stockLoading,
    fetchAllStock,
    getStockAlerts
  } = useStock()

  // Charger les données au montage
  useEffect(() => {
    loadCatalogueData()
    fetchAllStock()
  }, [])

  // Données enrichies produits + stock
  const enrichedProducts = useMemo(() => {
    if (!products || !stockData) return []

    return products.map(product => {
      const stock = stockData.find(s => s.product_id === product.id)
      return {
        ...product,
        stock_real: stock?.stock_real || 0,
        stock_forecasted_in: stock?.stock_forecasted_in || 0,
        stock_forecasted_out: stock?.stock_forecasted_out || 0,
        stock_available: stock?.stock_available || 0,
        stock_total_forecasted: stock?.stock_total_forecasted || 0,
        last_movement_at: stock?.last_movement_at
      }
    })
  }, [products, stockData])

  // Filtrage et tri des produits
  const filteredProducts = useMemo(() => {
    let filtered = enrichedProducts

    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search)
      )
    }

    // Filtrage par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(product => {
        const minLevel = 5 // Valeur par défaut pour le niveau minimal de stock
        switch (filters.status) {
          case 'out_of_stock':
            return product.stock_real <= 0
          case 'low_stock':
            return product.stock_real > 0 && product.stock_real <= minLevel
          case 'in_stock':
            return product.stock_real > minLevel
          case 'forecasted_shortage':
            return product.stock_available <= minLevel
          default:
            return true
        }
      })
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof typeof a]
      let bValue: any = b[filters.sortBy as keyof typeof b]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [enrichedProducts, filters])

  // Alertes stock
  const stockAlerts = useMemo(() => getStockAlerts(), [getStockAlerts])

  // Handlers
  const handleRefresh = async () => {
    await Promise.all([loadCatalogueData(), fetchAllStock()])
    toast({
      title: "Données actualisées",
      description: "Le stock a été rechargé avec succès"
    })
  }

  const handleMovementSuccess = () => {
    fetchAllStock()
    setSelectedProduct(null)
    setShowMovementModal(false)
  }

  const handleGeneralMovementSuccess = () => {
    fetchAllStock()
    setShowGeneralMovementModal(false)
  }

  const handleShowHistory = (product: any) => {
    setSelectedProductForHistory(product)
    setShowHistoryModal(true)
  }

  const handleCloseHistory = () => {
    setShowHistoryModal(false)
    setSelectedProductForHistory(null)
  }

  const loading = productsLoading || stockLoading

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
          <p className="text-gray-600 mt-1">
            Suivi en temps réel du stock physique et prévisionnel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/historique-mouvements'}
          >
            <History className="h-4 w-4 mr-2" />
            Historique complet
          </ButtonV2>
          <Button
            variant="outline"
            onClick={() => setShowGeneralMovementModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau mouvement
          </ButtonV2>
          <ButtonV2 variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </ButtonV2>
          <ButtonV2 variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </ButtonV2>
        </div>
      </div>

      {/* Cartes de résumé */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StockSummaryCard
            title="Produits en stock"
            value={summary.total_products}
            icon={Package}
            color="blue"
          />
          <StockSummaryCard
            title="Stock physique total"
            value={summary.total_real}
            icon={Boxes}
            color="green"
          />
          <StockSummaryCard
            title="Alertes stock faible"
            value={summary.low_stock_count}
            icon={AlertTriangle}
            color="amber"
          />
          <StockSummaryCard
            title="Ruptures prévues"
            value={summary.forecasted_shortage_count}
            icon={Clock}
            color="red"
          />
        </div>
      )}

      {/* Alertes importantes */}
      {stockAlerts.length > 0 && (
        <Card className="border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="h-5 w-5" />
              Alertes Stock ({stockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stockAlerts.slice(0, 3).map((alert) => (
                <div key={alert.product_id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <span className="font-medium">{alert.product_name}</span>
                    <span className="text-sm text-gray-600 ml-2">({alert.product_sku})</span>
                  </div>
                  <Badge variant={alert.alert_type === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.alert_message}
                  </Badge>
                </div>
              ))}
              {stockAlerts.length > 3 && (
                <p className="text-sm text-gray-900">
                  Et {stockAlerts.length - 3} autre(s) alerte(s)...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="real">Stock Physique</TabsTrigger>
          <TabsTrigger value="forecasted">Stock Prévisionnel</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Rechercher un produit..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full"
                  />
                </div>
                <Select value={filters.status} onValueChange={(value: any) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="in_stock">En stock</SelectItem>
                    <SelectItem value="low_stock">Stock faible</SelectItem>
                    <SelectItem value="out_of_stock">Épuisé</SelectItem>
                    <SelectItem value="forecasted_shortage">Rupture prévue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="sku">SKU</SelectItem>
                    <SelectItem value="stock_real">Stock physique</SelectItem>
                    <SelectItem value="stock_available">Stock disponible</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </ButtonV2>
              </div>
            </CardContent>
          </Card>

          {/* Table produits */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Prévisions</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Chargement des données...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.primary_image_url && (
                              <img
                                src={product.primary_image_url}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                {formatPrice(product.price_ht)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <StockDisplay
                            stock_real={product.stock_real}
                            min_stock={5}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            {product.stock_forecasted_in > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                +{product.stock_forecasted_in}
                              </span>
                            )}
                            {product.stock_forecasted_out > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <TrendingDown className="h-3 w-3" />
                                -{product.stock_forecasted_out}
                              </span>
                            )}
                            {product.stock_forecasted_in === 0 && product.stock_forecasted_out === 0 && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stock_available <= 5
                                ? "destructive"
                                : "default"
                            }
                          >
                            {product.stock_available}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowMovementModal(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Mouvement
                            </ButtonV2>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowHistory(product)}
                            >
                              <History className="h-4 w-4" />
                            </ButtonV2>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="real">
          <Card>
            <CardHeader>
              <CardTitle>Stock Physique</CardTitle>
              <CardDescription>
                Stock réellement présent en entrepôt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Vue détaillée du stock physique en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasted">
          <Card>
            <CardHeader>
              <CardTitle>Stock Prévisionnel</CardTitle>
              <CardDescription>
                Prévisions d'entrées et sorties basées sur les commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Vue prévisionnelle en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
              <CardDescription>
                Tous les mouvements de stock avec traçabilité complète
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Historique des mouvements en cours de développement...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedProduct && (
        <StockMovementModal
          product={selectedProduct}
          isOpen={showMovementModal}
          onClose={() => {
            setShowMovementModal(false)
            setSelectedProduct(null)
          }}
          onSuccess={handleMovementSuccess}
        />
      )}

      <GeneralStockMovementModal
        isOpen={showGeneralMovementModal}
        onClose={() => setShowGeneralMovementModal(false)}
        onSuccess={handleGeneralMovementSuccess}
      />

      <ProductStockHistoryModal
        product={selectedProductForHistory}
        isOpen={showHistoryModal}
        onClose={handleCloseHistory}
      />
    </div>
  )
}
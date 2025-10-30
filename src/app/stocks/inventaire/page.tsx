'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package,
  Search,
  ArrowLeft,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  History,
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink
} from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useStockInventory } from '@/hooks/use-stock-inventory'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { formatPrice } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StockReportsModal } from '@/components/business/stock-reports-modal'

interface ProductHistoryModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
}

function ProductHistoryModal({ product, isOpen, onClose }: ProductHistoryModalProps) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const { getProductHistory, getReasonDescription } = useStockMovements()

  useEffect(() => {
    if (isOpen && product) {
      loadHistory()
    }
  }, [isOpen, product])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const history = await getProductHistory(product.id)
      setMovements(history as any)
    } catch (error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false)
    }
  }

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Entrée',
      OUT: 'Sortie',
      ADJUST: 'Ajustement',
      TRANSFER: 'Transfert'
    }
    return labels[type] || type
  }

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-black text-white',
      OUT: 'bg-gray-700 text-white',
      ADJUST: 'bg-gray-500 text-white',
      TRANSFER: 'bg-gray-400 text-white'
    }
    return colors[type] || 'bg-gray-300 text-black'
  }

  const getSourceInfo = (movement: any) => {
    // Si c'est lié à une commande
    if (movement.reference_type === 'order' && movement.reference_id) {
      return {
        type: 'order',
        label: 'Commande',
        link: `/commandes/${movement.reference_id}`,
        reference: movement.reference_id
      }
    }

    // Si c'est lié à une vente
    if (movement.reference_type === 'sale' && movement.reference_id) {
      return {
        type: 'sale',
        label: 'Vente',
        link: `/commandes/${movement.reference_id}`,
        reference: movement.reference_id
      }
    }

    // Mouvement manuel
    return {
      type: 'manual',
      label: 'Manuel',
      link: null,
      reference: null
    }
  }

  const getPerformerName = (movement: any) => {
    if (movement.user_profiles) {
      const { first_name, last_name } = movement.user_profiles
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim()
      }
    }
    return 'Admin'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-xl font-bold text-black flex items-center gap-3">
            <History className="h-5 w-5" />
            Historique complet - {product?.name}
            <Badge variant="outline" className="ml-2 text-xs font-mono">
              {product?.sku}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
              <p className="text-sm text-gray-400 mt-1">
                Ce produit n'a pas encore d'historique de mouvements
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Header table */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700 sticky top-0">
                <div className="col-span-2">Date & Heure</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1 text-right">Quantité</div>
                <div className="col-span-2 text-center">Stock</div>
                <div className="col-span-2">Motif / Notes</div>
                <div className="col-span-2">Par</div>
                <div className="col-span-2">Source</div>
              </div>

              {/* Timeline entries */}
              <div className="relative">
                {/* Ligne verticale timeline */}
                <div className="absolute left-[16.666%] top-0 bottom-0 w-px bg-gray-200" />

                {movements.map((movement: any, index: number) => {
                  const sourceInfo = getSourceInfo(movement)
                  const performerName = getPerformerName(movement)
                  const reasonLabel = movement.reason_code
                    ? getReasonDescription(movement.reason_code)
                    : '-'

                  return (
                    <div
                      key={movement.id}
                      className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm relative"
                    >
                      {/* Date & Heure */}
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-black font-medium">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          {new Date(movement.performed_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs ml-4">
                          <Clock className="h-3 w-3" />
                          {new Date(movement.performed_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Type */}
                      <div className="col-span-1 flex items-center relative z-10">
                        {/* Dot sur la timeline */}
                        <div className="absolute left-[-8.333%] w-2 h-2 rounded-full bg-black border-2 border-white" />
                        <Badge className={`text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </Badge>
                      </div>

                      {/* Quantité */}
                      <div className="col-span-1 flex items-center justify-end">
                        <span className={`font-bold text-base ${
                          movement.quantity_change > 0 ? 'text-black' : 'text-gray-700'
                        }`}>
                          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                        </span>
                      </div>

                      {/* Stock (avant → après) */}
                      <div className="col-span-2 flex items-center justify-center gap-2 font-mono text-sm">
                        <span className="text-gray-500">{movement.quantity_before}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-black font-bold">{movement.quantity_after}</span>
                      </div>

                      {/* Motif / Notes */}
                      <div className="col-span-2 flex flex-col gap-1">
                        {movement.reason_code && (
                          <span className="text-gray-900 text-xs font-medium">
                            {reasonLabel}
                          </span>
                        )}
                        {movement.notes && (
                          <span className="text-gray-600 text-xs line-clamp-2">
                            {movement.notes}
                          </span>
                        )}
                        {!movement.reason_code && !movement.notes && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>

                      {/* Par (Performer) */}
                      <div className="col-span-2 flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-900 text-xs font-medium truncate">
                          {performerName}
                        </span>
                      </div>

                      {/* Source */}
                      <div className="col-span-2 flex items-center gap-2">
                        {sourceInfo.type === 'manual' ? (
                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                            <FileText className="h-3 w-3 mr-1" />
                            {sourceInfo.label}
                          </Badge>
                        ) : (
                          <Link
                            href={sourceInfo.link || '#'}
                            className="flex items-center gap-1.5 text-black hover:text-gray-700 transition-colors group"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge className="bg-black text-white text-xs group-hover:bg-gray-700 transition-colors">
                              {sourceInfo.label}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-black" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer stats */}
        {movements.length > 0 && (
          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium text-black">
                  {movements.length} mouvement{movements.length > 1 ? 's' : ''}
                </span>
                <span>Stock actuel: <strong className="text-black">{product?.stock_quantity || 0}</strong></span>
              </div>
              <span className="text-gray-500">
                Dernier mouvement: {movements[0] ? new Date((movements[0] as any).performed_at).toLocaleDateString('fr-FR') : 'Aucun'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function InventairePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false)

  const { inventory, stats, loading, fetchInventory, exportInventoryCSV } = useStockInventory()

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Ouvrir automatiquement le modal si query param ?id= présent (venant des notifications)
  useEffect(() => {
    const productId = searchParams.get('id')
    if (productId && inventory.length > 0 && !isHistoryModalOpen) {
      const product = inventory.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
        setIsHistoryModalOpen(true)
      }
    }
  }, [searchParams, inventory, isHistoryModalOpen])

  const handleRefresh = () => {
    fetchInventory(filters)
  }

  const handleExport = () => {
    exportInventoryCSV(inventory)
  }

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleApplyFilters = () => {
    fetchInventory(filters)
  }

  const openHistoryModal = (product: any) => {
    setSelectedProduct(product)
    setIsHistoryModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stocks')}
                className="flex items-center text-gray-600 hover:text-black h-8 px-2"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Retour
              </ButtonV2>
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-black" />
                <div>
                  <h1 className="text-xl font-bold text-black">Inventaire Stock</h1>
                  <p className="text-xs text-gray-600">Vue consolidée des mouvements</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white h-8 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </ButtonV2>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-black text-black hover:bg-black hover:text-white h-8 text-xs"
              >
                <Download className="h-3 w-3 mr-1.5" />
                CSV
              </ButtonV2>
              <ButtonV2
                size="sm"
                className="bg-black hover:bg-gray-800 text-white h-8 text-xs"
                onClick={() => setIsReportsModalOpen(true)}
              >
                <BarChart3 className="h-3 w-3 mr-1.5" />
                Rapports
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Statistiques KPIs - Ultra compact */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Produits Actifs */}
          <Card className="border-black">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Produits Actifs</p>
                  <p className="text-2xl font-bold text-black">{stats.products_with_activity}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    sur {stats.total_products}
                  </p>
                </div>
                <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Mouvements Totaux */}
          <Card className="border-black">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Mouvements</p>
                  <p className="text-2xl font-bold text-black">{stats.total_movements}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    totaux
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Valeur Stock */}
          <Card className="border-black">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Valeur Stock</p>
                  <p className="text-2xl font-bold text-black">
                    {formatPrice(stats.total_stock_value)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    valorisation
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Dernière MAJ */}
          <Card className="border-black">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Dernière MAJ</p>
                  <p className="text-lg font-bold text-black">
                    {new Date().toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres - Inline compact */}
        <div className="bg-white border border-black rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Rechercher produit, SKU..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 border-gray-300 h-9 text-sm"
              />
            </div>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="border-gray-300 w-40 h-9 text-sm"
              placeholder="Date début"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="border-gray-300 w-40 h-9 text-sm"
              placeholder="Date fin"
            />
            <ButtonV2
              onClick={handleApplyFilters}
              size="sm"
              className="bg-black hover:bg-gray-800 text-white h-9 px-4 text-sm"
            >
              Appliquer
            </ButtonV2>
          </div>
        </div>

        {/* Table Inventaire - Dense */}
        <Card className="border-black">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold text-black">
              Inventaire Consolidé ({inventory.length} produits)
            </h2>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun mouvement de stock trouvé</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les produits apparaîtront après leur première entrée ou sortie
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">Produit</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">SKU</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">Entrées</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">Sorties</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">Ajust.</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">Stock</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">Dernière MAJ</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {item.product_image_url && (
                              <Image
                                src={item.product_image_url}
                                alt={item.name}
                                width={32}
                                height={32}
                                className="rounded object-cover border border-gray-200"
                              />
                            )}
                            <Link
                              href={`/catalogue/${item.id}`}
                              className="font-medium text-black hover:text-gray-700 hover:underline transition-colors text-sm"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-gray-500 font-mono text-xs">{item.sku}</span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-3 w-3 text-black" />
                            <span className="font-medium text-black text-sm">+{item.total_in}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingDown className="h-3 w-3 text-gray-600" />
                            <span className="font-medium text-gray-700 text-sm">-{item.total_out}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.total_adjustments !== 0 ? (
                              <>
                                {item.total_adjustments > 0 ? (
                                  <TrendingUp className="h-3 w-3 text-gray-500" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-gray-500" />
                                )}
                                <span className="font-medium text-gray-700 text-sm">
                                  {item.total_adjustments > 0 ? '+' : ''}{item.total_adjustments}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-bold text-black text-base">{item.stock_quantity}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-xs text-gray-600">
                            {item.last_movement_at
                              ? new Date(item.last_movement_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => openHistoryModal(item)}
                            title="Voir historique détaillé"
                            className="h-7 w-7 p-0 hover:bg-black hover:text-white transition-colors"
                          >
                            <History className="h-3 w-3" />
                          </ButtonV2>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer stats - Compact */}
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <p>
            <span className="font-medium text-black">{inventory.length}</span> produit(s) avec mouvements
          </p>
          <p className="text-gray-500">
            {stats.total_movements} mouvements totaux
          </p>
        </div>
      </div>

      {/* Modal Historique - Professionnel */}
      <ProductHistoryModal
        product={selectedProduct}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Modal Rapports - Catalogue complet */}
      <StockReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Eye, Edit, Trash2, Ban, Package, Truck, CheckCircle, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePurchaseOrders, PurchaseOrder, PurchaseOrderStatus } from '@/hooks/use-purchase-orders'
import { useOrganisations } from '@/hooks/use-organisations'
import { PurchaseOrderFormModal } from '@/components/business/purchase-order-form-modal'
import { PurchaseOrderReceptionModal } from '@/components/business/purchase-order-reception-modal'
import { UniversalOrderDetailsModal } from '@/components/business/universal-order-details-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { getOrganisationDisplayName } from '@/lib/utils/organisation-helpers'

// ✅ Type Safety: Interface ProductImage stricte
interface ProductImage {
  id?: string
  public_url: string
  is_primary: boolean
  display_order?: number
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  confirmed: 'Confirmée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée'
}

const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-gray-100 text-gray-900',
  partially_received: 'bg-gray-100 text-gray-900',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

type SortColumn = 'date' | 'supplier' | 'amount' | null
type SortDirection = 'asc' | 'desc'

export default function PurchaseOrdersPage() {
  const {
    loading,
    orders,
    stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder
  } = usePurchaseOrders()

  const { organisations: suppliers } = useOrganisations({ type: 'supplier' })
  const searchParams = useSearchParams()

  // États filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'all'>('all')
  const [supplierFilter, setSuppliersFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all')

  // États tri
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // États modals
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [orderDetailEditMode, setOrderDetailEditMode] = useState(false) // Mode lecture/édition du modal
  const [showReceptionModal, setShowReceptionModal] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [fetchOrders, fetchStats])

  // ✅ Auto-open modal from notification URL (?id=xxx)
  useEffect(() => {
    const orderId = searchParams.get('id')
    if (orderId && orders.length > 0 && !showOrderDetail) {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        setSelectedOrder(order)
        setShowOrderDetail(true)
      }
    }
  }, [searchParams, orders, showOrderDetail])

  // ✅ Compteurs onglets
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      draft: orders.filter(o => o.status === 'draft').length,
      sent: orders.filter(o => o.status === 'sent').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      partially_received: orders.filter(o => o.status === 'partially_received').length,
      received: orders.filter(o => o.status === 'received').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }
  }, [orders])

  // ✅ Filtrage + Tri
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Filtre onglet
      if (activeTab !== 'all' && order.status !== activeTab) return false

      // Filtre recherche
      const matchesSearch = searchTerm === '' ||
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.organisations ? getOrganisationDisplayName(order.organisations) : '').toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false

      // Filtre fournisseur
      if (supplierFilter !== 'all' && order.supplier_id !== supplierFilter) return false

      // Filtre période
      if (periodFilter !== 'all') {
        const orderDate = new Date(order.created_at)
        const now = new Date()

        switch (periodFilter) {
          case 'month':
            // Ce mois
            if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) {
              return false
            }
            break
          case 'quarter':
            // Ce trimestre
            const currentQuarter = Math.floor(now.getMonth() / 3)
            const orderQuarter = Math.floor(orderDate.getMonth() / 3)
            if (orderQuarter !== currentQuarter || orderDate.getFullYear() !== now.getFullYear()) {
              return false
            }
            break
          case 'year':
            // Cette année
            if (orderDate.getFullYear() !== now.getFullYear()) {
              return false
            }
            break
        }
      }

      return true
    })

    // Tri
    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0
        switch (sortColumn) {
          case 'date':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            break
          case 'supplier':
            const nameA = a.organisations ? getOrganisationDisplayName(a.organisations) : ''
            const nameB = b.organisations ? getOrganisationDisplayName(b.organisations) : ''
            comparison = nameA.localeCompare(nameB)
            break
          case 'amount':
            comparison = (a.total_ttc || 0) - (b.total_ttc || 0)
            break
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [orders, activeTab, searchTerm, supplierFilter, periodFilter, sortColumn, sortDirection])

  // ✅ KPI dynamiques sur commandes filtrées
  const filteredStats = useMemo(() => {
    const stats = filteredOrders.reduce((acc, order) => {
      acc.total_orders++
      acc.total_ht += order.total_ht || 0
      acc.total_ttc += order.total_ttc || 0

      if (['draft', 'sent', 'confirmed', 'partially_received'].includes(order.status)) {
        acc.pending_orders++
      }
      if (order.status === 'received') {
        acc.received_orders++
      }
      if (order.status === 'cancelled') {
        acc.cancelled_orders++
      }

      return acc
    }, {
      total_orders: 0,
      total_ht: 0,
      total_ttc: 0,
      total_tva: 0,
      pending_orders: 0,
      received_orders: 0,
      cancelled_orders: 0
    })

    // Calculer TVA (identique ventes)
    stats.total_tva = stats.total_ttc - stats.total_ht

    return stats
  }, [filteredOrders])

  // ✅ Fonction tri
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // ✅ Icône tri
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-2 inline opacity-30" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-2 inline" />
      : <ArrowDown className="h-4 w-4 ml-2 inline" />
  }

  const handleStatusChange = async (orderId: string, newStatus: PurchaseOrderStatus) => {
    try {
      await updateStatus(orderId, newStatus)
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await deleteOrder(orderId)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleCancel = async (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      try {
        await handleStatusChange(orderId, 'cancelled')
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error)
      }
    }
  }

  // Mode LECTURE (bouton Œil)
  const openOrderView = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setOrderDetailEditMode(false) // Mode lecture seule
    setShowOrderDetail(true)
  }

  // Mode ÉDITION (bouton Modifier)
  const openOrderEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setOrderDetailEditMode(true) // Mode édition
    setShowOrderDetail(true)
  }

  const openReceptionModal = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowReceptionModal(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes Fournisseurs</h1>
          <p className="text-gray-600 mt-1">Gestion des commandes et approvisionnements</p>
        </div>
        <PurchaseOrderFormModal onSuccess={() => fetchOrders()} />
      </div>

      {/* ✅ KPI Dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.total_orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(filteredStats.total_ttc)}</div>
            <div className="text-xs text-gray-500 mt-1">
              <div>HT: {formatCurrency(filteredStats.total_ht)}</div>
              <div>TVA: {formatCurrency(filteredStats.total_tva)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{filteredStats.pending_orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reçues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filteredStats.received_orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Annulées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{filteredStats.cancelled_orders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets Statuts + Filtres (groupés dans une Card unique) */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Onglets Statuts */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PurchaseOrderStatus | 'all')}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">Toutes ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="draft">Brouillon ({tabCounts.draft})</TabsTrigger>
              <TabsTrigger value="sent">Envoyée ({tabCounts.sent})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmée ({tabCounts.confirmed})</TabsTrigger>
              <TabsTrigger value="partially_received">Part. reçue ({tabCounts.partially_received})</TabsTrigger>
              <TabsTrigger value="received">Reçue ({tabCounts.received})</TabsTrigger>
              <TabsTrigger value="cancelled">Annulée ({tabCounts.cancelled})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filtres complémentaires */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro de commande ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={supplierFilter} onValueChange={setSuppliersFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {getOrganisationDisplayName(supplier)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={(value: 'all' | 'month' | 'quarter' | 'year') => setPeriodFilter(value)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes Fournisseurs</CardTitle>
          <CardDescription>
            {filteredOrders.length} commande(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('supplier')}
                    >
                      Fournisseur {renderSortIcon('supplier')}
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      Date création {renderSortIcon('date')}
                    </TableHead>
                    <TableHead>Date livraison</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('amount')}
                    >
                      Montant TTC {renderSortIcon('amount')}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.po_number}
                      </TableCell>
                      <TableCell>
                        {order.organisations ? getOrganisationDisplayName(order.organisations) : 'Non défini'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'Non définie'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(order.total_ttc)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Voir */}
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </ButtonV2>

                          {/* Modifier (draft uniquement) */}
                          {order.status === 'draft' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => openOrderDetail(order)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </ButtonV2>
                          )}

                          {/* Dévalider (confirmed uniquement) */}
                          {order.status === 'confirmed' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'draft')}
                              title="Dévalider pour modifier"
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </ButtonV2>
                          )}

                          {/* Valider (draft uniquement) */}
                          {order.status === 'draft' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'confirmed')}
                              title="Valider"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </ButtonV2>
                          )}

                          {/* Réceptionner (confirmed uniquement) */}
                          {order.status === 'confirmed' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => openReceptionModal(order)}
                              title="Réceptionner la commande"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Truck className="h-4 w-4" />
                            </ButtonV2>
                          )}

                          {/* Annuler (draft ou confirmed) */}
                          {(order.status === 'draft' || order.status === 'confirmed') && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(order.id)}
                              title="Annuler la commande"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Ban className="h-4 w-4" />
                            </ButtonV2>
                          )}

                          {/* Supprimer (cancelled uniquement) */}
                          {order.status === 'cancelled' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(order.id)}
                              title="Supprimer"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </ButtonV2>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Modal Détail Commande - NOUVEAU FORMAT 2 COLONNES (aligné avec ventes) */}
      <UniversalOrderDetailsModal
        orderId={selectedOrder?.id || ''}
        orderType="purchase"
        open={showOrderDetail}
        onClose={() => {
          setShowOrderDetail(false)
          setSelectedOrder(null)
        }}
        onUpdate={() => {
          fetchOrders()
        }}
        initialEditMode={false}
      />

      {/* Modal de réception */}
      {selectedOrder && (
        <PurchaseOrderReceptionModal
          order={selectedOrder}
          open={showReceptionModal}
          onClose={() => {
            setShowReceptionModal(false)
            setSelectedOrder(null)
          }}
          onSuccess={() => {
            fetchOrders()
            setShowReceptionModal(false)
            setSelectedOrder(null)
          }}
        />
      )}
    </div>
  )
}

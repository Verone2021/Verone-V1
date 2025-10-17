'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Eye, Edit, Trash2, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePurchaseOrders, PurchaseOrder, PurchaseOrderStatus } from '@/hooks/use-purchase-orders'
import { useOrganisations } from '@/hooks/use-organisations'
import { PurchaseOrderFormModal } from '@/components/business/purchase-order-form-modal'
import { PurchaseOrderReceptionModal } from '@/components/business/purchase-order-reception-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

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

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [supplierFilter, setSuppliersFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [showReceptionModal, setShowReceptionModal] = useState(false)

  useEffect(() => {
    const filters = {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(supplierFilter !== 'all' && { supplier_id: supplierFilter }),
      ...(searchTerm && { po_number: searchTerm })
    }
    fetchOrders(filters)
    fetchStats(filters)
  }, [fetchOrders, fetchStats, statusFilter, supplierFilter, searchTerm])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.organisations?.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

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

  const openOrderDetail = (order: PurchaseOrder) => {
    setSelectedOrder(order)
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

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Valeur totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_value)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{stats.pending_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Reçues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.received_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Annulées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled_orders}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PurchaseOrderStatus | 'all')}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="partially_received">Partiellement reçue</SelectItem>
                <SelectItem value="received">Reçue</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSuppliersFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
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
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Date livraison</TableHead>
                    <TableHead>Montant HT</TableHead>
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
                        {order.organisations?.name || 'Non défini'}
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
                        {formatCurrency(order.total_ht)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </ButtonV2>
                          {order.status === 'draft' && (
                            <>
                              <ButtonV2 variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </ButtonV2>
                              <ButtonV2
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </ButtonV2>
                            </>
                          )}
                          {order.status === 'sent' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </ButtonV2>
                          )}
                          {(order.status === 'confirmed' || order.status === 'partially_received') && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => openReceptionModal(order)}
                              title="Réceptionner la commande"
                            >
                              <Truck className="h-4 w-4" />
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

      {/* Modal Détail Commande */}
      <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail Commande {selectedOrder?.po_number}</DialogTitle>
            <DialogDescription>
              Informations détaillées et gestion de la réception
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Informations</TabsTrigger>
                <TabsTrigger value="items">Articles</TabsTrigger>
                <TabsTrigger value="reception">Réception</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Informations générales</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Numéro:</span> {selectedOrder.po_number}</p>
                      <p><span className="font-medium">Fournisseur:</span> {selectedOrder.organisations?.name}</p>
                      <p><span className="font-medium">Statut:</span>
                        <Badge className={`ml-2 ${statusColors[selectedOrder.status]}`}>
                          {statusLabels[selectedOrder.status]}
                        </Badge>
                      </p>
                      <p><span className="font-medium">Date création:</span> {formatDate(selectedOrder.created_at)}</p>
                      <p><span className="font-medium">Date livraison prévue:</span> {selectedOrder.expected_delivery_date ? formatDate(selectedOrder.expected_delivery_date) : 'Non définie'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Montants</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Total HT:</span> {formatCurrency(selectedOrder.total_ht)}</p>
                      <p><span className="font-medium">TVA ({(selectedOrder.tax_rate * 100).toFixed(1)}%):</span> {formatCurrency((selectedOrder.total_ttc || 0) - selectedOrder.total_ht)}</p>
                      <p><span className="font-medium">Total TTC:</span> {formatCurrency(selectedOrder.total_ttc || 0)}</p>
                      <p><span className="font-medium">Devise:</span> {selectedOrder.currency}</p>
                    </div>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Notes</h3>
                    <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Remise</TableHead>
                        <TableHead>Total HT</TableHead>
                        <TableHead>Reçu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.purchase_order_items?.map((item) => {
                        // ✅ BR-TECH-002: Récupérer image via product_images (colonne primary_image_url supprimée)
                        const productImages = item.products?.product_images as ProductImage[] | undefined
                        const primaryImageUrl = productImages?.find(img => img.is_primary)?.public_url ||
                                               productImages?.[0]?.public_url ||
                                               null

                        return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {primaryImageUrl && (
                                <img
                                  src={primaryImageUrl}
                                  alt={item.products.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.products?.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.products?.sku}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price_ht)}</TableCell>
                          <TableCell>{item.discount_percentage}%</TableCell>
                          <TableCell>{formatCurrency(item.total_ht)}</TableCell>
                          <TableCell>
                            <span className={item.quantity_received >= item.quantity ? 'text-green-600' : 'text-black'}>
                              {item.quantity_received}/{item.quantity}
                            </span>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="reception" className="space-y-4">
                <div className="text-center py-8">
                  <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Cliquez sur le bouton camion dans la liste des commandes</p>
                  <p className="text-sm text-gray-400">Pour réceptionner une commande confirmée ou partiellement reçue</p>
                  <ButtonV2
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setShowOrderDetail(false)
                      setShowReceptionModal(true)
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Ouvrir le module de réception
                  </ButtonV2>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

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
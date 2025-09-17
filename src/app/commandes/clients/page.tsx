'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Eye, Edit, Trash2, ShoppingCart, Truck, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSalesOrders, SalesOrder, SalesOrderStatus } from '@/hooks/use-sales-orders'
import { useOrganisations } from '@/hooks/use-organisations'
import { SalesOrderFormModal } from '@/components/business/sales-order-form-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const statusLabels: Record<SalesOrderStatus, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée'
}

const statusColors: Record<SalesOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-orange-100 text-orange-800',
  shipped: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

export default function SalesOrdersPage() {
  const {
    loading,
    orders,
    stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder
  } = useSalesOrders()

  const { organisations: customers } = useOrganisations({ type: 'customer' })

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)

  useEffect(() => {
    const filters = {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(customerFilter !== 'all' && { customer_id: customerFilter }),
      ...(searchTerm && { order_number: searchTerm })
    }
    fetchOrders(filters)
    fetchStats(filters)
  }, [fetchOrders, fetchStats, statusFilter, customerFilter, searchTerm])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.organisations?.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleStatusChange = async (orderId: string, newStatus: SalesOrderStatus) => {
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

  const openOrderDetail = (order: SalesOrder) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes Clients</h1>
          <p className="text-gray-600 mt-1">Gestion des commandes et expéditions clients</p>
        </div>
        <SalesOrderFormModal onSuccess={() => fetchOrders()} />
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <CardTitle className="text-sm font-medium text-gray-600">Chiffre d'affaires</CardTitle>
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
              <div className="text-2xl font-bold text-blue-600">{stats.pending_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Expédiées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.shipped_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Livrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered_orders}</div>
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
                  placeholder="Rechercher par numéro de commande ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SalesOrderStatus | 'all')}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="partially_shipped">Partiellement expédiée</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
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
          <CardTitle>Commandes Clients</CardTitle>
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
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
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
                        {order.order_number}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'draft' && (
                            <>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {order.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(order.status === 'confirmed' || order.status === 'partially_shipped') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openOrderDetail(order)}
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
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
            <DialogTitle>Détail Commande {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Informations détaillées et gestion de l'expédition
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Informations</TabsTrigger>
                <TabsTrigger value="items">Articles</TabsTrigger>
                <TabsTrigger value="shipping">Expédition</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Informations générales</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Numéro:</span> {selectedOrder.order_number}</p>
                      <p><span className="font-medium">Client:</span> {selectedOrder.organisations?.name}</p>
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
                        <TableHead>Expédié</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.sales_order_items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.products?.primary_image_url && (
                                <img
                                  src={item.products.primary_image_url}
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
                            <span className={item.quantity_shipped >= item.quantity ? 'text-green-600' : 'text-orange-600'}>
                              {item.quantity_shipped}/{item.quantity}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-4">
                <div className="text-center py-8">
                  <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Module d'expédition en cours de développement</p>
                  <p className="text-sm text-gray-400">Cette fonctionnalité permettra de gérer l'expédition partielle ou totale des commandes</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
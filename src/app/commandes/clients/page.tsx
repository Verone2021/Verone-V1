'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Eye, Edit, Trash2, ShoppingCart, Truck, CheckCircle, XCircle, DollarSign, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalesOrders, SalesOrder, SalesOrderStatus, PaymentStatus } from '@/hooks/use-sales-orders'
import { useOrganisations } from '@/hooks/use-organisations'
import { SalesOrderFormModal } from '@/components/business/sales-order-form-modal'
import { OrderDetailModal } from '@/components/business/order-detail-modal'
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
  partially_shipped: 'bg-gray-100 text-gray-900',
  shipped: 'bg-gray-100 text-gray-900',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Payé',
  refunded: 'Remboursé',
  overdue: 'En retard'
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800'
}

export default function SalesOrdersPage() {
  const {
    loading,
    orders,
    stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder,
    markAsPaid
  } = useSalesOrders()

  const { organisations: customers } = useOrganisations({ type: 'customer' })

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
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
      order.organisations?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.individual_customers?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.individual_customers?.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtre workflow métier
    let matchesWorkflow = true
    if (workflowFilter !== 'all') {
      switch (workflowFilter) {
        case 'awaiting_validation':
          matchesWorkflow = order.status === 'draft'
          break
        case 'awaiting_payment':
          matchesWorkflow = order.status === 'confirmed' &&
            (order.payment_status === 'pending' || order.payment_status === 'partial')
          break
        case 'to_process':
          matchesWorkflow = order.status === 'confirmed' &&
            order.payment_status === 'paid' &&
            !order.shipped_at
          break
        case 'shipped':
          matchesWorkflow = order.status === 'shipped' || order.status === 'partially_shipped'
          break
        case 'delivered':
          matchesWorkflow = order.status === 'delivered'
          break
      }
    }

    return matchesSearch && matchesWorkflow
  })

  const handleStatusChange = async (orderId: string, newStatus: SalesOrderStatus) => {
    try {
      await updateStatus(orderId, newStatus)
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    }
  }

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      await markAsPaid(orderId)
    } catch (error) {
      console.error('Erreur lors du marquage comme payé:', error)
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
              <div className="text-2xl font-bold text-gray-700">{stats.shipped_orders}</div>
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
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Vue rapide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les commandes</SelectItem>
                <SelectItem value="awaiting_validation">En attente de validation</SelectItem>
                <SelectItem value="awaiting_payment">En attente de paiement</SelectItem>
                <SelectItem value="to_process">À traiter</SelectItem>
                <SelectItem value="shipped">Expédiées</SelectItem>
                <SelectItem value="delivered">Livrées</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Statut Paiement</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Date livraison</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const customerName = order.customer_type === 'organization'
                      ? order.organisations?.name
                      : `${order.individual_customers?.first_name} ${order.individual_customers?.last_name}`

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customerName || 'Non défini'}</div>
                            <div className="text-xs text-gray-500">
                              {order.customer_type === 'organization' ? 'Professionnel' : 'Particulier'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.payment_status && (
                            <Badge className={paymentStatusColors[order.payment_status]}>
                              {paymentStatusLabels[order.payment_status]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'Non définie'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(order.total_ttc || order.total_ht)}</div>
                            {order.payment_status === 'paid' && order.paid_amount && (
                              <div className="text-xs text-green-600">Payé</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openOrderDetail(order)}
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Bouton Confirmer (draft uniquement) */}
                            {order.status === 'draft' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(order.id, 'confirmed')}
                                  title="Confirmer commande"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(order.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}

                            {/* Bouton Marquer comme payé (confirmée + en attente de paiement) */}
                            {order.status === 'confirmed' &&
                             (order.payment_status === 'pending' || order.payment_status === 'partial') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(order.id)}
                                title="Marquer comme payé"
                                className="text-green-600"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Bouton Expédier (confirmée + payée) */}
                            {order.status === 'confirmed' && order.payment_status === 'paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openOrderDetail(order)}
                                title="Gérer expédition"
                              >
                                <Truck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Détail Commande */}
      <OrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={() => setShowOrderDetail(false)}
        onUpdate={() => {
          fetchOrders()
          fetchStats()
        }}
      />
    </div>
  )
}
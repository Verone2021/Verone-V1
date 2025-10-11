'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, Calendar, AlertTriangle, Eye, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSalesOrders, SalesOrder } from '@/hooks/use-sales-orders'
import { OrderDetailModal } from '@/components/business/order-detail-modal'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ShipmentsPage() {
  const {
    loading,
    orders,
    fetchOrders
  } = useSalesOrders()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)

  // Filtrer uniquement les commandes prêtes à expédier
  useEffect(() => {
    fetchOrders({
      status: 'confirmed',
      payment_status: 'paid'
    })
  }, [fetchOrders])

  // Filtrer les commandes non encore expédiées
  const readyToShipOrders = orders.filter(order =>
    order.status === 'confirmed' &&
    order.payment_status === 'paid' &&
    !order.shipped_at
  )

  // Filtrer selon la recherche
  const filteredOrders = readyToShipOrders.filter(order => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.organisations?.name.toLowerCase().includes(searchLower) ||
      order.individual_customers?.first_name.toLowerCase().includes(searchLower) ||
      order.individual_customers?.last_name.toLowerCase().includes(searchLower)
    )
  })

  // Statistiques
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueOrders = filteredOrders.filter(order => {
    if (!order.expected_delivery_date) return false
    const deliveryDate = new Date(order.expected_delivery_date)
    return deliveryDate < today
  })

  const urgentOrders = filteredOrders.filter(order => {
    if (!order.expected_delivery_date) return false
    const deliveryDate = new Date(order.expected_delivery_date)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)
    return deliveryDate <= threeDaysFromNow && deliveryDate >= today
  })

  const openOrderDetail = (order: SalesOrder) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }

  const getCustomerName = (order: SalesOrder) => {
    if (order.customer_type === 'organization' && order.organisations) {
      return order.organisations.name
    } else if (order.customer_type === 'individual' && order.individual_customers) {
      const customer = order.individual_customers
      return `${customer.first_name} ${customer.last_name}`
    }
    return 'Client inconnu'
  }

  const getDeliveryUrgency = (order: SalesOrder) => {
    if (!order.expected_delivery_date) return null
    const deliveryDate = new Date(order.expected_delivery_date)

    if (deliveryDate < today) {
      return { label: 'En retard', color: 'bg-red-100 text-red-800' }
    }

    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)

    if (deliveryDate <= threeDaysFromNow) {
      return { label: 'Urgent', color: 'bg-orange-100 text-orange-800' }
    }

    return null
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expéditions & Livraisons</h1>
          <p className="text-gray-600 mt-1">Gérer les commandes prêtes à être expédiées</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En attente d'expédition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-gray-500 mt-1">Validées et payées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{urgentOrders.length}</div>
            <p className="text-xs text-gray-500 mt-1">Livraison ≤ 3 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En retard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueOrders.length}</div>
            <p className="text-xs text-gray-500 mt-1">Date dépassée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Valeur totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total_ttc || 0), 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">À expédier</p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par numéro de commande ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes à expédier */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes à Expédier</CardTitle>
          <CardDescription>
            {filteredOrders.length} commande(s) prête(s) pour expédition
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
              <p className="text-gray-500">Aucune commande en attente d'expédition</p>
              <p className="text-sm text-gray-400 mt-2">
                Les commandes validées et payées apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Livraison prévue</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Urgence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const urgency = getDeliveryUrgency(order)

                    return (
                      <TableRow key={order.id} className={urgency?.label === 'En retard' ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getCustomerName(order)}</div>
                            <div className="text-xs text-gray-500">
                              {order.customer_type === 'organization' ? 'Professionnel' : 'Particulier'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'Non définie'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(order.total_ttc || order.total_ht)}</div>
                        </TableCell>
                        <TableCell>
                          {urgency && (
                            <Badge className={urgency.color}>
                              {urgency.label === 'En retard' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {urgency.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                            title="Gérer l'expédition"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Expédier
                          </Button>
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

      {/* Modal Détail Commande avec gestion expédition */}
      <OrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={() => setShowOrderDetail(false)}
        onUpdate={() => {
          fetchOrders({
            status: 'confirmed',
            payment_status: 'paid'
          })
        }}
      />
    </div>
  )
}

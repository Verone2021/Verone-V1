'use client'

/**
 * 📦 Page Expéditions Ventes (Sales Orders)
 *
 * Vue d'ensemble et gestion des expéditions
 * - Dashboard stats (pending, partial, overdue, urgent)
 * - Liste SOs confirmés/partiellement expédiés
 * - Filtres intelligents (urgent, en retard)
 * - Expédition inline via modal
 */

import { useState, useEffect } from 'react'
import { Package, Truck, AlertTriangle, Clock, Filter, Search, TrendingUp, CheckCircle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalesShipments } from '@/hooks/use-sales-shipments'
import { SalesOrderShipmentModal } from '@/components/business/sales-order-shipment-modal'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ExpeditionsPage() {
  const {
    loading,
    error,
    loadShipmentStats,
    loadSalesOrdersReadyForShipment
  } = useSalesShipments()

  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showShipmentModal, setShowShipmentModal] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')

  // Charger stats
  useEffect(() => {
    loadShipmentStats().then(setStats)
  }, [loadShipmentStats])

  // Charger liste SOs
  useEffect(() => {
    const filters: any = {}

    if (statusFilter !== 'all') {
      filters.status = statusFilter
    }

    if (searchTerm) {
      filters.search = searchTerm
    }

    if (urgencyFilter === 'urgent') {
      filters.urgent_only = true
    } else if (urgencyFilter === 'overdue') {
      filters.overdue_only = true
    }

    loadSalesOrdersReadyForShipment(filters).then(setOrders)
  }, [loadSalesOrdersReadyForShipment, statusFilter, searchTerm, urgencyFilter])

  const handleOpenShipment = (order: any) => {
    setSelectedOrder(order)
    setShowShipmentModal(true)
  }

  const handleShipmentSuccess = () => {
    // Recharger stats et liste
    loadShipmentStats().then(setStats)
    loadSalesOrdersReadyForShipment().then(setOrders)
    setShowShipmentModal(false)
    setSelectedOrder(null)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expéditions Clients</h1>
        <p className="text-gray-600 mt-1">Gestion des expéditions commandes clients</p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">En attente</CardTitle>
                <Package className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total_pending}</div>
              <p className="text-xs text-gray-500 mt-1">Commandes confirmées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Partielles</CardTitle>
                <TrendingUp className="h-4 w-4 text-verone-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-warning">{stats.total_partial}</div>
              <p className="text-xs text-gray-500 mt-1">Expéditions incomplètes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Aujourd'hui</CardTitle>
                <CheckCircle className="h-4 w-4 text-verone-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-success">{stats.total_completed_today}</div>
              <p className="text-xs text-gray-500 mt-1">Expéditions complètes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">En retard</CardTitle>
                <AlertTriangle className="h-4 w-4 text-verone-danger" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-danger">{stats.total_overdue}</div>
              <p className="text-xs text-gray-500 mt-1">Date dépassée</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
                <Clock className="h-4 w-4 text-verone-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-warning">{stats.total_urgent}</div>
              <p className="text-xs text-gray-500 mt-1">Sous 3 jours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="partially_shipped">Partielle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="urgent">Urgent (&lt; 3j)</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes à expédier</CardTitle>
          <CardDescription>
            {orders.length} commande(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Erreur: {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune commande à expédier</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date livraison</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    // Calculer progression
                    const totalItems = order.sales_order_items?.reduce(
                      (sum: number, item: any) => sum + item.quantity,
                      0
                    ) || 0
                    const shippedItems = order.sales_order_items?.reduce(
                      (sum: number, item: any) => sum + (item.quantity_shipped || 0),
                      0
                    ) || 0
                    const progressPercent = totalItems > 0
                      ? Math.round((shippedItems / totalItems) * 100)
                      : 0

                    // Urgence
                    const deliveryDate = order.expected_delivery_date
                      ? new Date(order.expected_delivery_date)
                      : null
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isOverdue = deliveryDate && deliveryDate < today
                    const daysUntil = deliveryDate
                      ? Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      : null
                    const isUrgent = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                          {isOverdue && (
                            <Badge variant="danger" className="ml-2 text-xs">
                              En retard
                            </Badge>
                          )}
                          {isUrgent && !isOverdue && (
                            <Badge className="ml-2 text-xs bg-verone-warning">
                              Urgent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.customer_name || 'Client inconnu'}
                        </TableCell>
                        <TableCell>
                          <Badge className={order.status === 'confirmed' ? 'bg-gray-100 text-gray-900' : 'bg-verone-warning text-white'}>
                            {order.status === 'confirmed' ? 'Confirmée' : 'Partielle'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'Non définie'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-verone-success h-2 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {progressPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ButtonV2
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenShipment(order)}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Expédier
                          </ButtonV2>
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

      {/* Modal d'expédition */}
      {selectedOrder && (
        <SalesOrderShipmentModal
          order={selectedOrder}
          open={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false)
            setSelectedOrder(null)
          }}
          onSuccess={handleShipmentSuccess}
        />
      )}
    </div>
  )
}

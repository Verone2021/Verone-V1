'use client'

import { useState } from 'react'
import { X, Package, CreditCard, Truck, Calendar, User, MapPin, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SalesOrder, useSalesOrders } from '@/hooks/use-sales-orders'
import { formatCurrency } from '@/lib/utils'
import { ShippingManagerModal } from './shipping-manager-modal'

interface OrderDetailModalProps {
  order: SalesOrder | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
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

const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Validée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée'
}

const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

export function OrderDetailModal({ order, open, onClose, onUpdate }: OrderDetailModalProps) {
  const [showShippingModal, setShowShippingModal] = useState(false)
  const { markAsPaid } = useSalesOrders()

  if (!order) return null

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getCustomerName = () => {
    if (order.customer_type === 'organization' && order.organisations) {
      return order.organisations.name
    } else if (order.customer_type === 'individual' && order.individual_customers) {
      const customer = order.individual_customers
      return `${customer.first_name} ${customer.last_name}`
    }
    return 'Client inconnu'
  }

  const getCustomerType = () => {
    return order.customer_type === 'organization' ? 'Professionnel' : 'Particulier'
  }

  const handleMarkAsPaid = async () => {
    await markAsPaid(order.id)
    onUpdate?.()
  }

  const canMarkAsPaid = order.status === 'confirmed' &&
    (order.payment_status === 'pending' || order.payment_status === 'partial')

  const canShip = order.status === 'confirmed' &&
    order.payment_status === 'paid' &&
    !order.shipped_at

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">
                Commande {order.order_number}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

            {/* COLONNE 1 : Informations + Produits */}
            <div className="space-y-6">

              {/* Informations Client */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{getCustomerName()}</p>
                    <Badge variant="secondary" className="mt-1">
                      {getCustomerType()}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Statut commande</p>
                      <Badge className={`mt-1 ${orderStatusColors[order.status]}`}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut paiement</p>
                      {order.payment_status && (
                        <Badge className={`mt-1 ${paymentStatusColors[order.payment_status]}`}>
                          {paymentStatusLabels[order.payment_status]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Créée le :</span>
                      <span className="font-medium">{formatDate(order.created_at)}</span>
                    </div>
                    {order.expected_delivery_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Livraison prévue :</span>
                        <span className="font-medium">{formatDate(order.expected_delivery_date)}</span>
                      </div>
                    )}
                    {order.shipped_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Expédiée le :</span>
                        <span className="font-medium">{formatDate(order.shipped_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Adresses */}
              {(order.shipping_address || order.billing_address) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Adresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.shipping_address && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Livraison</p>
                          <p className="text-sm">{typeof order.shipping_address === 'string' ? order.shipping_address : order.shipping_address.address}</p>
                        </div>
                      )}
                      {order.billing_address && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Facturation</p>
                          <p className="text-sm">{typeof order.billing_address === 'string' ? order.billing_address : order.billing_address.address}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Produits AVEC IMAGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produits ({order.sales_order_items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.sales_order_items?.map((item) => (
                      <div key={item.id} className="flex gap-4 items-start border-b pb-3 last:border-b-0 last:pb-0">
                        {/* IMAGE PRODUIT - SYSTÉMATIQUE */}
                        <div className="flex-shrink-0">
                          {item.products?.primary_image_url ? (
                            <img
                              src={item.products.primary_image_url}
                              alt={item.products.name}
                              className="w-24 h-24 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Détails produit */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base">{item.products?.name}</p>
                          <p className="text-sm text-gray-600">SKU: {item.products?.sku}</p>

                          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">Quantité :</span>
                              <span className="font-medium ml-1">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Prix unit. HT :</span>
                              <span className="font-medium ml-1">{formatCurrency(item.unit_price_ht)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total HT :</span>
                              <span className="font-medium ml-1">
                                {formatCurrency(item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100))}
                              </span>
                            </div>
                          </div>

                          {/* Afficher remise seulement si > 0 (éviter affichage "0" en JSX) */}
                          {item.discount_percentage > 0 && (
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                Remise {item.discount_percentage.toFixed(1)}%
                              </Badge>
                              <span className="text-xs text-gray-600 self-center">
                                Économie: {formatCurrency(item.quantity * item.unit_price_ht * (item.discount_percentage / 100))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totaux */}
                  <Separator className="my-4" />
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Total HT :</span>
                      <span className="font-semibold">{formatCurrency(order.total_ht || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>TVA (20%) :</span>
                      <span>{formatCurrency((order.total_ttc || 0) - (order.total_ht || 0))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl">
                      <span className="font-bold">Total TTC :</span>
                      <span className="font-bold text-primary">{formatCurrency(order.total_ttc || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COLONNE 2 : Paiement + Expédition + Actions */}
            <div className="space-y-6">

              {/* Paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Statut :</span>
                    {order.payment_status && (
                      <Badge className={paymentStatusColors[order.payment_status]}>
                        {paymentStatusLabels[order.payment_status]}
                      </Badge>
                    )}
                  </div>

                  {order.payment_terms && (
                    <div>
                      <span className="text-sm text-gray-600">Conditions :</span>
                      <p className="text-sm font-medium">{order.payment_terms}</p>
                    </div>
                  )}

                  {order.paid_amount !== undefined && order.paid_amount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-gray-600">Montant payé</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(order.paid_amount)} / {formatCurrency(order.total_ttc || 0)}
                      </p>
                      {order.paid_at && (
                        <p className="text-xs text-gray-600 mt-1">
                          Le {formatDate(order.paid_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {canMarkAsPaid && (
                    <Button
                      onClick={handleMarkAsPaid}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Marquer comme payé
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Expédition */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Expédition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.shipped_at ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-medium text-blue-900">Expédiée</p>
                        <p className="text-xs text-blue-700">
                          Le {formatDate(order.shipped_at)}
                        </p>
                      </div>

                      {order.delivered_at && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-sm font-medium text-green-900">Livrée</p>
                          <p className="text-xs text-green-700">
                            Le {formatDate(order.delivered_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Pas encore expédiée</p>
                    </div>
                  )}

                  {canShip && (
                    <Button
                      onClick={() => setShowShippingModal(true)}
                      className="w-full"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Gérer l'expédition
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {order.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions contextuelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start opacity-50"
                    disabled={true}
                    title="Fonctionnalité disponible en Phase 2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Télécharger bon de commande
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start opacity-50"
                    disabled={true}
                    title="Fonctionnalité disponible en Phase 2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Générer facture
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gestion Expédition */}
      <ShippingManagerModal
        order={order}
        open={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        onSuccess={() => {
          setShowShippingModal(false)
          onUpdate?.()
        }}
      />
    </>
  )
}

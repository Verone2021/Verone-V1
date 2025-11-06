'use client'

import { useState } from 'react'
import { X, Package, CreditCard, Truck, Calendar, User, MapPin, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonV2 } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PurchaseOrder, usePurchaseOrders } from '@/shared/modules/orders/hooks'
import { formatCurrency } from '@/lib/utils'

// ✅ Type Safety: Interface ProductImage stricte (IDENTIQUE à OrderDetailModal)
interface ProductImage {
  id?: string
  public_url: string
  is_primary: boolean
  display_order?: number
}

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

// ✅ Status Labels Achats (ALIGNÉS avec workflow purchase orders)
const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  confirmed: 'Confirmée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée'
}

const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-purple-100 text-purple-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

export function PurchaseOrderDetailModal({ order, open, onClose, onUpdate }: PurchaseOrderDetailModalProps) {
  const [showReceivingModal, setShowReceivingModal] = useState(false)

  if (!order) return null

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getSupplierName = () => {
    if (order.organisations) {
      return order.organisations.trade_name || order.organisations.legal_name
    }
    return 'Fournisseur inconnu'
  }

  // ✅ Workflow Achats: Permettre réception pour confirmed + partially_received
  const canReceive = ['confirmed', 'partially_received'].includes(order.status)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">
                Commande {order.po_number}
              </DialogTitle>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </ButtonV2>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

            {/* COLONNE 1 : Informations + Produits */}
            <div className="space-y-6">

              {/* Informations Fournisseur */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations Fournisseur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{getSupplierName()}</p>
                    <Badge variant="secondary" className="mt-1">
                      Fournisseur
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
                    {order.sent_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Envoyée le :</span>
                        <span className="font-medium">{formatDate(order.sent_at)}</span>
                      </div>
                    )}
                    {order.received_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Reçue le :</span>
                        <span className="font-medium">{formatDate(order.received_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Adresse Livraison */}
              {order.delivery_address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Adresse de Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{typeof order.delivery_address === 'string' ? order.delivery_address : order.delivery_address.address}</p>
                  </CardContent>
                </Card>
              )}

              {/* Produits AVEC IMAGES (IDENTIQUE à OrderDetailModal) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produits ({order.purchase_order_items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.purchase_order_items?.map((item) => {
                      // ✅ BR-TECH-002: Récupérer image via product_images (colonne primary_image_url supprimée)
                      const productImages = (item.products as any)?.product_images as ProductImage[] | undefined
                      const primaryImageUrl = productImages?.find(img => img.is_primary)?.public_url ||
                                             productImages?.[0]?.public_url ||
                                             null

                      return (
                      <div key={item.id} className="flex gap-4 items-start border-b pb-3 last:border-b-0 last:pb-0">
                        {/* IMAGE PRODUIT - SYSTÉMATIQUE (24x24px comme OrderDetailModal) */}
                        <div className="flex-shrink-0">
                          {primaryImageUrl ? (
                            <img
                              src={primaryImageUrl}
                              alt={item?.products?.name ?? 'Produit'}
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

                          {/* Quantité reçue (SPÉCIFIQUE achats) */}
                          {item.quantity_received > 0 && (
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                Reçu: {item.quantity_received} / {item.quantity}
                              </Badge>
                            </div>
                          )}

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
                      )
                    })}
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

            {/* COLONNE 2 : Paiement + Réception + Actions */}
            <div className="space-y-6">

              {/* Conditions de Paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Conditions de Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.payment_terms ? (
                    <div>
                      <span className="text-sm text-gray-600">Conditions :</span>
                      <p className="text-sm font-medium">{order.payment_terms}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune condition spécifiée</p>
                  )}
                </CardContent>
              </Card>

              {/* Réception (équivalent à Expédition pour ventes) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Réception
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.received_at ? (
                    <div className="space-y-2">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-sm font-medium text-green-900">Reçue</p>
                        <p className="text-xs text-green-700">
                          Le {formatDate(order.received_at)}
                        </p>
                      </div>
                    </div>
                  ) : order.status === 'partially_received' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm font-medium text-yellow-900">Partiellement reçue</p>
                      <p className="text-xs text-yellow-700">
                        Réception en cours
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Pas encore reçue</p>
                    </div>
                  )}

                  {canReceive && (
                    <ButtonV2
                      onClick={() => setShowReceivingModal(true)}
                      className="w-full"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Gérer la réception
                    </ButtonV2>
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
                  <ButtonV2
                    variant="outline"
                    className="w-full justify-start opacity-50"
                    disabled={true}
                    title="Fonctionnalité disponible en Phase 2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Télécharger bon de commande
                  </ButtonV2>
                  <ButtonV2
                    variant="outline"
                    className="w-full justify-start opacity-50"
                    disabled={true}
                    title="Fonctionnalité disponible en Phase 2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </ButtonV2>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TODO Phase 2: Modal Gestion Réception (équivalent à SalesOrderShipmentModal) */}
      {showReceivingModal && (
        <div className="hidden">Modal réception à implémenter en Phase 2</div>
      )}
    </>
  )
}

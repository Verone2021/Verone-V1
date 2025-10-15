'use client'

import { useEffect, useState } from 'react'
import { X, Package, Calendar, User, Loader2, ShoppingCart, TruckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonV2 } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface UniversalOrderDetailsModalProps {
  orderId: string | null
  orderType: 'sales' | 'purchase' | null
  open: boolean
  onClose: () => void
}

interface OrderDetails {
  id: string
  order_number: string
  status: string
  created_at: string
  expected_delivery_date: string | null
  total_amount: number
  customer_name?: string
  supplier_name?: string
  items: {
    id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Validée',
  sent: 'Envoyée',
  received: 'Reçue',
  partially_received: 'Partiellement reçue',
  cancelled: 'Annulée',
  delivered: 'Livrée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée'
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  received: 'bg-green-100 text-green-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  delivered: 'bg-green-100 text-green-800',
  partially_shipped: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-indigo-100 text-indigo-800'
}

export function UniversalOrderDetailsModal({
  orderId,
  orderType,
  open,
  onClose
}: UniversalOrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId || !orderType || !open) {
      setOrderDetails(null)
      return
    }

    const fetchOrderDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        if (orderType === 'sales') {
          // Récupérer Sales Order avec items
          const { data: order, error: orderError } = await supabase
            .from('sales_orders')
            .select(`
              id,
              order_number,
              status,
              created_at,
              expected_delivery_date,
              total_amount,
              customer_type,
              organisations(name),
              individual_customers(first_name, last_name),
              sales_order_items(
                id,
                quantity,
                unit_price,
                total_price,
                products(name)
              )
            `)
            .eq('id', orderId)
            .single()

          if (orderError) throw orderError

          const customerName = order.customer_type === 'organization'
            ? order.organisations?.name
            : `${order.individual_customers?.first_name} ${order.individual_customers?.last_name}`

          setOrderDetails({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_amount: order.total_amount,
            customer_name: customerName,
            items: order.sales_order_items.map((item: any) => ({
              id: item.id,
              product_name: item.products?.name || 'Produit inconnu',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            }))
          })
        } else if (orderType === 'purchase') {
          // Récupérer Purchase Order avec items
          const { data: order, error: orderError } = await supabase
            .from('purchase_orders')
            .select(`
              id,
              po_number,
              status,
              created_at,
              expected_delivery_date,
              total_amount,
              suppliers(name),
              purchase_order_items(
                id,
                quantity,
                unit_price,
                total_price,
                products(name)
              )
            `)
            .eq('id', orderId)
            .single()

          if (orderError) throw orderError

          setOrderDetails({
            id: order.id,
            order_number: order.po_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_amount: order.total_amount,
            supplier_name: order.suppliers?.name,
            items: order.purchase_order_items.map((item: any) => ({
              id: item.id,
              product_name: item.products?.name || 'Produit inconnu',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            }))
          })
        }
      } catch (err: any) {
        console.error('Erreur chargement commande:', err)
        setError(err.message || 'Erreur lors du chargement de la commande')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, orderType, open])

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {orderType === 'sales' ? (
                <><ShoppingCart className="h-6 w-6" /> Commande Client</>
              ) : (
                <><TruckIcon className="h-6 w-6" /> Commande Fournisseur</>
              )}
            </DialogTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </ButtonV2>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && orderDetails && (
          <div className="space-y-6">
            {/* En-tête commande */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{orderDetails.order_number}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Créée le {formatDate(orderDetails.created_at)}
                    </p>
                  </div>
                  <Badge className={statusColors[orderDetails.status] || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[orderDetails.status] || orderDetails.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {orderDetails.customer_name && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Client</p>
                        <p className="text-sm text-gray-900">{orderDetails.customer_name}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.supplier_name && (
                    <div className="flex items-start gap-3">
                      <TruckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fournisseur</p>
                        <p className="text-sm text-gray-900">{orderDetails.supplier_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Livraison prévue</p>
                      <p className="text-sm text-gray-900">{formatDate(orderDetails.expected_delivery_date)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles ({orderDetails.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          Quantité: {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold">{formatCurrency(orderDetails.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

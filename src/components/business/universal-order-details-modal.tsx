'use client'

import { useEffect, useState } from 'react'
import { X, Package, Calendar, User, Loader2, ShoppingCart, TruckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonV2 } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useOrderItems } from '@/hooks/use-order-items'
import { EditableOrderItemRow } from '@/components/business/editable-order-item-row'

interface UniversalOrderDetailsModalProps {
  orderId: string | null
  orderType: 'sales' | 'purchase' | null
  open: boolean
  onClose: () => void
}

interface OrderHeader {
  id: string
  order_number: string
  status: string
  created_at: string
  expected_delivery_date: string | null
  total_ttc: number
  customer_name?: string
  supplier_name?: string
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
  const [orderHeader, setOrderHeader] = useState<OrderHeader | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🎯 Hook réutilisable pour charger les items avec images et métriques complètes
  const {
    items,
    loading: itemsLoading,
    error: itemsError
  } = useOrderItems({
    orderId: orderId || '',
    orderType: orderType || 'purchase'
  })

  // Charger uniquement l'en-tête de commande (items gérés par useOrderItems)
  useEffect(() => {
    if (!orderId || !orderType || !open) {
      setOrderHeader(null)
      return
    }

    const fetchOrderHeader = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        if (orderType === 'sales') {
          // Récupérer Sales Order SANS items
          const { data: order, error: orderError } = await supabase
            .from('sales_orders')
            .select('id, order_number, status, created_at, expected_delivery_date, total_ttc, customer_id, customer_type')
            .eq('id', orderId)
            .single()

          if (orderError) throw orderError

          // Récupérer nom client selon type (jointure manuelle polymorphe)
          let customerName = 'Client inconnu'

          if (order.customer_type === 'organization' && order.customer_id) {
            const { data: org } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', order.customer_id)
              .single()
            customerName = (org?.trade_name || org?.legal_name) || 'Organisation inconnue'
          } else if (order.customer_type === 'individual' && order.customer_id) {
            const { data: individual } = await supabase
              .from('individual_customers')
              .select('first_name, last_name')
              .eq('id', order.customer_id)
              .single()
            customerName = individual ? `${individual.first_name} ${individual.last_name}` : 'Particulier inconnu'
          }

          setOrderHeader({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_ttc: order.total_ttc,
            customer_name: customerName
          })
        } else if (orderType === 'purchase') {
          // Récupérer Purchase Order SANS items
          const { data: order, error: orderError } = await supabase
            .from('purchase_orders')
            .select('id, po_number, status, created_at, expected_delivery_date, total_ttc, supplier_id')
            .eq('id', orderId)
            .single()

          if (orderError) throw orderError

          // Récupérer nom fournisseur (supplier_id → organisations)
          let supplierName = 'Fournisseur inconnu'

          if (order.supplier_id) {
            const { data: supplier } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', order.supplier_id)
              .single()
            supplierName = (supplier?.trade_name || supplier?.legal_name) || 'Fournisseur inconnu'
          }

          setOrderHeader({
            id: order.id,
            order_number: order.po_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_ttc: order.total_ttc,
            supplier_name: supplierName
          })
        }
      } catch (err: any) {
        console.error('[UniversalOrderDetailsModal] Erreur chargement en-tête commande:', {
          orderId,
          orderType,
          errorMessage: err?.message,
          errorCode: err?.code,
          errorDetails: err?.details,
          errorHint: err?.hint,
          fullError: err
        })

        const errorMessage = err?.message ||
          `Impossible de charger la commande ${orderType === 'sales' ? 'client' : 'fournisseur'}`

        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderHeader()
  }, [orderId, orderType, open])

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Calculer total à partir des items du hook
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unit_price_ht * (1 - (item.discount_percentage || 0) / 100)
      return sum + subtotal + (item.eco_tax || 0)
    }, 0)
  }

  // Loading combiné (header + items)
  const isLoading = loading || itemsLoading
  const hasError = error || itemsError

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

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        )}

        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-600 text-sm mt-1">{hasError}</p>
          </div>
        )}

        {!isLoading && !hasError && orderHeader && (
          <div className="space-y-6">
            {/* En-tête commande */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{orderHeader.order_number}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Créée le {formatDate(orderHeader.created_at)}
                    </p>
                  </div>
                  <Badge className={statusColors[orderHeader.status] || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[orderHeader.status] || orderHeader.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {orderHeader.customer_name && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Client</p>
                        <p className="text-sm text-gray-900">{orderHeader.customer_name}</p>
                      </div>
                    </div>
                  )}
                  {orderHeader.supplier_name && (
                    <div className="flex items-start gap-3">
                      <TruckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fournisseur</p>
                        <p className="text-sm text-gray-900">{orderHeader.supplier_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Livraison prévue</p>
                      <p className="text-sm text-gray-900">{formatDate(orderHeader.expected_delivery_date)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Articles avec composant réutilisable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Qté</TableHead>
                      <TableHead>Prix HT</TableHead>
                      <TableHead>Remise</TableHead>
                      <TableHead>Éco-taxe</TableHead>
                      {orderType === 'sales' && <TableHead>TVA</TableHead>}
                      <TableHead>Total HT</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <EditableOrderItemRow
                        key={item.id}
                        item={item}
                        orderType={orderType || 'purchase'}
                        readonly={true}
                      />
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Total HT</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

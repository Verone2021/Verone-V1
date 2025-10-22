'use client'

/**
 * 📦 Modal Wrapper: Expédition Sales Order
 * Charge données enrichies et affiche SalesOrderShipmentForm
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { SalesOrderShipmentForm } from './sales-order-shipment-form'
import { useSalesShipments, type SalesOrderForShipment } from '@/hooks/use-sales-shipments'
import type { SalesOrder } from '@/hooks/use-sales-orders'

interface SalesOrderShipmentModalProps {
  order: SalesOrder
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SalesOrderShipmentModal({
  order,
  open,
  onClose,
  onSuccess
}: SalesOrderShipmentModalProps) {
  const { loadSalesOrderForShipment, loading } = useSalesShipments()
  const [enrichedOrder, setEnrichedOrder] = useState<SalesOrderForShipment | null>(null)

  // Charger données enrichies (items avec stock) quand modal s'ouvre
  useEffect(() => {
    if (open && order?.id) {
      loadSalesOrderForShipment(order.id).then(data => {
        setEnrichedOrder(data)
      })
    } else {
      // Reset quand modal se ferme
      setEnrichedOrder(null)
    }
  }, [open, order?.id, loadSalesOrderForShipment])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Expédition Marchandise
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Commande {order.order_number}
                {enrichedOrder?.organisations && ` • ${enrichedOrder.organisations.name}`}
              </p>
            </div>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </ButtonV2>
          </div>
        </DialogHeader>

        {/* Afficher loading ou formulaire */}
        <div className="mt-6">
          {loading || !enrichedOrder ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-500">Chargement des données...</div>
            </div>
          ) : (
            <SalesOrderShipmentForm
              salesOrder={enrichedOrder}
              onSuccess={() => {
                onSuccess()
                onClose()
              }}
              onCancel={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PurchaseOrder } from '@/hooks/use-purchase-orders'

interface PurchaseOrderReceptionModalProps {
  order: PurchaseOrder
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PurchaseOrderReceptionModal({
  order,
  open,
  onClose,
  onSuccess
}: PurchaseOrderReceptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reception de commande</DialogTitle>
          <DialogDescription>
            Module de reception en cours de developpement
          </DialogDescription>
        </DialogHeader>
        <div className="text-center py-8">
          <p>Fonctionnalite bientot disponible</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
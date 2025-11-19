'use client';

import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';

import { PurchaseOrderReceptionForm } from '@verone/orders/components/forms/PurchaseOrderReceptionForm';
import type { PurchaseOrder } from '@verone/orders/hooks';
import { usePurchaseReceptions } from '@verone/orders/hooks';

interface PurchaseOrderReceptionModalProps {
  order: PurchaseOrder;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PurchaseOrderReceptionModal({
  order,
  open,
  onClose,
  onSuccess,
}: PurchaseOrderReceptionModalProps) {
  const { loadPurchaseOrderForReception } = usePurchaseReceptions();
  const [enrichedOrder, setEnrichedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && order?.id) {
      setLoading(true);
      loadPurchaseOrderForReception(order.id).then(data => {
        setEnrichedOrder(data);
        setLoading(false);
      });
    }
  }, [open, order?.id, loadPurchaseOrderForReception]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Réceptionner Commande Fournisseur
          </DialogTitle>
          {enrichedOrder && (
            <DialogDescription>
              {enrichedOrder.po_number}
              {enrichedOrder.organisations &&
                ` • ${enrichedOrder.organisations.trade_name || enrichedOrder.organisations.legal_name}`}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">
              Chargement des données...
            </div>
          </div>
        ) : enrichedOrder ? (
          <PurchaseOrderReceptionForm
            purchaseOrder={enrichedOrder}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        ) : (
          <div className="text-center py-8 text-red-600">
            Erreur lors du chargement de la commande
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

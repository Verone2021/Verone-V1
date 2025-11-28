'use client';

import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';

import { SalesOrderShipmentForm } from '@verone/orders/components/forms/SalesOrderShipmentForm';
import { useSalesShipments } from '@verone/orders/hooks';

interface SalesOrderShipmentModalProps {
  order: {
    id: string;
    order_number?: string;
  };
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SalesOrderShipmentModal({
  order,
  open,
  onClose,
  onSuccess,
}: SalesOrderShipmentModalProps) {
  const { loadSalesOrderForShipment } = useSalesShipments();
  const [enrichedOrder, setEnrichedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && order?.id) {
      setLoading(true);
      loadSalesOrderForShipment(order.id).then(data => {
        setEnrichedOrder(data);
        setLoading(false);
      });
    }
  }, [open, order?.id, loadSalesOrderForShipment]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Expédier Commande Client
          </DialogTitle>
          {enrichedOrder && (
            <DialogDescription>
              {enrichedOrder.order_number}
              {enrichedOrder.customer_name &&
                ` • ${enrichedOrder.customer_name}`}
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
          <SalesOrderShipmentForm
            salesOrder={enrichedOrder}
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

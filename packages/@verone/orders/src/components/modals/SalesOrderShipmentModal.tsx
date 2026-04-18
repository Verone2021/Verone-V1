'use client';

import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';

import { ShipmentWizard } from '@verone/orders/components/forms/ShipmentWizard';
import type { SalesOrderForShipment } from '@verone/orders/hooks';
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
  const [enrichedOrder, setEnrichedOrder] =
    useState<SalesOrderForShipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open && order?.id) {
      setLoading(true);
      void loadSalesOrderForShipment(order.id).then(data => {
        setEnrichedOrder(data);
        setLoading(false);
      });
    }
  }, [open, order?.id, refreshKey, loadSalesOrderForShipment]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleRefetch = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-6xl md:max-h-[90vh] flex flex-col overflow-hidden">
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

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">
                Chargement des données...
              </div>
            </div>
          ) : enrichedOrder ? (
            <ShipmentWizard
              salesOrder={enrichedOrder}
              onSuccess={handleSuccess}
              onCancel={onClose}
              onRefetch={handleRefetch}
            />
          ) : (
            <div className="text-center py-8 text-red-600">
              Erreur lors du chargement de la commande
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

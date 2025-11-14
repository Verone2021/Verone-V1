'use client';

import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@verone/ui';
import { ButtonV2, Badge } from '@verone/ui';
import { Package, Truck, Plus, XCircle, TrendingUp } from 'lucide-react';

import { CloseOrderModal } from '@verone/orders/components/modals/CloseOrderModal';
import { CreateShipmentModal } from '@verone/orders/components/modals/CreateShipmentModal';
import { useShipments } from '@verone/orders/hooks';

import { ShipmentCardOld } from './ShipmentCardOld';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  quantity_shipped: number;
}

interface ShipmentsSectionProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderItems: OrderItem[];
  onUpdate?: () => void;
  className?: string;
}

export function ShipmentsSection({
  orderId,
  orderNumber,
  orderStatus,
  orderItems,
  onUpdate,
  className,
}: ShipmentsSectionProps) {
  const { loading, fetchShipments, closeOrder, createShipment } =
    useShipments();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  // Charger shipments au montage et quand orderId change
  useEffect(() => {
    if (orderId) {
      fetchShipments(orderId)
        .then(result => setData(result))
        .catch(err => setError(err.message));
    }
  }, [orderId, fetchShipments]);

  const handleSuccess = () => {
    fetchShipments(orderId)
      .then(result => setData(result))
      .catch(err => setError(err.message));
    onUpdate?.();
  };

  // Statuts permettant création shipment
  const canCreateShipment = ['confirmed', 'partially_shipped'].includes(
    orderStatus
  );

  // Statuts permettant clôture partielle
  const canCloseOrder = ['confirmed', 'partially_shipped'].includes(
    orderStatus
  );

  const summary = data?.summary || {
    total_shipments: 0,
    total_units_shipped: 0,
    total_units_ordered: 0,
    total_units_remaining: 0,
    last_shipment_date: null,
    completion_percentage: 0,
  };

  const shipments = data?.shipments || [];

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Expéditions
              </CardTitle>
              <CardDescription>
                {summary.total_shipments} expédition
                {summary.total_shipments > 1 ? 's' : ''} •{' '}
                {summary.total_units_shipped}/{summary.total_units_ordered}{' '}
                unités expédiées ({summary.completion_percentage.toFixed(0)}%)
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {canCloseOrder && summary.total_units_remaining > 0 && (
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() => setCloseModalOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clôturer commande
                </ButtonV2>
              )}

              {canCreateShipment && (
                <ButtonV2
                  variant="default"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle expédition
                </ButtonV2>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Résumé expéditions */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Package className="h-4 w-4" />
                <span>Total expéditions</span>
              </div>
              <p className="text-2xl font-bold">{summary.total_shipments}</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
                <Truck className="h-4 w-4" />
                <span>Unités expédiées</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {summary.total_units_shipped}
              </p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2 text-orange-700 text-sm mb-1">
                <Package className="h-4 w-4" />
                <span>Unités restantes</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {summary.total_units_remaining}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-700 text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Complétion</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {summary.completion_percentage.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">
                Chargement des expéditions...
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              Erreur: {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && shipments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-1">Aucune expédition</p>
              <p className="text-sm text-muted-foreground">
                Créez une première expédition pour cette commande
              </p>
            </div>
          )}

          {/* Liste expéditions */}
          {!loading && !error && shipments.length > 0 && (
            <div className="space-y-4">
              {shipments.map(shipment => (
                <ShipmentCardOld key={shipment.id} shipment={shipment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateShipmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        salesOrderId={orderId}
        onSuccess={handleSuccess}
      />

      <CloseOrderModal
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        remainingUnits={summary.total_units_remaining}
        onSuccess={handleSuccess}
      />
    </>
  );
}

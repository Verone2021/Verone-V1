'use client';

/**
 * ShipmentsSectionSimple - Version simplifiée autonome
 * Récupère elle-même les données de la commande
 */

import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Package, Truck, Plus } from 'lucide-react';

import { CreateShipmentModal } from '../modals/CreateShipmentModal';

interface ShipmentsSectionSimpleProps {
  salesOrderId: string;
}

export function ShipmentsSectionSimple({
  salesOrderId,
}: ShipmentsSectionSimpleProps) {
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Charger données commande + expéditions
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Charger commande
      const { data: order } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          status,
          sales_order_items (
            id,
            product_id,
            quantity,
            quantity_shipped,
            products (
              name
            )
          )
        `
        )
        .eq('id', salesOrderId)
        .single();

      setOrderData(order);

      // TEMPORAIRE: Table shipments supprimée (PackLink abandonné)
      // Charger expéditions depuis stock_movements à implémenter
      const shipmentData: any[] = [];
      /* const { data: shipmentData } = await supabase
        .from('shipments')
        .select(
          `
          id,
          packlink_shipment_id,
          status,
          carrier_name,
          service_name,
          tracking_url,
          created_at,
          delivered_at,
          shipment_items (
            quantity,
            products (
              name
            )
          )
        `
        )
        .eq('sales_order_id', salesOrderId)
        .order('created_at', { ascending: false }); */

      setShipments(shipmentData || []);
      setLoading(false);
    }

    loadData();
  }, [salesOrderId]);

  const handleSuccess = () => {
    // Recharger données
    setLoading(true);
    // Trigger reload via useEffect
    setShipments([]);
  };

  const canCreateShipment =
    orderData && ['validated', 'partially_shipped'].includes(orderData.status);

  const items = orderData?.sales_order_items || [];
  const totalUnits = items.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );
  const totalShipped = items.reduce(
    (sum: number, item: any) => sum + (item.quantity_shipped || 0),
    0
  );
  const completionPercent =
    totalUnits > 0 ? Math.round((totalShipped / totalUnits) * 100) : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Expéditions
              </CardTitle>
              <CardDescription>
                {shipments.length} expédition{shipments.length > 1 ? 's' : ''} •{' '}
                {totalShipped}/{totalUnits} unités ({completionPercent}%)
              </CardDescription>
            </div>

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
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Package className="h-4 w-4" />
                <span>Total expéditions</span>
              </div>
              <p className="text-2xl font-bold">{shipments.length}</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
                <Truck className="h-4 w-4" />
                <span>Expédiées</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {totalShipped}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-700 text-sm mb-1">
                <span>Complétion</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {completionPercent}%
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && shipments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium mb-1">
                Aucune expédition
              </p>
              <p className="text-sm text-muted-foreground">
                Créez une première expédition pour cette commande
              </p>
            </div>
          )}

          {/* Liste expéditions */}
          {!loading && shipments.length > 0 && (
            <div className="space-y-3">
              {shipments.map(shipment => (
                <div
                  key={shipment.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {shipment.carrier_name || 'Transporteur'} -{' '}
                          {shipment.service_name || 'Standard'}
                        </span>
                        <span className="text-sm px-2 py-1 bg-muted rounded-md">
                          {shipment.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Ref: {shipment.packlink_shipment_id || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Créée le{' '}
                        {new Date(shipment.created_at).toLocaleDateString(
                          'fr-FR'
                        )}
                      </p>
                      {shipment.tracking_url && (
                        <a
                          href={shipment.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline hover:no-underline mt-2 inline-block"
                        >
                          Suivre l'expédition →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal création expédition */}
      {orderData && (
        <CreateShipmentModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          salesOrderId={salesOrderId}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

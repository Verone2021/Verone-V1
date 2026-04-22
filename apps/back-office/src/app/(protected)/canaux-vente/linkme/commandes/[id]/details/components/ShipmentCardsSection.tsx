'use client';

import {
  OrderShipmentHistoryCard,
  OrderShipmentStatusCard,
  useShipmentHistory,
} from '@verone/orders/components/modals/order-detail';
import type { SalesOrder } from '@verone/orders/hooks';

import type { OrderWithDetails } from './types';

interface ShipmentCardsSectionProps {
  order: OrderWithDetails;
  onOpenShipmentModal: () => void;
}

/**
 * Displays shipment status card + shipment history card for a LinkMe order.
 * Fetches its own data via useShipmentHistory (open=true, always mounted).
 */
export function ShipmentCardsSection({
  order,
  onOpenShipmentModal,
}: ShipmentCardsSectionProps) {
  const { shipmentHistory, salesOrderItems } = useShipmentHistory(
    order.id,
    true
  );

  if (shipmentHistory.length === 0) return null;

  return (
    <>
      <OrderShipmentStatusCard
        order={
          {
            id: order.id,
            status: order.status as SalesOrder['status'],
            shipped_at: undefined,
            delivered_at: undefined,
          } as SalesOrder
        }
        shipmentHistory={shipmentHistory}
        readOnly={false}
        canShip={
          order.status === 'validated' || order.status === 'partially_shipped'
        }
        onOpenShipmentModal={onOpenShipmentModal}
      />
      <OrderShipmentHistoryCard
        shipmentHistory={shipmentHistory}
        order={
          {
            id: order.id,
            sales_order_items: salesOrderItems.map(i => ({
              id: i.id,
              quantity: i.quantity,
              products: i.products,
            })),
          } as unknown as SalesOrder
        }
      />
    </>
  );
}

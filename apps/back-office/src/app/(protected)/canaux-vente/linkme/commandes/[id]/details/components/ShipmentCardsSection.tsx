'use client';

import { useState } from 'react';

import {
  OrderShipmentHistoryCard,
  OrderShipmentStatusCard,
  useShipmentHistory,
} from '@verone/orders/components/modals/order-detail';
import type { ShipmentHistoryItem } from '@verone/orders/components/modals/order-detail';
import { SendShippingTrackingModal } from '@verone/orders/components/modals';
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

  const [shipmentToEmail, setShipmentToEmail] =
    useState<ShipmentHistoryItem | null>(null);

  if (shipmentHistory.length === 0) return null;

  // Build minimal order shape for SendShippingTrackingModal
  // OrderWithDetails uses `organisation` (singular), no individual_customers
  const orderForModal = {
    id: order.id,
    order_number: order.order_number,
    organisations: order.organisation
      ? {
          id: order.organisation.id,
          email: order.organisation.email ?? null,
          trade_name: order.organisation.trade_name ?? null,
        }
      : null,
    individual_customers: null,
    responsable_contact: order.responsable_contact
      ? {
          id: order.responsable_contact.id,
          first_name: order.responsable_contact.first_name,
          last_name: order.responsable_contact.last_name,
          email: order.responsable_contact.email,
        }
      : null,
    billing_contact: order.billing_contact
      ? {
          id: order.billing_contact.id,
          first_name: order.billing_contact.first_name,
          last_name: order.billing_contact.last_name,
          email: order.billing_contact.email,
        }
      : null,
    delivery_contact: order.delivery_contact
      ? {
          id: order.delivery_contact.id,
          first_name: order.delivery_contact.first_name,
          last_name: order.delivery_contact.last_name,
          email: order.delivery_contact.email,
        }
      : null,
  };

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
        onSendTrackingEmail={h => setShipmentToEmail(h)}
      />

      {shipmentToEmail && (
        <SendShippingTrackingModal
          open={!!shipmentToEmail}
          onClose={() => setShipmentToEmail(null)}
          shipment={shipmentToEmail}
          order={orderForModal}
        />
      )}
    </>
  );
}

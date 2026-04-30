'use client';

import { useCallback, useState } from 'react';

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
  const [reloadKey, setReloadKey] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const { shipmentHistory, salesOrderItems } = useShipmentHistory(
    order.id,
    true,
    reloadKey
  );

  const [shipmentToEmail, setShipmentToEmail] =
    useState<ShipmentHistoryItem | null>(null);

  const handleSyncPacklink = useCallback(() => {
    if (syncing) return;
    setSyncing(true);
    void fetch('/api/packlink/shipments/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales_order_id: order.id }),
    })
      .catch(err => {
        console.error('[ShipmentCardsSection] sync failed:', err);
      })
      .finally(() => {
        setReloadKey(k => k + 1);
        setSyncing(false);
      });
  }, [order.id, syncing]);

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
        onSync={handleSyncPacklink}
        syncing={syncing}
      />

      {shipmentToEmail && (
        <SendShippingTrackingModal
          open={!!shipmentToEmail}
          onClose={() => setShipmentToEmail(null)}
          // On passe TOUS les shipments avec tracking — le user peut
          // décocher dans le modal s'il veut n'envoyer qu'un sous-ensemble
          // (cas typique : 2 colis payés à des jours différents).
          shipments={shipmentHistory
            .filter(s => Boolean(s.tracking_number))
            .map(s => ({
              id: s.id,
              tracking_number: s.tracking_number,
              tracking_url: s.tracking_url,
              carrier_name: s.carrier_name,
              shipped_at: s.shipped_at,
            }))}
          order={orderForModal}
        />
      )}
    </>
  );
}

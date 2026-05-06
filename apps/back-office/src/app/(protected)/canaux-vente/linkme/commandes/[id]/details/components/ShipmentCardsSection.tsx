'use client';

import { memo, useCallback, useState } from 'react';

import {
  OrderShipmentHistoryCard,
  OrderShipmentStatusCard,
  useShipmentHistory,
} from '@verone/orders/components/modals/order-detail';
import type { ShipmentHistoryItem } from '@verone/orders/components/modals/order-detail';
import { SendShippingTrackingModal } from '@verone/orders/components/modals';
import type { SalesOrder } from '@verone/orders/hooks';

// Contacts primitifs pour le modal d'envoi tracking
interface ContactPrimitive {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface OrganisationPrimitive {
  id: string;
  email: string | null;
  trade_name: string | null;
}

interface ShipmentCardsSectionProps {
  // Primitifs stables — React.memo comparaison par défaut (égalité référentielle)
  orderId: string;
  orderStatus: string;
  orderNumber: string;
  // Organisation et contacts — passés en objets déjà construits par RightColumn
  // (null si non renseignés). Ces valeurs changent rarement en cours de session.
  organisation: OrganisationPrimitive | null;
  responsableContact: ContactPrimitive | null;
  billingContact: ContactPrimitive | null;
  deliveryContact: ContactPrimitive | null;
  onOpenShipmentModal: () => void;
}

/**
 * Displays shipment status card + shipment history card for a LinkMe order.
 * Fetches its own data via useShipmentHistory (open=true, always mounted).
 *
 * Wrapped in React.memo — re-renders only when one of the primitive props
 * changes (orderId, orderStatus, orderNumber). Contact/organisation objects
 * are stable across typical edits (missing-info, date, notes), so the memo
 * effectively prevents unnecessary re-renders caused by parent setOrder calls.
 */
export const ShipmentCardsSection = memo(function ShipmentCardsSection({
  orderId,
  orderStatus,
  orderNumber,
  organisation,
  responsableContact,
  billingContact,
  deliveryContact,
  onOpenShipmentModal,
}: ShipmentCardsSectionProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const { shipmentHistory, salesOrderItems } = useShipmentHistory(
    orderId,
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
      body: JSON.stringify({ sales_order_id: orderId }),
    })
      .catch(err => {
        console.error('[ShipmentCardsSection] sync failed:', err);
      })
      .finally(() => {
        setReloadKey(k => k + 1);
        setSyncing(false);
      });
  }, [orderId, syncing]);

  if (shipmentHistory.length === 0) return null;

  // Build minimal order shape for SendShippingTrackingModal
  // OrderWithDetails uses `organisation` (singular), no individual_customers
  const orderForModal = {
    id: orderId,
    order_number: orderNumber,
    organisations: organisation
      ? {
          id: organisation.id,
          email: organisation.email,
          trade_name: organisation.trade_name,
        }
      : null,
    individual_customers: null,
    responsable_contact: responsableContact
      ? {
          id: responsableContact.id,
          first_name: responsableContact.first_name,
          last_name: responsableContact.last_name,
          email: responsableContact.email,
        }
      : null,
    billing_contact: billingContact
      ? {
          id: billingContact.id,
          first_name: billingContact.first_name,
          last_name: billingContact.last_name,
          email: billingContact.email,
        }
      : null,
    delivery_contact: deliveryContact
      ? {
          id: deliveryContact.id,
          first_name: deliveryContact.first_name,
          last_name: deliveryContact.last_name,
          email: deliveryContact.email,
        }
      : null,
  };

  return (
    <>
      <OrderShipmentStatusCard
        order={
          {
            id: orderId,
            status: orderStatus as SalesOrder['status'],
            shipped_at: undefined,
            delivered_at: undefined,
          } as SalesOrder
        }
        shipmentHistory={shipmentHistory}
        readOnly={false}
        canShip={
          orderStatus === 'validated' || orderStatus === 'partially_shipped'
        }
        onOpenShipmentModal={onOpenShipmentModal}
      />
      <OrderShipmentHistoryCard
        shipmentHistory={shipmentHistory}
        order={
          {
            id: orderId,
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
});

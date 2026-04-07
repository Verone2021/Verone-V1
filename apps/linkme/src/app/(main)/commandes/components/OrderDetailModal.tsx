'use client';

/**
 * OrderDetailModal - Modal de detail d'une commande LinkMe
 * Design: Fond blanc, accents turquoise #5DBEBB, texte navy #183559
 *
 * @module OrderDetailModal
 * @since 2026-01-06
 */

import React, { useCallback, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  Separator,
} from '@verone/ui';
import {
  CalendarIcon,
  DownloadIcon,
  EyeIcon,
  Loader2Icon,
  PhoneIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';

import { usePermissions } from '@/hooks/use-permissions';

import type { LinkMeOrder } from '../../../../hooks/use-linkme-orders';
import {
  formatDate,
  STATUS_COLORS,
  STATUS_LABELS,
} from './order-detail.helpers';
import { OrderAddressesSection } from './OrderAddressesSection';
import { ContactCard } from './OrderContactCard';
import { OrderItemsTable } from './OrderItemsTable';
import { OrderShipmentSection } from './OrderShipmentSection';
import { OrderTotalsSection } from './OrderTotalsSection';

interface OrderDetailModalProps {
  order: LinkMeOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ShipmentRow {
  tracking_number: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  packlink_status: string | null;
  shipped_at: string | null;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
}: OrderDetailModalProps) {
  const { canViewCommissions } = usePermissions();

  const [invoiceLoading, setInvoiceLoading] = useState<
    'view' | 'download' | null
  >(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const handleInvoiceAction = useCallback(
    async (action: 'view' | 'download') => {
      if (!order?.id) return;
      setInvoiceLoading(action);
      setInvoiceError(null);

      try {
        const response = await fetch(`/api/invoices/${order.id}/pdf`);

        if (response.status === 404) {
          setInvoiceError('Aucune facture disponible pour cette commande');
          return;
        }
        if (response.status === 202) {
          setInvoiceError('Le PDF est en cours de génération');
          return;
        }
        if (!response.ok) {
          setInvoiceError('Erreur lors du chargement');
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (action === 'view') {
          window.open(url, '_blank');
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.download = `facture-${order.linkme_display_number ?? order.order_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch (err) {
        console.error('[OrderDetailModal] Invoice action failed:', err);
        setInvoiceError('Erreur réseau');
      } finally {
        setInvoiceLoading(null);
      }
    },
    [order?.id, order?.linkme_display_number, order?.order_number]
  );

  const [shipmentTracking, setShipmentTracking] = React.useState<ShipmentRow[]>(
    []
  );

  React.useEffect(() => {
    if (!isOpen || !order?.id) {
      setShipmentTracking([]);
      return;
    }
    const load = async () => {
      const { createClient } = await import('@verone/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('sales_order_shipments')
        .select(
          'tracking_number, tracking_url, carrier_name, packlink_status, shipped_at'
        )
        .eq('sales_order_id', order.id)
        .order('shipped_at', { ascending: false });
      const rows = (data ?? []) as unknown as ShipmentRow[];
      setShipmentTracking(rows);
    };
    void load().catch(console.error);
  }, [isOpen, order?.id]);

  if (!order) return null;

  const statusColor = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;

  const isSameAddress =
    JSON.stringify(order.billing_address) ===
    JSON.stringify(order.shipping_address);

  const hasDeliveryTextAddress =
    order.delivery_address_text ??
    order.delivery_postal_code ??
    order.delivery_city;

  const hasRequester =
    order.requester_name ?? order.requester_email ?? order.requester_phone;
  const hasDeliveryContact =
    order.delivery_contact_name ??
    order.delivery_contact_email ??
    order.delivery_contact_phone;
  const hasReceptionContact =
    order.reception_contact_name ??
    order.reception_contact_email ??
    order.reception_contact_phone;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-semibold text-[#183559]">
              Commande {order.linkme_display_number ?? order.order_number}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Détails de la commande{' '}
              {order.linkme_display_number ?? order.order_number}
            </DialogDescription>
            <Badge variant="outline" className={`${statusColor} font-medium`}>
              {statusLabel}
            </Badge>
            {order.pending_admin_validation && (
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800 border-orange-200 font-medium"
              >
                Validation admin requise
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Section: Client */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
              <UserIcon className="h-4 w-4 text-[#5DBEBB]" />
              Client
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-[#183559]">
                {order.customer_name}
              </p>
              {order.customer_email && (
                <p className="text-sm text-gray-600">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {order.customer_type === 'organization'
                    ? 'Organisation'
                    : 'Particulier'}
                </Badge>
                {order.affiliate_name && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                  >
                    Affilie: {order.affiliate_name}
                  </Badge>
                )}
                {order.selection_name && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {order.selection_name}
                  </Badge>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Section: Contacts */}
          {(hasRequester ??
            order.billing_name ??
            hasDeliveryContact ??
            hasReceptionContact) && (
            <>
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
                  <PhoneIcon className="h-4 w-4 text-[#5DBEBB]" />
                  Contacts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ContactCard
                    label="Responsable commande"
                    name={order.requester_name}
                    email={order.requester_email}
                    phone={order.requester_phone}
                    position={order.requester_position}
                  />
                  <ContactCard
                    label="Contact facturation"
                    name={order.billing_name}
                    email={order.billing_email}
                    phone={order.billing_phone}
                  />
                  <ContactCard
                    label="Contact livraison"
                    name={order.delivery_contact_name}
                    email={order.delivery_contact_email}
                    phone={order.delivery_contact_phone}
                  />
                  <ContactCard
                    label="Contact reception"
                    name={order.reception_contact_name}
                    email={order.reception_contact_email}
                    phone={order.reception_contact_phone}
                  />
                </div>
              </section>

              <Separator />
            </>
          )}

          {/* Section: Adresses */}
          <OrderAddressesSection
            order={order}
            isSameAddress={isSameAddress}
            hasDeliveryTextAddress={hasDeliveryTextAddress}
          />

          <Separator />

          {/* Section: Dates de livraison */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
              <CalendarIcon className="h-4 w-4 text-[#5DBEBB]" />
              Livraison
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Date souhaitee</p>
                <p className="font-medium text-[#183559]">
                  {formatDate(order.desired_delivery_date)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Date confirmee</p>
                <p className="font-medium text-[#183559]">
                  {formatDate(order.confirmed_delivery_date)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Commande creee</p>
                <p className="font-medium text-[#183559]">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Suivi expedition */}
          {shipmentTracking.length > 0 && (
            <>
              <Separator />
              <OrderShipmentSection shipmentTracking={shipmentTracking} />
            </>
          )}

          <Separator />

          {/* Section: Articles */}
          <OrderItemsTable
            order={order}
            canViewCommissions={canViewCommissions}
          />

          <Separator />

          {/* Section: Totaux */}
          <OrderTotalsSection
            order={order}
            canViewCommissions={canViewCommissions}
          />

          {/* Section: Actions facture */}
          <section className="flex flex-col items-end gap-2 pt-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button
                variant="outline"
                className="border-[#5DBEBB] text-[#5DBEBB] hover:bg-[#5DBEBB]/10"
                disabled={invoiceLoading !== null}
                onClick={() => {
                  void handleInvoiceAction('view');
                }}
              >
                {invoiceLoading === 'view' ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <EyeIcon className="h-4 w-4 mr-2" />
                )}
                {invoiceLoading === 'view'
                  ? 'Chargement...'
                  : 'Visualiser facture'}
              </Button>
              <Button
                variant="default"
                className="bg-[#5DBEBB] hover:bg-[#4DAEAB] text-white"
                disabled={invoiceLoading !== null}
                onClick={() => {
                  void handleInvoiceAction('download');
                }}
              >
                {invoiceLoading === 'download' ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DownloadIcon className="h-4 w-4 mr-2" />
                )}
                {invoiceLoading === 'download'
                  ? 'Chargement...'
                  : 'Telecharger facture'}
              </Button>
            </div>
            {invoiceError && (
              <p className="text-xs text-red-500">{invoiceError}</p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';

import { Badge, Button, Card, CardContent } from '@verone/ui';
import {
  CheckCircle2,
  RotateCcw,
  Truck,
  XCircle,
  StickyNote,
} from 'lucide-react';

import { OrderTimeline } from '@verone/orders';
import { PaymentSection } from '@/components/orders/PaymentSection';
import { ShipmentCardsSection } from './ShipmentCardsSection';
import { InvoicesSection } from '@/components/orders/InvoicesSection';
import { QuotesSection } from '@/components/orders/QuotesSection';

import type { OrderWithDetails, FusedContactGroup } from './types';
import { ContactsUnified } from './ContactsUnified';
import { RequestMissingFieldModal } from './RequestMissingFieldModal';

// ============================================
// PROPS
// ============================================

export interface RightColumnProps {
  order: OrderWithDetails;
  locked: boolean;
  fusedContacts: FusedContactGroup[];
  // Status
  isUpdatingStatus: boolean;
  onStatusChange: (newStatus: string) => void;
  // Shipment modal
  onOpenShipmentModal: () => void;
  // Contact dialog
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
  // History
  historyEvents: ReturnType<
    typeof import('@verone/orders').useOrderHistory
  >['events'];
  historyLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function RightColumn({
  order,
  locked,
  fusedContacts,
  isUpdatingStatus,
  onStatusChange,
  onOpenShipmentModal,
  onOpenContactDialog,
  historyEvents,
  historyLoading,
}: RightColumnProps) {
  const [requestModalRole, setRequestModalRole] = useState<
    'responsable' | 'billing' | 'delivery' | null
  >(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      draft: 'secondary',
      validated: 'default',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      validated: 'Validée',
      cancelled: 'Annulée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
    };
    return (
      <Badge variant={variants[status] ?? 'outline'}>
        {labels[status] ?? status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* STATUT + ACTIONS */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
          </div>
          <div className="space-y-2">
            {order.status === 'draft' && !order.pending_admin_validation && (
              <Button
                className="w-full gap-2"
                disabled={isUpdatingStatus}
                onClick={() => onStatusChange('validated')}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isUpdatingStatus ? 'En cours...' : 'Valider la commande'}
              </Button>
            )}
            {order.status === 'draft' && order.pending_admin_validation && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                En attente d&apos;approbation. Rendez-vous dans{' '}
                <a
                  href="/canaux-vente/linkme/approbations"
                  className="underline font-medium hover:text-amber-700"
                >
                  Approbations
                </a>{' '}
                pour traiter cette commande.
              </div>
            )}
            {order.status === 'validated' && (
              <>
                <Button className="w-full gap-2" onClick={onOpenShipmentModal}>
                  <Truck className="h-4 w-4" />
                  Expédier
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange('draft')}
                >
                  <RotateCcw className="h-4 w-4" />
                  {isUpdatingStatus
                    ? 'En cours...'
                    : 'Dévalider (retour brouillon)'}
                </Button>
              </>
            )}
            {/* shipped is a terminal status before delivery — no further action */}
            {order.status !== 'cancelled' &&
              order.status !== 'delivered' &&
              order.status !== 'shipped' && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange('cancelled')}
                >
                  <XCircle className="h-4 w-4" />
                  {isUpdatingStatus ? 'En cours...' : 'Annuler'}
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {/* EXPEDITION — historique + statut (PR #716) */}
      <ShipmentCardsSection
        order={order}
        onOpenShipmentModal={onOpenShipmentModal}
      />

      {/* CONTACTS: section unifiée (PR #719) — affiche contacts FK + rôles manquants */}
      <ContactsUnified
        order={order}
        fusedContacts={fusedContacts}
        locked={locked}
        onOpenContactDialog={onOpenContactDialog}
        onOpenRequestModal={role => setRequestModalRole(role)}
      />
      <RequestMissingFieldModal
        open={!!requestModalRole}
        onClose={() => setRequestModalRole(null)}
        order={order}
        role={requestModalRole}
        onSuccess={() => setRequestModalRole(null)}
      />

      {/* PAIEMENT + RAPPROCHEMENT (intégrés) — masqué si commande en attente d'approbation */}
      {!order.pending_admin_validation && (
        <PaymentSection
          orderId={order.id}
          orderNumber={order.order_number}
          orderStatus={order.status}
          totalHt={order.total_ht ?? 0}
          totalTtc={order.total_ttc ?? 0}
          taxRate={order.tax_rate ?? 20}
          currency={order.currency ?? 'EUR'}
          paymentTerms={order.payment_terms ?? 'immediate'}
          paymentStatus={
            order.payment_status_v2 ?? order.payment_status ?? 'pending'
          }
          paidAmount={order.paid_amount ?? 0}
          customerName={
            order.organisation?.trade_name ??
            order.organisation?.legal_name ??
            'Client inconnu'
          }
          customerNameAlt={
            order.organisation?.legal_name &&
            order.organisation.legal_name !== order.organisation.trade_name
              ? order.organisation.legal_name
              : null
          }
          customerEmail={order.organisation?.email ?? null}
          customerType="organization"
          orderDate={order.created_at ?? null}
          shippingCostHt={order.shipping_cost_ht ?? 0}
          handlingCostHt={order.handling_cost_ht ?? 0}
          insuranceCostHt={order.insurance_cost_ht ?? 0}
          feesVatRate={order.fees_vat_rate ?? 0.2}
          orderItems={order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            tax_rate: order.tax_rate ?? 20,
            products: item.product ? { name: item.product.name } : null,
          }))}
          isMatched={order.is_matched}
          matchedTransactionLabel={order.matched_transaction_label}
          matchedTransactionAmount={order.matched_transaction_amount}
          matchedTransactionEmittedAt={order.matched_transaction_emitted_at}
          matchedTransactionId={order.matched_transaction_id}
        />
      )}

      {/* DEVIS */}
      <QuotesSection orderId={order.id} />

      {/* FACTURES */}
      <InvoicesSection orderId={order.id} />

      {/* NOTES */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <StickyNote className="h-3 w-3" />
              Notes
            </p>
          </div>
          {order.notes ? (
            <p className="text-xs text-gray-600">{order.notes}</p>
          ) : (
            <p className="text-xs text-gray-400 italic">Aucune note</p>
          )}
        </CardContent>
      </Card>

      {/* HISTORIQUE */}
      <OrderTimeline events={historyEvents} loading={historyLoading} />
    </div>
  );
}

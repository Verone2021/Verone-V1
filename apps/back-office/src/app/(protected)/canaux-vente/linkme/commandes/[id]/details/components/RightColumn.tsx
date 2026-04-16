'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Truck,
  User,
  XCircle,
  Mail,
  StickyNote,
} from 'lucide-react';

import { OrderTimeline } from '@verone/orders';
import { PaymentSection } from '@/components/orders/PaymentSection';
import { InvoicesSection } from '@/components/orders/InvoicesSection';

import type { OrderWithDetails, ContactRole, FusedContactGroup } from './types';

// ============================================
// PROPS
// ============================================

export interface RightColumnProps {
  order: OrderWithDetails;
  locked: boolean;
  fusedContacts: FusedContactGroup[];
  details: OrderWithDetails['linkmeDetails'];
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
  details,
  isUpdatingStatus,
  onStatusChange,
  onOpenShipmentModal,
  onOpenContactDialog,
  historyEvents,
  historyLoading,
}: RightColumnProps) {
  const roleLabels: Record<ContactRole, string> = {
    responsable: 'Resp.',
    billing: 'Fact.',
    delivery: 'Livr.',
  };
  const roleBadgeColors: Record<ContactRole, string> = {
    responsable: 'bg-blue-100 text-blue-700',
    billing: 'bg-green-100 text-green-700',
    delivery: 'bg-cyan-100 text-cyan-700',
  };

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

      {/* CONTACTS: Cards fusionnées via FK — compact */}
      {fusedContacts.length > 0 ? (
        fusedContacts.map(group => {
          const initials =
            `${group.contact.first_name[0] ?? ''}${group.contact.last_name[0] ?? ''}`.toUpperCase();
          const fullName = `${group.contact.first_name} ${group.contact.last_name}`;

          return (
            <Card key={group.contact.id}>
              <CardContent className="p-3">
                {/* Buttons row — above everything */}
                {!locked && (
                  <div className="flex items-center justify-end gap-1 mb-1.5">
                    {group.roles.length === 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-1.5 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          onOpenContactDialog(group.roles[0]);
                        }}
                      >
                        <Pencil className="h-2.5 w-2.5 mr-0.5" />
                        Changer
                      </Button>
                    ) : (
                      group.roles.map(role => (
                        <Button
                          key={role}
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] px-1.5 text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            onOpenContactDialog(role);
                          }}
                        >
                          <Pencil className="h-2.5 w-2.5 mr-0.5" />
                          {roleLabels[role]}
                        </Button>
                      ))
                    )}
                  </div>
                )}
                {/* Contact info + badges inline */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-[10px]">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 leading-tight">
                        {fullName}
                      </span>
                      {group.roles.map(role => (
                        <span
                          key={role}
                          className={`px-1.5 py-0 text-[9px] font-semibold rounded-full leading-4 ${roleBadgeColors[role]}`}
                        >
                          {roleLabels[role]}
                        </span>
                      ))}
                      {group.contact.title && (
                        <span className="text-[10px] text-gray-400">
                          {group.contact.title}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-gray-500">
                      {group.contact.email && (
                        <a
                          href={`mailto:${group.contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {group.contact.email}
                        </a>
                      )}
                      {group.contact.phone && (
                        <span>{group.contact.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Billing address if billing role */}
                {group.roles.includes('billing') && order.organisation && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-500">
                    <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span>
                      {order.organisation.billing_address_line1
                        ? [
                            order.organisation.billing_address_line1,
                            order.organisation.billing_postal_code,
                            order.organisation.billing_city,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        : [
                            order.organisation.address_line1,
                            order.organisation.postal_code,
                            order.organisation.city,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : (
        /* Fallback: anciennes commandes sans FK — afficher depuis flat fields */
        <>
          {/* Responsable (flat) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">Responsable</CardTitle>
                </div>
                {!locked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenContactDialog('responsable')}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Changer
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {details ? (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-sm">
                      {(details.requester_name ?? '')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {details.requester_name}
                    </p>
                    {details.requester_email && (
                      <a
                        href={`mailto:${details.requester_email}`}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {details.requester_email}
                      </a>
                    )}
                    {details.requester_phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        {details.requester_phone}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Non disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Facturation (flat) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-100">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-base">Facturation</CardTitle>
                </div>
                {!locked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenContactDialog('billing')}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Changer
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {details ? (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">
                      {(details.billing_name ?? '')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {details.billing_name ?? 'Non renseigné'}
                    </p>
                    {details.billing_email && (
                      <a
                        href={`mailto:${details.billing_email}`}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {details.billing_email}
                      </a>
                    )}
                    {details.billing_phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        {details.billing_phone}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Non disponible</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

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
          customerName={
            order.organisation?.trade_name ??
            order.organisation?.legal_name ??
            'Client inconnu'
          }
          customerEmail={order.organisation?.email ?? null}
          customerType="organization"
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

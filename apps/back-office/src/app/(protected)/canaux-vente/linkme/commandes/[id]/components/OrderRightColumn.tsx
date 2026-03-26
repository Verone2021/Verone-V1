'use client';

import { OrderTimeline, type OrderHistoryEvent } from '@verone/orders';

import { PaymentSection } from '@/components/orders/PaymentSection';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { MissingFieldsResult } from '../../../utils/order-missing-fields';

import { StatusActionsCard } from './StatusActionsCard';
import { ContactsPanel } from './ContactsPanel';
import { DemandeurCard } from './DemandeurCard';
import { InfoRequestsCard } from './InfoRequestsCard';

import type { OrderWithDetails, FusedContactGroup, ContactRole } from './types';

interface OrderRightColumnProps {
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  fusedContacts: FusedContactGroup[];
  missingFieldsResult: MissingFieldsResult | null;
  approveIsPending: boolean;
  historyEvents: OrderHistoryEvent[];
  historyLoading: boolean;
  onApprove: () => void;
  onRequestInfo: () => void;
  onReject: () => void;
  onChangeContact: (role: ContactRole) => void;
}

export function OrderRightColumn({
  order,
  details,
  fusedContacts,
  missingFieldsResult,
  approveIsPending,
  historyEvents,
  historyLoading,
  onApprove,
  onRequestInfo,
  onReject,
  onChangeContact,
}: OrderRightColumnProps) {
  return (
    <div className="space-y-4">
      <StatusActionsCard
        status={order.status}
        missingFieldsResult={missingFieldsResult}
        approveIsPending={approveIsPending}
        onApprove={onApprove}
        onRequestInfo={onRequestInfo}
        onReject={onReject}
      />

      <ContactsPanel
        fusedContacts={fusedContacts}
        details={details}
        organisation={order.organisation}
        onChangeContact={onChangeContact}
      />

      <DemandeurCard
        createdByProfile={order.createdByProfile}
        linkmeDetails={order.linkmeDetails}
      />

      <InfoRequestsCard infoRequests={order.infoRequests} />

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
      />

      <OrderTimeline events={historyEvents} loading={historyLoading} />
    </div>
  );
}

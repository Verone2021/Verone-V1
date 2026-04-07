'use client';

import {
  InvoiceCreateFromOrderModal,
  QuoteCreateFromOrderModal,
} from '@verone/finance/components';
import type { ExistingLink } from '@verone/finance/components';
import { OrganisationQuickViewModal } from '@verone/organisations';
import type {
  SalesOrder,
  ManualPaymentType,
  OrderPayment,
  CreateOrderItemData,
} from '@verone/orders/hooks';

import { AddProductToOrderModal } from '../AddProductToOrderModal';
import {
  SendOrderDocumentsModal,
  type LinkedDocument,
  type OrderContact,
} from '../SendOrderDocumentsModal';
import { OrderPaymentDialog } from './OrderPaymentDialog';
import type { ILinkedQuote } from './OrderInvoicingCard';

export interface OrderSubModalsProps {
  order: SalesOrder;
  onUpdate?: () => void;

  // Add product modal
  showAddProductModal: boolean;
  onCloseAddProductModal: () => void;
  onAddItem: (data: CreateOrderItemData) => Promise<void>;

  // Payment dialog
  showPaymentDialog: boolean;
  setShowPaymentDialog: (v: boolean) => void;
  orderPayments: OrderPayment[];
  existingLinks: ExistingLink[];
  rapprochementOrder: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_name_alt: string | null;
    total_ttc: number;
    paid_amount: number;
    created_at: string;
    order_date: string | null;
    shipped_at: string | null;
    payment_status_v2: string | null | undefined;
  } | null;
  deletingPaymentId: string | null;
  onRefreshPayments: () => void;
  onDeletePayment: (paymentId: string) => void;
  onLinksChanged: (links: ExistingLink[]) => void;
  manualPaymentType: ManualPaymentType;
  manualPaymentAmount: string;
  manualPaymentDate: string;
  manualPaymentRef: string;
  manualPaymentNote: string;
  onSetManualPaymentType: (v: ManualPaymentType) => void;
  onSetManualPaymentAmount: (v: string) => void;
  onSetManualPaymentDate: (v: string) => void;
  onSetManualPaymentRef: (v: string) => void;
  onSetManualPaymentNote: (v: string) => void;
  onSubmitManualPayment: () => void;
  paymentSubmitting: boolean;

  // Org quick view
  showOrgModal: boolean;
  setShowOrgModal: (v: boolean) => void;

  // Invoice modal
  showInvoiceModal: boolean;
  setShowInvoiceModal: (v: boolean) => void;

  // Quote modal
  showQuoteModal: boolean;
  setShowQuoteModal: (v: boolean) => void;
  setLinkedQuotes: (v: ILinkedQuote[]) => void;

  // Send docs modal
  showSendDocsModal: boolean;
  onCloseSendDocsModal: () => void;
  linkedDocuments: LinkedDocument[];
  orderContacts: OrderContact[];
}

export function OrderSubModals({
  order,
  onUpdate,
  showAddProductModal,
  onCloseAddProductModal,
  onAddItem,
  showPaymentDialog,
  setShowPaymentDialog,
  orderPayments,
  existingLinks,
  rapprochementOrder,
  deletingPaymentId,
  onRefreshPayments,
  onDeletePayment,
  onLinksChanged,
  manualPaymentType,
  manualPaymentAmount,
  manualPaymentDate,
  manualPaymentRef,
  manualPaymentNote,
  onSetManualPaymentType,
  onSetManualPaymentAmount,
  onSetManualPaymentDate,
  onSetManualPaymentRef,
  onSetManualPaymentNote,
  onSubmitManualPayment,
  paymentSubmitting,
  showOrgModal,
  setShowOrgModal,
  showInvoiceModal,
  setShowInvoiceModal,
  showQuoteModal,
  setShowQuoteModal,
  setLinkedQuotes,
  showSendDocsModal,
  onCloseSendDocsModal,
  linkedDocuments,
  orderContacts,
}: OrderSubModalsProps) {
  const customerName =
    order.customer_type === 'organization' && order.organisations
      ? (order.organisations.trade_name ?? order.organisations.legal_name ?? '')
      : order.customer_type === 'individual' && order.individual_customers
        ? [
            order.individual_customers.first_name,
            order.individual_customers.last_name,
          ]
            .filter(Boolean)
            .join(' ')
        : '';

  return (
    <>
      {/* Modal Ajout Produit */}
      <AddProductToOrderModal
        open={showAddProductModal}
        onClose={onCloseAddProductModal}
        orderType="sales"
        onAdd={async data => {
          await onAddItem(data);
          onUpdate?.();
          onCloseAddProductModal();
        }}
      />

      {/* Dialog Enregistrer un paiement */}
      <OrderPaymentDialog
        open={showPaymentDialog}
        onClose={setShowPaymentDialog}
        order={order}
        orderPayments={orderPayments}
        existingLinks={existingLinks}
        rapprochementOrder={rapprochementOrder}
        deletingPaymentId={deletingPaymentId}
        onRefreshPayments={onRefreshPayments}
        onDeletePayment={onDeletePayment}
        onLinksChanged={onLinksChanged}
        manualPaymentType={manualPaymentType}
        manualPaymentAmount={manualPaymentAmount}
        manualPaymentDate={manualPaymentDate}
        manualPaymentRef={manualPaymentRef}
        manualPaymentNote={manualPaymentNote}
        onSetManualPaymentType={onSetManualPaymentType}
        onSetManualPaymentAmount={onSetManualPaymentAmount}
        onSetManualPaymentDate={onSetManualPaymentDate}
        onSetManualPaymentRef={onSetManualPaymentRef}
        onSetManualPaymentNote={onSetManualPaymentNote}
        onSubmitManualPayment={onSubmitManualPayment}
        paymentSubmitting={paymentSubmitting}
      />

      {/* Modal Quick View Organisation */}
      {order.customer_id && order.customer_type === 'organization' && (
        <OrganisationQuickViewModal
          organisationId={order.customer_id}
          open={showOrgModal}
          onOpenChange={setShowOrgModal}
        />
      )}

      {/* Modal Creation Facture */}
      <InvoiceCreateFromOrderModal
        order={
          order
            ? {
                id: order.id,
                order_number: order.order_number,
                total_ht: order.total_ht,
                total_ttc: order.total_ttc,
                tax_rate: order.tax_rate,
                currency: order.currency,
                payment_terms: order.payment_terms ?? 'net_30',
                customer_id: order.customer_id,
                customer_type: order.customer_type,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                billing_address: order.billing_address,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                shipping_address: order.shipping_address,
                shipping_cost_ht: order.shipping_cost_ht,
                handling_cost_ht: order.handling_cost_ht,
                insurance_cost_ht: order.insurance_cost_ht,
                fees_vat_rate: order.fees_vat_rate,
                organisations: order.organisations,
                individual_customers: order.individual_customers,
                sales_order_items: order.sales_order_items,
              }
            : null
        }
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onSuccess={() => {
          onUpdate?.();
        }}
      />

      {/* Modal Creation Devis */}
      <QuoteCreateFromOrderModal
        order={
          order
            ? {
                id: order.id,
                order_number: order.order_number,
                total_ht: order.total_ht,
                total_ttc: order.total_ttc,
                tax_rate: order.tax_rate,
                currency: order.currency,
                payment_terms: order.payment_terms ?? 'net_30',
                customer_id: order.customer_id,
                customer_type: order.customer_type,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                billing_address: order.billing_address,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                shipping_address: order.shipping_address,
                shipping_cost_ht: order.shipping_cost_ht,
                handling_cost_ht: order.handling_cost_ht,
                insurance_cost_ht: order.insurance_cost_ht,
                fees_vat_rate: order.fees_vat_rate,
                organisations: order.organisations,
                individual_customers: order.individual_customers,
                sales_order_items: order.sales_order_items,
              }
            : null
        }
        open={showQuoteModal}
        onOpenChange={setShowQuoteModal}
        onSuccess={() => {
          onUpdate?.();
          if (order?.id) {
            void fetch(`/api/qonto/quotes/by-order/${order.id}`)
              .then(r => r.json())
              .then((data: { quotes?: ILinkedQuote[] }) => {
                setLinkedQuotes(data.quotes ?? []);
              })
              .catch(() => {
                /* ignore */
              });
          }
        }}
      />

      {/* Modal Envoi Documents */}
      <SendOrderDocumentsModal
        open={showSendDocsModal}
        onClose={onCloseSendDocsModal}
        salesOrderId={order.id}
        orderNumber={order.order_number}
        customerName={customerName}
        contacts={orderContacts}
        linkedDocuments={linkedDocuments}
        onSent={() => {
          onUpdate?.();
        }}
      />
    </>
  );
}

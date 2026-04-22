'use client';

import { useState, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type {
  SalesOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';
import type { ExistingLink } from '@verone/finance/components';
import type { LinkedDocument, OrderContact } from '../SendOrderDocumentsModal';
import type { ILinkedInvoice, ILinkedQuote } from './OrderInvoicingCard';
import type { ShipmentHistoryItem } from './OrderShipmentHistoryCard';

export type { OrderDetailDataState } from './order-detail-types';
import type { OrderDetailDataState } from './order-detail-types';

export function useOrderDetailData(
  order: SalesOrder | null,
  open: boolean
): OrderDetailDataState {
  const [isEditing, setIsEditing] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSendDocsModal, setShowSendDocsModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [linkedInvoices, setLinkedInvoices] = useState<ILinkedInvoice[]>([]);
  const [loadingLinkedInvoices, setLoadingLinkedInvoices] = useState(false);
  const [linkedQuotes, setLinkedQuotes] = useState<ILinkedQuote[]>([]);
  const [loadingLinkedQuotes, setLoadingLinkedQuotes] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedDocument[]>([]);
  const [orderContacts, setOrderContacts] = useState<OrderContact[]>([]);

  const [manualPaymentType, setManualPaymentType] =
    useState<ManualPaymentType>('card');
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [manualPaymentRef, setManualPaymentRef] = useState('');
  const [manualPaymentNote, setManualPaymentNote] = useState('');

  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null
  );

  const [shippingCostHt, setShippingCostHt] = useState(
    order?.shipping_cost_ht ?? 0
  );
  const [handlingCostHt, setHandlingCostHt] = useState(
    order?.handling_cost_ht ?? 0
  );
  const [insuranceCostHt, setInsuranceCostHt] = useState(
    order?.insurance_cost_ht ?? 0
  );
  const [feesVatRate, setFeesVatRate] = useState(order?.fees_vat_rate ?? 0.2);
  const [feesSaving, setFeesSaving] = useState(false);

  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistoryItem[]>(
    []
  );

  // Reset editing mode when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  // Charger historique expeditions quand modal ouvert
  useEffect(() => {
    if (!open || !order?.id) return;

    const supabase = createClient();

    void supabase
      .from('sales_order_shipments')
      .select(
        `
        id,
        shipped_at,
        tracking_number,
        tracking_url,
        notes,
        quantity_shipped,
        product_id,
        delivery_method,
        carrier_name,
        carrier_service,
        shipping_cost,
        packlink_status,
        packlink_shipment_id,
        label_url,
        products:product_id (name, sku)
      `
      )
      .eq('sales_order_id', order.id)
      .order('shipped_at', { ascending: true })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          console.error(
            '[OrderDetailModal] Load shipment history failed:',
            queryError
          );
          return;
        }

        if (!data || data.length === 0) {
          setShipmentHistory([]);
          return;
        }

        const rows = data as unknown as Array<
          Record<string, unknown> & {
            id: string;
            shipped_at: string;
            tracking_number: string | null;
            notes: string | null;
            quantity_shipped: number;
            products: { name: string; sku: string } | null;
          }
        >;

        const grouped = new Map<string, ShipmentHistoryItem>();

        for (const row of rows) {
          const key = row.shipped_at;
          const product = row.products;

          if (!grouped.has(key)) {
            grouped.set(key, {
              id: row.id,
              shipped_at: row.shipped_at,
              tracking_number: row.tracking_number,
              tracking_url: (row.tracking_url as string) ?? null,
              notes: row.notes,
              delivery_method: (row.delivery_method as string) ?? null,
              carrier_name: (row.carrier_name as string) ?? null,
              carrier_service: (row.carrier_service as string) ?? null,
              shipping_cost: (row.shipping_cost as number) ?? null,
              packlink_status: (row.packlink_status as string) ?? null,
              packlink_shipment_id:
                (row.packlink_shipment_id as string) ?? null,
              label_url: (row.label_url as string) ?? null,
              items: [],
            });
          }

          grouped.get(key)!.items.push({
            product_name: product?.name ?? 'Produit inconnu',
            product_sku: product?.sku ?? '-',
            quantity_shipped: row.quantity_shipped,
          });
        }

        setShipmentHistory(Array.from(grouped.values()));
      });
  }, [open, order?.id]);

  // Charger les factures liees a cette commande (QONTO API — NE PAS MODIFIER)
  useEffect(() => {
    if (!order?.id || !open) return;
    setLoadingLinkedInvoices(true);
    void fetch(`/api/qonto/invoices/by-order/${order.id}`)
      .then(r => r.json())
      .then((data: { invoices?: ILinkedInvoice[] }) => {
        setLinkedInvoices(data.invoices ?? []);
      })
      .catch(() => setLinkedInvoices([]))
      .finally(() => setLoadingLinkedInvoices(false));
  }, [order?.id, open]);

  // Charger les devis lies a cette commande (QONTO API — NE PAS MODIFIER)
  useEffect(() => {
    if (!order?.id || !open) return;
    setLoadingLinkedQuotes(true);
    void fetch(`/api/qonto/quotes/by-order/${order.id}`)
      .then(r => r.json())
      .then((data: { quotes?: ILinkedQuote[] }) => {
        setLinkedQuotes(data.quotes ?? []);
      })
      .catch(() => setLinkedQuotes([]))
      .finally(() => setLoadingLinkedQuotes(false));
  }, [order?.id, open]);

  // Charger les documents financiers lies (devis + factures) pour SendOrderDocumentsModal
  useEffect(() => {
    if (!order?.id || !open) return;
    const supabase = createClient();

    void supabase
      .from('financial_documents')
      .select(
        'id, document_number, document_type, qonto_invoice_id, qonto_pdf_url, total_ttc, status, quote_status'
      )
      .eq('sales_order_id', order.id)
      .in('document_type', ['customer_quote', 'customer_invoice'])
      .then(({ data, error: queryError }) => {
        if (queryError) {
          console.error(
            '[OrderDetailModal] Load financial documents failed:',
            queryError
          );
          setLinkedDocuments([]);
          return;
        }
        setLinkedDocuments(
          (data ?? []).map(d => ({
            id: d.id,
            document_number: d.document_number ?? '',
            document_type: d.document_type as
              | 'customer_quote'
              | 'customer_invoice',
            qonto_invoice_id: d.qonto_invoice_id,
            qonto_pdf_url: d.qonto_pdf_url,
            total_ttc: d.total_ttc ?? 0,
            status: d.status ?? '',
            quote_status: d.quote_status,
          }))
        );
      });

    // Charger les contacts pour SendOrderDocumentsModal
    const contacts: OrderContact[] = [];
    const seenEmails = new Set<string>();

    const bcEmail = order.billing_contact?.email;
    if (bcEmail) {
      const bc = order.billing_contact;
      const name = [bc?.first_name, bc?.last_name].filter(Boolean).join(' ');
      contacts.push({
        label: `${name} (facturation)`,
        email: bcEmail,
      });
      seenEmails.add(bcEmail);
    }

    const dcEmail = order.delivery_contact?.email;
    if (dcEmail && !seenEmails.has(dcEmail)) {
      const dc = order.delivery_contact;
      const name = [dc?.first_name, dc?.last_name].filter(Boolean).join(' ');
      contacts.push({ label: `${name} (livraison)`, email: dcEmail });
      seenEmails.add(dcEmail);
    }

    if (order.customer_type === 'organization' && order.organisations?.email) {
      const orgEmail = order.organisations.email;
      if (!seenEmails.has(orgEmail)) {
        const orgName =
          order.organisations.trade_name ??
          order.organisations.legal_name ??
          'Organisation';
        contacts.push({ label: `${orgName} (principal)`, email: orgEmail });
        seenEmails.add(orgEmail);
      }
    }

    if (
      order.customer_type === 'individual' &&
      order.individual_customers?.email
    ) {
      const indivEmail = order.individual_customers.email;
      if (!seenEmails.has(indivEmail)) {
        const name = [
          order.individual_customers.first_name,
          order.individual_customers.last_name,
        ]
          .filter(Boolean)
          .join(' ');
        contacts.push({ label: name || 'Client', email: indivEmail });
      }
    }

    setOrderContacts(contacts);
  }, [
    order?.id,
    open,
    order?.customer_type,
    order?.organisations,
    order?.individual_customers,
    order?.billing_contact,
    order?.delivery_contact,
  ]);

  // Sync fees state when order changes
  useEffect(() => {
    setShippingCostHt(order?.shipping_cost_ht ?? 0);
    setHandlingCostHt(order?.handling_cost_ht ?? 0);
    setInsuranceCostHt(order?.insurance_cost_ht ?? 0);
    setFeesVatRate(order?.fees_vat_rate ?? 0.2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  // Memoize order object for RapprochementContent BEFORE early return (Rules of Hooks)
  const rapprochementOrder = useMemo(() => {
    if (!order) return null;
    const customerName =
      order.customer_type === 'organization' && order.organisations
        ? (order.organisations.trade_name ?? order.organisations.legal_name)
        : order.customer_type === 'individual' && order.individual_customers
          ? `${order.individual_customers.first_name} ${order.individual_customers.last_name}`
          : 'Client inconnu';
    const customerNameAlt: string | null =
      order.customer_type === 'organization' && order.organisations?.trade_name
        ? (order.organisations.legal_name ?? null)
        : null;
    return {
      id: order.id,
      order_number: order.order_number,
      customer_name: customerName,
      customer_name_alt: customerNameAlt,
      total_ttc: order.total_ttc ?? 0,
      paid_amount: order.paid_amount ?? 0,
      created_at: order.created_at,
      order_date: order.order_date ?? null,
      shipped_at: order.shipped_at ?? null,
      payment_status_v2: order.payment_status_v2,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    order?.id,
    order?.order_number,
    order?.total_ttc,
    order?.paid_amount,
    order?.created_at,
    order?.order_date,
    order?.shipped_at,
    order?.payment_status_v2,
    order?.customer_type,
    order?.organisations,
    order?.individual_customers,
  ]);

  return {
    isEditing,
    setIsEditing,
    showInvoiceModal,
    setShowInvoiceModal,
    showQuoteModal,
    setShowQuoteModal,
    showSendDocsModal,
    setShowSendDocsModal,
    showAddProductModal,
    setShowAddProductModal,
    showPaymentDialog,
    setShowPaymentDialog,
    showOrgModal,
    setShowOrgModal,
    paymentSubmitting,
    setPaymentSubmitting,
    orderPayments,
    setOrderPayments,
    existingLinks,
    setExistingLinks,
    deletingPaymentId,
    setDeletingPaymentId,
    manualPaymentType,
    setManualPaymentType,
    manualPaymentAmount,
    setManualPaymentAmount,
    manualPaymentDate,
    setManualPaymentDate,
    manualPaymentRef,
    setManualPaymentRef,
    manualPaymentNote,
    setManualPaymentNote,
    linkedInvoices,
    setLinkedInvoices,
    loadingLinkedInvoices,
    linkedQuotes,
    setLinkedQuotes,
    loadingLinkedQuotes,
    linkedDocuments,
    orderContacts,
    shipmentHistory,
    shippingCostHt,
    setShippingCostHt,
    handlingCostHt,
    setHandlingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    feesVatRate,
    setFeesVatRate,
    feesSaving,
    setFeesSaving,
    rapprochementOrder,
  };
}

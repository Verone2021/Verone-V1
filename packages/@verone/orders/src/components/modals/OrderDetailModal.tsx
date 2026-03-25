'use client';

import { useState, useEffect, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import {
  InvoiceCreateFromOrderModal,
  QuoteCreateFromOrderModal,
} from '@verone/finance/components';
import type { ExistingLink } from '@verone/finance/components';
import { OrganisationQuickViewModal } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import {
  X,
  Package,
  Truck,
  Calendar,
  MapPin,
  FileText,
  Store,
  ExternalLink,
  User,
  Mail,
} from 'lucide-react';

import { useSalesOrders, useOrderItems } from '@verone/orders/hooks';
import { isOrderLocked as isOrderLockedFn } from '../../validators/order-status';
import { createClient } from '@verone/utils/supabase/client';
import type {
  SalesOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';
import { AddProductToOrderModal } from './AddProductToOrderModal';
import {
  SendOrderDocumentsModal,
  type LinkedDocument,
  type OrderContact,
} from './SendOrderDocumentsModal';

import {
  orderStatusLabels,
  orderStatusColors,
  buildOrgBillingAddress,
  buildOrgShippingAddress,
  getEffectiveAddress,
  isSameFormattedAddress,
  OrderProductsCard,
  OrderPaymentSummaryCard,
  OrderReconciliationCard,
  OrderShipmentHistoryCard,
  OrderInvoicingCard,
  OrderPaymentDialog,
} from './order-detail';
import type {
  ILinkedInvoice,
  ILinkedQuote,
  ShipmentHistoryItem,
} from './order-detail';

interface OrderDetailModalProps {
  order: SalesOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  readOnly?: boolean;
  channelRedirectUrl?: string | null;
}

export function OrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
  readOnly = false,
  channelRedirectUrl,
}: OrderDetailModalProps) {
  const { markAsManuallyPaid, fetchOrderPayments, deleteManualPayment } =
    useSalesOrders();
  const { addItem, updateItem, removeItem } = useOrderItems({
    orderId: order?.id ?? '',
    orderType: 'sales',
  });
  const router = useRouter();
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

  // Form state for manual payment
  const [manualPaymentType, setManualPaymentType] =
    useState<ManualPaymentType>('card');
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [manualPaymentRef, setManualPaymentRef] = useState('');
  const [manualPaymentNote, setManualPaymentNote] = useState('');

  // Unified payment summary state
  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  const [existingLinks, setExistingLinks] = useState<ExistingLink[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null
  );

  // Fees editable state
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

  // Historique expeditions
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
              shipped_at: row.shipped_at,
              tracking_number: row.tracking_number,
              tracking_url: (row.tracking_url as string) ?? null,
              notes: row.notes,
              delivery_method: (row.delivery_method as string) ?? null,
              carrier_name: (row.carrier_name as string) ?? null,
              carrier_service: (row.carrier_service as string) ?? null,
              shipping_cost: (row.shipping_cost as number) ?? null,
              packlink_status: (row.packlink_status as string) ?? null,
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

  // Charger les factures liees a cette commande
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

  // Charger les devis lies a cette commande (Qonto API via purchase_order_number)
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
    const customerNameAlt =
      order.customer_type === 'organization' && order.organisations?.trade_name
        ? order.organisations.legal_name
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

  if (!order) return null;

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCustomerName = () => {
    if (order.customer_type === 'organization' && order.organisations) {
      return order.organisations.trade_name ?? order.organisations.legal_name;
    } else if (
      order.customer_type === 'individual' &&
      order.individual_customers
    ) {
      const customer = order.individual_customers;
      return `${customer.first_name} ${customer.last_name}`;
    }
    return 'Client inconnu';
  };

  const getCustomerType = () => {
    return order.customer_type === 'organization'
      ? 'Professionnel'
      : 'Particulier';
  };

  const remainingAmount = Math.max(
    0,
    (order.total_ttc ?? 0) - (order.paid_amount ?? 0)
  );

  const canMarkAsPaid =
    ['validated', 'partially_shipped', 'shipped'].includes(order.status) &&
    order.payment_status_v2 !== 'paid';

  const openPaymentDialog = () => {
    setManualPaymentType('card');
    setManualPaymentAmount(
      remainingAmount > 0
        ? remainingAmount.toFixed(2)
        : Math.abs(order.total_ttc ?? 0).toFixed(2)
    );
    setManualPaymentDate(
      (order.order_date ?? order.created_at ?? new Date().toISOString()).split(
        'T'
      )[0]
    );
    setManualPaymentRef('');
    setManualPaymentNote('');
    setShowPaymentDialog(true);
    void fetchOrderPayments(order.id)
      .then(setOrderPayments)
      .catch(console.error);
  };

  const refreshPayments = () => {
    void fetchOrderPayments(order.id)
      .then(setOrderPayments)
      .catch(console.error);
    onUpdate?.();
  };

  const handleDeletePayment = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    void deleteManualPayment(paymentId)
      .then(() => {
        refreshPayments();
      })
      .catch(console.error)
      .finally(() => setDeletingPaymentId(null));
  };

  // Unified totals for payment dialog remaining calculation
  const manualTotal = orderPayments.reduce((sum, p) => sum + p.amount, 0);
  const linksTotal = existingLinks.reduce(
    (sum, l) => sum + l.allocated_amount,
    0
  );
  const totalPaid = manualTotal + linksTotal;
  const orderTotalTtc = Math.abs(order.total_ttc || 0);
  const unifiedRemaining = Math.max(0, orderTotalTtc - totalPaid);

  const saveFees = async () => {
    setFeesSaving(true);
    const supabase = createClient();
    await supabase
      .from('sales_orders')
      .update({
        shipping_cost_ht: shippingCostHt,
        handling_cost_ht: handlingCostHt,
        insurance_cost_ht: insuranceCostHt,
        fees_vat_rate: feesVatRate,
      })
      .eq('id', order.id);
    setFeesSaving(false);
    onUpdate?.();
  };

  const canShip = ['validated', 'partially_shipped'].includes(order.status);

  const activeInvoices = linkedInvoices.filter(
    inv => inv.status !== 'cancelled'
  );
  const hasActiveInvoice = activeInvoices.length > 0;

  const isLocked =
    readOnly || isOrderLockedFn(order.status) || hasActiveInvoice;

  const handleSubmitManualPayment = () => {
    setPaymentSubmitting(true);
    void markAsManuallyPaid(
      order.id,
      manualPaymentType,
      parseFloat(manualPaymentAmount),
      {
        reference: manualPaymentRef || undefined,
        note: manualPaymentNote || undefined,
        date: manualPaymentDate ? new Date(manualPaymentDate) : undefined,
      }
    )
      .then(() => {
        refreshPayments();
        setManualPaymentAmount(
          Math.max(
            0,
            unifiedRemaining - parseFloat(manualPaymentAmount || '0')
          ).toFixed(2)
        );
        setManualPaymentRef('');
        setManualPaymentNote('');
      })
      .catch((err: unknown) => {
        console.error('[OrderDetailModal] Manual payment failed:', err);
      })
      .finally(() => setPaymentSubmitting(false));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-7xl max-h-[90vh] overflow-y-auto"
          hideCloseButton
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl">
                  Commande {order.order_number}
                </DialogTitle>
                <Badge className={orderStatusColors[order.status]}>
                  {orderStatusLabels[order.status]}
                </Badge>
                {order.sales_channel?.name && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {order.sales_channel.name}
                  </Badge>
                )}
              </div>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row gap-4 mt-3">
            {/* COLONNE PRINCIPALE (70%) - Produits */}
            <div className="flex-1 order-2 lg:order-1">
              <OrderProductsCard
                order={order}
                isEditing={isEditing}
                isLocked={isLocked}
                hasActiveInvoice={hasActiveInvoice}
                shippingCostHt={shippingCostHt}
                insuranceCostHt={insuranceCostHt}
                handlingCostHt={handlingCostHt}
                feesVatRate={feesVatRate}
                feesSaving={feesSaving}
                onSetIsEditing={setIsEditing}
                onSetShippingCostHt={setShippingCostHt}
                onSetInsuranceCostHt={setInsuranceCostHt}
                onSetHandlingCostHt={setHandlingCostHt}
                onSetFeesVatRate={setFeesVatRate}
                onSaveFees={() => void saveFees().catch(console.error)}
                onShowAddProductModal={() => setShowAddProductModal(true)}
                onUpdateItem={(itemId, data) =>
                  void updateItem(itemId, data)
                    .then(() => onUpdate?.())
                    .catch((err: unknown) =>
                      console.error(
                        '[OrderDetailModal] Update item failed:',
                        err
                      )
                    )
                }
                onRemoveItem={itemId =>
                  void removeItem(itemId)
                    .then(() => onUpdate?.())
                    .catch((err: unknown) =>
                      console.error(
                        '[OrderDetailModal] Delete item failed:',
                        err
                      )
                    )
                }
                onUpdate={onUpdate}
              />
            </div>

            {/* SIDEBAR (35%) */}
            <div className="w-full lg:w-[420px] space-y-3 order-1 lg:order-2">
              {/* Card Client */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {order.customer_id &&
                        order.customer_type === 'organization' ? (
                          <button
                            type="button"
                            onClick={() => setShowOrgModal(true)}
                            className="text-left text-primary hover:underline cursor-pointer"
                          >
                            {getCustomerName()}
                          </button>
                        ) : (
                          getCustomerName()
                        )}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getCustomerType()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Créée : {formatDate(order.created_at)}</span>
                  </div>
                  {order.creator && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-3 w-3" />
                      <span>
                        Par : {order.creator.first_name}{' '}
                        {order.creator.last_name}
                      </span>
                    </div>
                  )}
                  {order.expected_delivery_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Truck className="h-3 w-3" />
                      <span>
                        Livraison : {formatDate(order.expected_delivery_date)}
                      </span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Package className="h-3 w-3" />
                      <span>Expédiée : {formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Package className="h-3 w-3" />
                      <span>Livrée : {formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                  {/* Email + téléphone client individuel */}
                  {order.customer_type === 'individual' &&
                    order.individual_customers?.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="h-3 w-3" />
                        <span>{order.individual_customers.email}</span>
                      </div>
                    )}
                  {order.customer_type === 'individual' &&
                    order.individual_customers?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-3 w-3" />
                        <span>{order.individual_customers.phone}</span>
                      </div>
                    )}
                  {/* Adresses condensees */}
                  {(() => {
                    const org = order.organisations;
                    const orgBilling = org ? buildOrgBillingAddress(org) : null;
                    const orgShipping = org
                      ? buildOrgShippingAddress(org)
                      : null;

                    const billing = getEffectiveAddress(
                      order.billing_address,
                      orgBilling
                    );
                    const shipping = getEffectiveAddress(
                      order.shipping_address,
                      orgShipping
                    );

                    // Pour les clients individuels, construire l'adresse depuis individual_customers
                    const indiv = order.individual_customers;
                    const indivAddress =
                      order.customer_type === 'individual' &&
                      indiv?.address_line1
                        ? {
                            source: 'manual' as const,
                            formatted: {
                              lines: [
                                indiv.address_line1,
                                indiv.address_line2,
                              ].filter(Boolean) as string[],
                              cityLine: [indiv.postal_code, indiv.city]
                                .filter(Boolean)
                                .join(' '),
                            },
                          }
                        : null;

                    const effectiveBilling = billing ?? indivAddress;
                    const effectiveShipping = shipping ?? indivAddress;

                    if (!effectiveBilling && !effectiveShipping) return null;

                    const areSame =
                      !!effectiveBilling &&
                      !!effectiveShipping &&
                      effectiveBilling.source === effectiveShipping.source &&
                      isSameFormattedAddress(
                        effectiveBilling.formatted,
                        effectiveShipping.formatted
                      );

                    const sourceLabel = (s: 'manual' | 'organisation') =>
                      s === 'organisation' ? '(organisation)' : '(manuelle)';

                    if (areSame && effectiveBilling) {
                      return (
                        <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="font-medium text-gray-700 mb-0.5">
                              Facturation et livraison{' '}
                              {sourceLabel(effectiveBilling.source)}
                            </p>
                            {effectiveBilling.formatted.lines.map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                            {effectiveBilling.formatted.cityLine && (
                              <p>{effectiveBilling.formatted.cityLine}</p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {effectiveBilling && (
                          <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-gray-700 mb-0.5">
                                Facturation{' '}
                                {sourceLabel(effectiveBilling.source)}
                              </p>
                              {effectiveBilling.formatted.lines.map(
                                (line, i) => (
                                  <p key={i}>{line}</p>
                                )
                              )}
                              {effectiveBilling.formatted.cityLine && (
                                <p>{effectiveBilling.formatted.cityLine}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {effectiveShipping && (
                          <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-gray-700 mb-0.5">
                                Livraison{' '}
                                {sourceLabel(effectiveShipping.source)}
                              </p>
                              {effectiveShipping.formatted.lines.map(
                                (line, i) => (
                                  <p key={i}>{line}</p>
                                )
                              )}
                              {effectiveShipping.formatted.cityLine && (
                                <p>{effectiveShipping.formatted.cityLine}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Card Paiement */}
              <OrderPaymentSummaryCard
                order={order}
                readOnly={readOnly}
                canMarkAsPaid={canMarkAsPaid}
                onOpenPaymentDialog={openPaymentDialog}
              />

              {/* Card Rapprochement Bancaire */}
              <OrderReconciliationCard order={order} />

              {/* Card Facturation + Devis */}
              <OrderInvoicingCard
                order={order}
                readOnly={readOnly}
                linkedInvoices={linkedInvoices}
                linkedQuotes={linkedQuotes}
                loadingLinkedInvoices={loadingLinkedInvoices}
                loadingLinkedQuotes={loadingLinkedQuotes}
                activeInvoices={activeInvoices}
                hasActiveInvoice={hasActiveInvoice}
                onShowInvoiceModal={() => setShowInvoiceModal(true)}
                onShowQuoteModal={() => setShowQuoteModal(true)}
              />

              {/* Card Expedition */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-3 w-3" />
                    Expédition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.delivered_at ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-green-100 text-green-800 border-green-200"
                    >
                      Livrée le {formatDate(order.delivered_at)}
                    </Badge>
                  ) : (order.status as string) === 'delivered' ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-green-100 text-green-800 border-green-200"
                    >
                      Livrée
                    </Badge>
                  ) : order.shipped_at ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
                    >
                      Expédiée le {formatDate(order.shipped_at)}
                    </Badge>
                  ) : order.status === 'shipped' ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
                    >
                      Expédiée
                    </Badge>
                  ) : order.status === 'partially_shipped' ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Partiellement expédiée
                    </Badge>
                  ) : shipmentHistory.length > 0 &&
                    shipmentHistory.some(
                      h => h.packlink_status === 'a_payer'
                    ) ? (
                    <div className="space-y-2">
                      <Badge
                        variant="secondary"
                        className="w-full justify-center bg-orange-100 text-orange-800 border-orange-200"
                      >
                        Transport à payer (Packlink)
                      </Badge>
                      <a
                        href="https://pro.packlink.fr/private/shipments"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-xs text-orange-700 hover:text-orange-900 underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Payer sur Packlink PRO
                      </a>
                    </div>
                  ) : shipmentHistory.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
                    >
                      Expédition en cours
                    </Badge>
                  ) : (
                    <p className="text-center text-xs text-gray-500">
                      Pas encore expédiée
                    </p>
                  )}

                  {!readOnly && canShip && shipmentHistory.length === 0 && (
                    <ButtonV2
                      size="sm"
                      className="w-full"
                      disabled
                      title="Fonctionnalité en cours de développement"
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Gérer expédition
                    </ButtonV2>
                  )}
                </CardContent>
              </Card>

              {/* Card Historique Expeditions */}
              <OrderShipmentHistoryCard
                shipmentHistory={shipmentHistory}
                order={order}
              />

              {/* Card Notes (si existe) */}
              {order.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Card Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {channelRedirectUrl && (
                    <ButtonV2
                      variant="default"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push(channelRedirectUrl)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Gérer dans {order.sales_channel?.name ?? 'CMS'}
                    </ButtonV2>
                  )}

                  {!readOnly && (
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowSendDocsModal(true)}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Envoyer documents
                      {linkedDocuments.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] px-1.5 py-0"
                        >
                          {linkedDocuments.length}
                        </Badge>
                      )}
                    </ButtonV2>
                  )}

                  {readOnly && !channelRedirectUrl && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Mode lecture seule
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Produit */}
      <AddProductToOrderModal
        open={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        orderType="sales"
        onAdd={async data => {
          await addItem(data);
          onUpdate?.();
          setShowAddProductModal(false);
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
        onRefreshPayments={refreshPayments}
        onDeletePayment={handleDeletePayment}
        onLinksChanged={setExistingLinks}
        manualPaymentType={manualPaymentType}
        manualPaymentAmount={manualPaymentAmount}
        manualPaymentDate={manualPaymentDate}
        manualPaymentRef={manualPaymentRef}
        manualPaymentNote={manualPaymentNote}
        onSetManualPaymentType={setManualPaymentType}
        onSetManualPaymentAmount={setManualPaymentAmount}
        onSetManualPaymentDate={setManualPaymentDate}
        onSetManualPaymentRef={setManualPaymentRef}
        onSetManualPaymentNote={setManualPaymentNote}
        onSubmitManualPayment={handleSubmitManualPayment}
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
        onClose={() => setShowSendDocsModal(false)}
        salesOrderId={order.id}
        orderNumber={order.order_number}
        customerName={
          order.customer_type === 'organization' && order.organisations
            ? (order.organisations.trade_name ??
              order.organisations.legal_name ??
              '')
            : order.customer_type === 'individual' && order.individual_customers
              ? [
                  order.individual_customers.first_name,
                  order.individual_customers.last_name,
                ]
                  .filter(Boolean)
                  .join(' ')
              : ''
        }
        contacts={orderContacts}
        linkedDocuments={linkedDocuments}
        onSent={() => {
          onUpdate?.();
        }}
      />
    </>
  );
}

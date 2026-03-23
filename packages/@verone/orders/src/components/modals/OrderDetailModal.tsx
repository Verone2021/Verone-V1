'use client';

import { useState, useEffect, useMemo } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  InvoiceCreateFromOrderModal,
  QuoteCreateFromOrderModal,
  RapprochementContent,
} from '@verone/finance/components';
import type { ExistingLink } from '@verone/finance/components';
import { OrganisationQuickViewModal } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Separator } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  X,
  Package,
  CreditCard,
  Truck,
  Calendar,
  MapPin,
  FileText,
  Store,
  ExternalLink,
  Link2,
  Link2Off,
  Banknote,
  History,
  CheckCircle2,
  Pencil,
  Trash2,
  User,
  Mail,
} from 'lucide-react';

// NOTE: SalesOrderShipmentModal supprimé - sera recréé ultérieurement
import { useSalesOrders, useOrderItems } from '@verone/orders/hooks';
import { isOrderLocked as isOrderLockedFn } from '../../validators/order-status';
import { createClient } from '@verone/utils/supabase/client';
import type {
  SalesOrder,
  ManualPaymentType,
  OrderItem,
  OrderPayment,
} from '@verone/orders/hooks';
import { EditableOrderItemRow } from '../tables/EditableOrderItemRow';
import { AddProductToOrderModal } from './AddProductToOrderModal';
import {
  SendOrderDocumentsModal,
  type LinkedDocument,
  type OrderContact,
} from './SendOrderDocumentsModal';

interface ILinkedInvoice {
  id: string;
  document_number: string | null;
  status: string | null;
  total_ttc: number;
  qonto_invoice_id: string | null;
}

interface OrderDetailModalProps {
  order: SalesOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  readOnly?: boolean; // Mode lecture seule pour commandes d'autres canaux
  channelRedirectUrl?: string | null; // URL de redirection vers CMS du canal
}

const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  cancelled: 'Annulée',
};

const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

/** Format an address from JSONB (handles structured, legacy text, and string formats) */
function formatOrderAddress(
  addr: unknown
): { lines: string[]; cityLine: string } | null {
  if (!addr) return null;
  if (typeof addr === 'string') {
    const trimmed = addr.trim();
    if (!trimmed) return null;
    // Try to parse JSON strings (handles double-encoded JSONB)
    if (trimmed.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          return formatOrderAddress(parsed);
        }
      } catch {
        // Not valid JSON, treat as plain text
      }
    }
    return { lines: [trimmed], cityLine: '' };
  }
  if (typeof addr !== 'object') return null;
  const obj = addr as Record<string, string | null | undefined>;

  // Legacy format: single "address" field with newlines
  if (obj.address && typeof obj.address === 'string') {
    const lines = obj.address
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return lines.length > 0 ? { lines, cityLine: '' } : null;
  }

  // Structured format: address_line1, city, postal_code, etc.
  const streetLines = [obj.address_line1, obj.line1, obj.address_line2]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map(v => v.trim());
  const cityLine = [obj.postal_code, obj.city]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map(v => v.trim())
    .join(' ');
  const country =
    typeof obj.country === 'string' && obj.country.trim()
      ? obj.country.trim()
      : '';

  if (streetLines.length === 0 && !cityLine && !country) return null;

  const fullCityLine = [cityLine, country].filter(Boolean).join(', ');
  return { lines: streetLines, cityLine: fullCityLine };
}

/** Compare two formatted addresses (normalized: trim + lowercase) */
function isSameFormattedAddress(
  a: { lines: string[]; cityLine: string },
  b: { lines: string[]; cityLine: string }
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase();
  if (a.lines.length !== b.lines.length) return false;
  for (let i = 0; i < a.lines.length; i++) {
    if (normalize(a.lines[i]) !== normalize(b.lines[i])) return false;
  }
  return normalize(a.cityLine) === normalize(b.cityLine);
}

/** Build org address object for billing (billing fields with fallback to main address) */
function buildOrgBillingAddress(org: NonNullable<SalesOrder['organisations']>) {
  return {
    address_line1: org.billing_address_line1 ?? org.address_line1,
    address_line2: org.billing_address_line2 ?? org.address_line2,
    postal_code: org.billing_postal_code ?? org.postal_code,
    city: org.billing_city ?? org.city,
    country: org.billing_country,
  };
}

/** Build org address object for shipping (main address only, no shipping-specific fields) */
function buildOrgShippingAddress(
  org: NonNullable<SalesOrder['organisations']>
) {
  return {
    address_line1: org.address_line1,
    address_line2: org.address_line2,
    postal_code: org.postal_code,
    city: org.city,
  };
}

interface EffectiveAddress {
  formatted: { lines: string[]; cityLine: string };
  source: 'manual' | 'organisation';
}

/** Determine the effective address + its source */
function getEffectiveAddress(
  orderAddr: unknown,
  orgAddr: Record<string, string | null | undefined> | null
): EffectiveAddress | null {
  const fromOrder = formatOrderAddress(orderAddr);
  if (fromOrder) {
    // Compare with org to determine source
    const fromOrg = orgAddr ? formatOrderAddress(orgAddr) : null;
    const isSameAsOrg = fromOrg && isSameFormattedAddress(fromOrder, fromOrg);
    return {
      formatted: fromOrder,
      source: isSameAsOrg ? 'organisation' : 'manual',
    };
  }
  // Fallback to org address
  if (orgAddr) {
    const fromOrg = formatOrderAddress(orgAddr);
    if (fromOrg) return { formatted: fromOrg, source: 'organisation' };
  }
  return null;
}

export function OrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
  readOnly = false,
  channelRedirectUrl,
}: OrderDetailModalProps) {
  // NOTE: showShippingModal supprimé - modal sera recréé ultérieurement
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
  const [linkedQuotes, setLinkedQuotes] = useState<
    Array<{
      id: string;
      quote_number: string;
      status: string;
      total_amount: number;
    }>
  >([]);
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

  // Historique expéditions
  const [shipmentHistory, setShipmentHistory] = useState<
    Array<{
      shipped_at: string;
      tracking_number: string | null;
      tracking_url: string | null;
      notes: string | null;
      delivery_method: string | null;
      carrier_name: string | null;
      carrier_service: string | null;
      shipping_cost: number | null;
      packlink_status: string | null;
      label_url: string | null;
      items: Array<{
        product_name: string;
        product_sku: string;
        quantity_shipped: number;
      }>;
    }>
  >([]);

  // Reset editing mode when modal closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  // Charger historique expéditions quand modal ouvert
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

        // Grouper par shipped_at (même timestamp = même expédition)
        // Cast nécessaire car les types générés ne connaissent pas encore
        // les colonnes ajoutées (carrier_name, packlink_status, etc.)
        const rows = data as unknown as Array<
          Record<string, unknown> & {
            shipped_at: string;
            tracking_number: string | null;
            notes: string | null;
            quantity_shipped: number;
            products: { name: string; sku: string } | null;
          }
        >;

        const grouped = new Map<
          string,
          {
            shipped_at: string;
            tracking_number: string | null;
            tracking_url: string | null;
            notes: string | null;
            delivery_method: string | null;
            carrier_name: string | null;
            carrier_service: string | null;
            shipping_cost: number | null;
            packlink_status: string | null;
            label_url: string | null;
            items: Array<{
              product_name: string;
              product_sku: string;
              quantity_shipped: number;
            }>;
          }
        >();

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

  // Charger les factures liées à cette commande
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

  // Charger les devis liés à cette commande (Qonto API via purchase_order_number)
  useEffect(() => {
    if (!order?.id || !open) return;
    setLoadingLinkedQuotes(true);
    void fetch(`/api/qonto/quotes/by-order/${order.id}`)
      .then(r => r.json())
      .then(
        (data: {
          quotes?: Array<{
            id: string;
            quote_number: string;
            status: string;
            total_amount: number;
          }>;
        }) => {
          setLinkedQuotes(data.quotes ?? []);
        }
      )
      .catch(() => setLinkedQuotes([]))
      .finally(() => setLoadingLinkedQuotes(false));
  }, [order?.id, open]);

  // Charger les documents financiers liés (devis + factures) pour SendOrderDocumentsModal
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

    // Contact facturation de la commande
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

    // Contact livraison
    const dcEmail = order.delivery_contact?.email;
    if (dcEmail && !seenEmails.has(dcEmail)) {
      const dc = order.delivery_contact;
      const name = [dc?.first_name, dc?.last_name].filter(Boolean).join(' ');
      contacts.push({ label: `${name} (livraison)`, email: dcEmail });
      seenEmails.add(dcEmail);
    }

    // Email organisation
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

    // Email client individuel
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

  const _getCustomerNameAlt = (): string | null => {
    if (order.customer_type === 'organization' && order.organisations) {
      // Si trade_name est le principal, retourner legal_name comme alt
      if (order.organisations.trade_name) {
        return order.organisations.legal_name;
      }
    }
    return null;
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
    // Pre-fill form with defaults
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
    // Fetch manual payments for unified summary
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

  // Unified totals for the payment summary
  const manualTotal = orderPayments.reduce((sum, p) => sum + p.amount, 0);
  const linksTotal = existingLinks.reduce(
    (sum, l) => sum + l.allocated_amount,
    0
  );
  const totalPaid = manualTotal + linksTotal;
  const orderTotalTtc = Math.abs(order.total_ttc || 0);
  const unifiedRemaining = Math.max(0, orderTotalTtc - totalPaid);
  const isFullyPaid = totalPaid >= orderTotalTtc && orderTotalTtc > 0;

  const paymentTypeLabels: Record<string, string> = {
    cash: 'Espèces',
    check: 'Chèque',
    transfer_other: 'Virement bancaire',
    card: 'Carte bancaire',
    compensation: 'Compensation',
  };

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

  // Workflow Odoo-inspired: Permettre expédition pour validated + partially_shipped
  const canShip = ['validated', 'partially_shipped'].includes(order.status);

  const activeInvoices = linkedInvoices.filter(
    inv => inv.status !== 'cancelled'
  );
  const hasActiveInvoice = activeInvoices.length > 0;

  const isLocked =
    readOnly || isOrderLockedFn(order.status) || hasActiveInvoice;

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

          {/* LAYOUT IDENTIQUE À PurchaseOrderDetailModal : Flex avec colonne principale + sidebar */}
          <div className="flex flex-col lg:flex-row gap-4 mt-3">
            {/* COLONNE PRINCIPALE (70%) - Produits DataTable UNIQUEMENT */}
            <div className="flex-1 order-2 lg:order-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produits ({order.sales_order_items?.length ?? 0} article
                      {(order.sales_order_items?.length ?? 0) > 1 ? 's' : ''})
                    </CardTitle>
                    {isLocked ? (
                      <Badge variant="secondary" className="text-xs">
                        {order.status === 'shipped'
                          ? '🔒 Expédiée — lecture seule'
                          : hasActiveInvoice
                            ? '🔒 Facture émise — lecture seule'
                            : '🔒 Lecture seule'}
                      </Badge>
                    ) : isEditing ? (
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Terminer l&apos;édition
                      </ButtonV2>
                    ) : (
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-7 text-xs"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </ButtonV2>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* TABLE RESPONSIVE avec scroll horizontal mobile + hauteur limitée */}
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Image</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="w-20 text-right">Qté</TableHead>
                          <TableHead className="w-28 text-right">
                            Prix HT
                          </TableHead>
                          <TableHead className="w-28 text-right">
                            Total HT
                          </TableHead>
                          <TableHead className="w-24 text-center">
                            Expédié
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isEditing
                          ? order.sales_order_items?.map(item => (
                              <EditableOrderItemRow
                                key={item.id}
                                item={item as unknown as OrderItem}
                                orderType="sales"
                                readonly={false}
                                onUpdate={(itemId, data) =>
                                  void updateItem(itemId, data)
                                    .then(() => onUpdate?.())
                                    .catch((err: unknown) =>
                                      console.error(
                                        '[OrderDetailModal] Update item failed:',
                                        err
                                      )
                                    )
                                }
                                onDelete={itemId =>
                                  void removeItem(itemId)
                                    .then(() => onUpdate?.())
                                    .catch((err: unknown) =>
                                      console.error(
                                        '[OrderDetailModal] Delete item failed:',
                                        err
                                      )
                                    )
                                }
                              />
                            ))
                          : order.sales_order_items?.map(item => {
                              const primaryImage =
                                item.products?.primary_image_url ?? null;
                              const lineHT =
                                item.quantity *
                                item.unit_price_ht *
                                (1 - (item.discount_percentage || 0) / 100);
                              const shippedQty =
                                (
                                  item as unknown as {
                                    quantity_shipped?: number;
                                  }
                                ).quantity_shipped ?? 0;

                              return (
                                <TableRow
                                  key={item.id}
                                  className="hover:bg-gray-50"
                                >
                                  <TableCell>
                                    {primaryImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={primaryImage}
                                        alt={item.products?.name ?? 'Produit'}
                                        className="w-12 h-12 object-cover rounded border"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                        <Package className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {item.products?.name ?? 'Produit'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {item.products?.sku ?? '—'}
                                      </p>
                                      {(item.discount_percentage || 0) > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] mt-0.5 text-orange-600 border-orange-200"
                                        >
                                          -{item.discount_percentage}%
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.unit_price_ht)}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatCurrency(lineHT)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {shippedQty > 0 ? (
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] ${shippedQty >= item.quantity ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                                      >
                                        {shippedQty}/{item.quantity}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-gray-400">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* BOUTON AJOUTER PRODUIT */}
                  {isEditing && (
                    <div className="mt-2">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddProductModal(true)}
                        className="w-full border-dashed"
                      >
                        <Package className="h-3 w-3 mr-1" />+ Ajouter un produit
                      </ButtonV2>
                    </div>
                  )}

                  {/* TOTAUX (bas de table) */}
                  <Separator className="my-4" />
                  {(() => {
                    // === CALCUL TVA PAR LIGNE DE PRODUIT ===
                    // Grouper les lignes par taux de TVA
                    const tvaByRate: Record<
                      number,
                      { ht: number; tva: number }
                    > = {};
                    let productsHT = 0;

                    order.sales_order_items?.forEach(item => {
                      const lineHT =
                        item.quantity *
                        item.unit_price_ht *
                        (1 - (item.discount_percentage || 0) / 100);
                      const lineTaxRate = item.tax_rate || 0.2;
                      const lineTVA = lineHT * lineTaxRate;

                      productsHT += lineHT;

                      if (!tvaByRate[lineTaxRate]) {
                        tvaByRate[lineTaxRate] = { ht: 0, tva: 0 };
                      }
                      tvaByRate[lineTaxRate].ht += lineHT;
                      tvaByRate[lineTaxRate].tva += lineTVA;
                    });

                    // Trier les taux de TVA (du plus élevé au plus bas)
                    const sortedRates = Object.keys(tvaByRate)
                      .map(Number)
                      .sort((a, b) => b - a);

                    // TVA totale produits
                    const totalProductsTVA = Object.values(tvaByRate).reduce(
                      (sum, v) => sum + v.tva,
                      0
                    );

                    // === FRAIS — en mode édition: states locaux, sinon: order.xxx ===
                    const displayShippingHt = isEditing
                      ? shippingCostHt
                      : (order.shipping_cost_ht ?? 0);
                    const displayInsuranceHt = isEditing
                      ? insuranceCostHt
                      : (order.insurance_cost_ht ?? 0);
                    const displayHandlingHt = isEditing
                      ? handlingCostHt
                      : (order.handling_cost_ht ?? 0);
                    const displayFeesVatRate = isEditing
                      ? feesVatRate
                      : (order.fees_vat_rate ?? 0.2);
                    const totalFeesHT =
                      displayShippingHt +
                      displayInsuranceHt +
                      displayHandlingHt;

                    // TVA des frais (taux unique pour tous les frais)
                    const feesTVA = totalFeesHT * displayFeesVatRate;

                    // === TOTAUX GLOBAUX ===
                    const totalHT = productsHT + totalFeesHT;
                    const totalTVA = totalProductsTVA + feesTVA;
                    const totalTTC = totalHT + totalTVA;

                    return (
                      <div className="space-y-2 text-right">
                        {/* Total HT Produits */}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Total HT produits :
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(productsHT)}
                          </span>
                        </div>

                        {/* Frais additionnels — éditables inline si !isLocked */}
                        <div className="pt-2 mt-2 border-t border-dashed space-y-2">
                          {/* Livraison */}
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span className="flex-shrink-0">
                              Frais de livraison HT :
                            </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={shippingCostHt}
                                onChange={e =>
                                  setShippingCostHt(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 h-6 text-xs text-right"
                              />
                            ) : (
                              <span>{formatCurrency(displayShippingHt)}</span>
                            )}
                          </div>
                          {/* Assurance */}
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span className="flex-shrink-0">
                              Frais d&apos;assurance HT :
                            </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={insuranceCostHt}
                                onChange={e =>
                                  setInsuranceCostHt(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 h-6 text-xs text-right"
                              />
                            ) : (
                              <span>{formatCurrency(displayInsuranceHt)}</span>
                            )}
                          </div>
                          {/* Manutention */}
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span className="flex-shrink-0">
                              Frais de manutention HT :
                            </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={handlingCostHt}
                                onChange={e =>
                                  setHandlingCostHt(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 h-6 text-xs text-right"
                              />
                            ) : (
                              <span>{formatCurrency(displayHandlingHt)}</span>
                            )}
                          </div>
                          {/* Sélecteur TVA frais + bouton save (si éditable) */}
                          {isEditing && (
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex gap-1">
                                {[0, 0.055, 0.1, 0.2].map(rate => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setFeesVatRate(rate)}
                                    className={`text-xs py-0.5 px-1.5 rounded border ${feesVatRate === rate ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-gray-50'}`}
                                  >
                                    {(rate * 100).toFixed(1).replace('.0', '')}%
                                  </button>
                                ))}
                              </div>
                              <ButtonV2
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void saveFees().catch(console.error)
                                }
                                disabled={feesSaving}
                                className="h-6 text-xs px-2"
                              >
                                {feesSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                              </ButtonV2>
                            </div>
                          )}
                        </div>

                        {/* Total HT global */}
                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                          <span className="text-gray-700">Total HT :</span>
                          <span>{formatCurrency(totalHT)}</span>
                        </div>

                        {/* TVA par taux (produits) */}
                        <div className="pt-2 border-t border-dashed space-y-1">
                          {sortedRates.map(rate => (
                            <div
                              key={rate}
                              className="flex justify-between text-sm text-gray-600"
                            >
                              <span>
                                TVA{' '}
                                {(rate * 100).toFixed(rate === 0.055 ? 1 : 0)}%
                                (produits) :
                              </span>
                              <span>{formatCurrency(tvaByRate[rate].tva)}</span>
                            </div>
                          ))}
                          {/* TVA frais (si frais > 0) */}
                          {totalFeesHT > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>
                                TVA {(displayFeesVatRate * 100).toFixed(0)}%
                                (frais) :
                              </span>
                              <span>{formatCurrency(feesTVA)}</span>
                            </div>
                          )}
                        </div>

                        {/* Total TTC */}
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                          <span>Total TTC :</span>
                          <span className="text-primary">
                            {formatCurrency(totalTTC)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR (35%) - Informations contextuelles - IDENTIQUE À PurchaseOrderDetailModal */}
            <div className="w-full lg:w-[420px] space-y-3 order-1 lg:order-2">
              {/* Card Client CONDENSÉE (comme Fournisseur dans PurchaseOrderDetailModal) */}
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
                  {/* Adresses condensées - logique conditionnelle */}
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

                    if (!billing && !shipping) return null;

                    // Check if both addresses are identical (same content + same source)
                    const areSame =
                      !!billing &&
                      !!shipping &&
                      billing.source === shipping.source &&
                      isSameFormattedAddress(
                        billing.formatted,
                        shipping.formatted
                      );

                    const sourceLabel = (s: 'manual' | 'organisation') =>
                      s === 'organisation' ? '(organisation)' : '(manuelle)';

                    if (areSame && billing) {
                      // Merged: single block
                      return (
                        <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <p className="font-medium text-gray-700 mb-0.5">
                              Facturation et livraison{' '}
                              {sourceLabel(billing.source)}
                            </p>
                            {billing.formatted.lines.map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                            {billing.formatted.cityLine && (
                              <p>{billing.formatted.cityLine}</p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Separate blocks
                    return (
                      <>
                        {billing && (
                          <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-gray-700 mb-0.5">
                                Facturation {sourceLabel(billing.source)}
                              </p>
                              {billing.formatted.lines.map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                              {billing.formatted.cityLine && (
                                <p>{billing.formatted.cityLine}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {shipping && (
                          <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-gray-700 mb-0.5">
                                Livraison {sourceLabel(shipping.source)}
                              </p>
                              {shipping.formatted.lines.map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                              {shipping.formatted.cityLine && (
                                <p>{shipping.formatted.cityLine}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Card Paiement (comme PurchaseOrderDetailModal) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.payment_status_v2 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Statut :</span>
                      <Badge
                        className={`text-xs ${
                          order.payment_status_v2 === 'overpaid'
                            ? 'bg-red-100 text-red-800'
                            : order.payment_status_v2 === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : order.payment_status_v2 === 'partially_paid'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {order.payment_status_v2 === 'overpaid'
                          ? 'Surpayé'
                          : order.payment_status_v2 === 'paid'
                            ? 'Payé'
                            : order.payment_status_v2 === 'partially_paid'
                              ? 'Partiellement payé'
                              : 'En attente'}
                      </Badge>
                    </div>
                  )}

                  {order.payment_terms && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-800">
                        {order.payment_terms}
                      </p>
                    </div>
                  )}

                  {order.paid_amount !== undefined && order.paid_amount > 0 && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-xs text-gray-600">Montant payé</p>
                      <p className="text-sm font-bold text-green-700">
                        {formatCurrency(order.paid_amount)} /{' '}
                        {formatCurrency(order.total_ttc || 0)}
                      </p>
                      {order.paid_at && (
                        <p className="text-xs text-gray-600 mt-1">
                          Le {formatDate(order.paid_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {!readOnly && canMarkAsPaid && (
                    <ButtonV2
                      onClick={openPaymentDialog}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Banknote className="h-3 w-3 mr-1" />
                      Enregistrer un paiement
                    </ButtonV2>
                  )}
                </CardContent>
              </Card>

              {/* Card Rapprochement Bancaire */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-3 w-3" />
                    Rapprochement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.is_matched ? (
                    <div className="bg-green-50 p-3 rounded border border-green-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3 w-3 text-green-600" />
                        <p className="text-sm font-medium text-green-800">
                          Transaction liée
                        </p>
                      </div>
                      <p className="text-xs text-gray-700">
                        {order.matched_transaction_label ?? 'Transaction'}
                      </p>
                      <p className="text-sm font-bold text-green-700">
                        {formatCurrency(
                          Math.abs(order.matched_transaction_amount ?? 0)
                        )}
                      </p>
                      {order.matched_transaction_emitted_at && (
                        <p className="text-xs text-gray-600">
                          Payé le{' '}
                          {formatDate(order.matched_transaction_emitted_at)}
                        </p>
                      )}
                      {order.matched_transaction_attachment_ids?.[0] && (
                        <a
                          href={`https://app.qonto.com/transactions/${order.matched_transaction_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir sur Qonto
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-2">
                      Non rapprochée
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Card Facturation */}
              {!readOnly &&
                order.status !== 'draft' &&
                order.status !== 'cancelled' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Facturation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingLinkedInvoices ? (
                        <ButtonV2 size="sm" className="w-full" disabled>
                          <FileText className="h-3 w-3 mr-1 animate-pulse" />
                          Chargement...
                        </ButtonV2>
                      ) : hasActiveInvoice ? (
                        <div className="space-y-1">
                          {activeInvoices.map(inv => (
                            <div
                              key={inv.id}
                              className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30"
                            >
                              <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              {inv.qonto_invoice_id ? (
                                <Link
                                  href={`/factures/${inv.qonto_invoice_id}?type=invoice`}
                                  target="_blank"
                                  className="font-mono text-xs flex-1 text-blue-600 hover:underline"
                                >
                                  {inv.document_number ?? inv.id.slice(0, 8)}
                                </Link>
                              ) : (
                                <span className="font-mono text-xs flex-1">
                                  {inv.document_number ?? inv.id.slice(0, 8)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ButtonV2
                          size="sm"
                          className="w-full"
                          onClick={() => setShowInvoiceModal(true)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Générer facture
                        </ButtonV2>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Card Devis (même pattern que Facturation) */}
              {!readOnly &&
                order.status !== 'draft' &&
                order.status !== 'cancelled' &&
                !linkedInvoices.some(inv => inv.status !== 'draft') && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Devis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingLinkedQuotes ? (
                        <ButtonV2 size="sm" className="w-full" disabled>
                          <FileText className="h-3 w-3 mr-1 animate-pulse" />
                          Chargement...
                        </ButtonV2>
                      ) : linkedQuotes.length > 0 ? (
                        <div className="space-y-1">
                          {linkedQuotes.map(q => (
                            <div
                              key={q.id}
                              className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30"
                            >
                              <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <Link
                                href={`/factures/devis/${q.id}`}
                                target="_blank"
                                className="font-mono text-xs flex-1 text-blue-600 hover:underline"
                              >
                                {q.quote_number}
                              </Link>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {q.status === 'draft'
                                  ? 'Brouillon'
                                  : q.status === 'finalized' ||
                                      q.status === 'pending_approval'
                                    ? 'En attente'
                                    : q.status === 'accepted'
                                      ? 'Accepté'
                                      : q.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ButtonV2
                          size="sm"
                          className="w-full"
                          onClick={() => setShowQuoteModal(true)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Créer un devis
                        </ButtonV2>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Card Expédition (comme Réception dans PurchaseOrderDetailModal) */}
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
                  ) : (
                    <p className="text-center text-xs text-gray-500">
                      Pas encore expédiée
                    </p>
                  )}

                  {!readOnly && canShip && (
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

              {/* Card Historique Expéditions (si existe) */}
              {shipmentHistory.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <History className="h-3 w-3" />
                      Historique ({shipmentHistory.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                    {shipmentHistory.map((h, idx) => (
                      <div
                        key={`shipment-${idx}`}
                        className="border rounded p-2 bg-gray-50 text-xs"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle2 className="h-3 w-3 text-blue-600" />
                          <span className="font-semibold text-gray-800">
                            Expédition #{idx + 1}
                          </span>
                          <span className="text-gray-400">—</span>
                          <span className="text-gray-600">
                            {formatDate(h.shipped_at)}
                          </span>
                          {h.carrier_name && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 ml-1"
                            >
                              {h.carrier_name}
                            </Badge>
                          )}
                          {h.packlink_status && (
                            <Badge
                              className={`text-[10px] px-1 py-0 ml-1 ${
                                h.packlink_status === 'a_payer'
                                  ? 'bg-red-100 text-red-800'
                                  : h.packlink_status === 'paye'
                                    ? 'bg-green-100 text-green-800'
                                    : h.packlink_status === 'in_transit'
                                      ? 'bg-blue-100 text-blue-800'
                                      : h.packlink_status === 'delivered'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {h.packlink_status === 'a_payer'
                                ? 'Transport à payer'
                                : h.packlink_status === 'paye'
                                  ? 'Transport payé'
                                  : h.packlink_status === 'in_transit'
                                    ? 'En transit'
                                    : h.packlink_status === 'delivered'
                                      ? 'Livré'
                                      : 'Incident'}
                            </Badge>
                          )}
                          {h.delivery_method && !h.packlink_status && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 ml-1"
                            >
                              {h.delivery_method === 'manual'
                                ? 'Manuel'
                                : h.delivery_method === 'pickup'
                                  ? 'Retrait'
                                  : h.delivery_method === 'hand_delivery'
                                    ? 'Main propre'
                                    : h.delivery_method}
                            </Badge>
                          )}
                        </div>
                        {h.packlink_status === 'a_payer' && (
                          <p className="text-[10px] ml-4 mb-1">
                            <a
                              href="https://pro.packlink.fr/private/shipments"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Finaliser sur Packlink PRO
                            </a>
                          </p>
                        )}
                        {h.tracking_number && (
                          <p className="text-[10px] text-gray-500 ml-4 mb-1">
                            Suivi :{' '}
                            {h.tracking_url ? (
                              <a
                                href={h.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {h.tracking_number}
                              </a>
                            ) : (
                              h.tracking_number
                            )}
                          </p>
                        )}
                        {h.shipping_cost != null && h.shipping_cost > 0 && (
                          <p className="text-[10px] text-gray-500 ml-4 mb-1">
                            Coût transport : {formatCurrency(h.shipping_cost)}
                          </p>
                        )}
                        {h.label_url && (
                          <p className="text-[10px] ml-4 mb-1">
                            <a
                              href={h.label_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Télécharger étiquette
                            </a>
                          </p>
                        )}
                        <div className="ml-4 space-y-0.5">
                          {h.items.map((item, itemIdx) => {
                            const orderItem = order.sales_order_items?.find(
                              i => i.products?.sku === item.product_sku
                            );
                            const qtyOrdered = orderItem?.quantity ?? '?';
                            return (
                              <div
                                key={itemIdx}
                                className="flex items-center justify-between"
                              >
                                <span className="text-gray-600 truncate max-w-[120px]">
                                  {item.product_name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {item.quantity_shipped}/{qtyOrdered}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                        {h.notes && (
                          <p className="text-[10px] text-gray-500 ml-4 mt-1 italic">
                            {h.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

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
                  {/* Bouton de redirection vers CMS du canal (si commande d'un autre canal) */}
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

                  {/* Bouton Envoyer documents — toujours visible si documents existent */}
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

                  {/* Message mode lecture seule */}
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

      {/* NOTE: Modal Gestion Expédition supprimé - sera recréé ultérieurement */}

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

      {/* Dialog Enregistrer un paiement (synthèse + 2 onglets) */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <p className="text-sm text-gray-500">
              Commande {order.order_number}
            </p>
          </DialogHeader>

          {/* === Unified payment summary (always visible) === */}
          <div className="p-3 bg-slate-100 rounded-lg">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-500">Montant total</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(orderTotalTtc)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deja paye</p>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Reste a payer</p>
                <p
                  className={`text-sm font-bold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {formatCurrency(unifiedRemaining)}
                </p>
              </div>
            </div>
          </div>

          {/* === Payment history (manual + bank links) === */}
          {(orderPayments.length > 0 || existingLinks.length > 0) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Historique des paiements (
                  {orderPayments.length + existingLinks.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {/* Manual payments */}
                {orderPayments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                          Manuel
                        </Badge>
                        <span className="font-medium truncate">
                          {paymentTypeLabels[payment.payment_type] ||
                            payment.payment_type}
                        </span>
                        <span className="font-bold text-green-700">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-5.5 flex gap-2">
                        <span>
                          {new Date(payment.payment_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                        {payment.reference && (
                          <span className="truncate">
                            Ref: {payment.reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={deletingPaymentId === payment.id}
                      className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Supprimer ce paiement"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {/* Bank reconciliation links */}
                {existingLinks.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                          Auto
                        </Badge>
                        <span className="font-medium truncate">
                          {link.counterparty_name ?? link.transaction_label}
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(link.allocated_amount)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-5.5 flex gap-2">
                        <span>
                          {new Date(link.transaction_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                        {link.bank_provider && (
                          <span>{link.bank_provider}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className="ml-2 p-1 text-slate-300"
                      title="Délier depuis l'onglet Rapprochement"
                    >
                      <Link2Off className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Tabs (below the summary) === */}
          <Tabs defaultValue="manual" className="mt-1">
            <TabsList className="w-full">
              <TabsTrigger value="rapprochement" className="flex-1">
                Rapprochement bancaire
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Paiement manuel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rapprochement" className="mt-4">
              <RapprochementContent
                order={rapprochementOrder}
                orderType={(order.total_ttc ?? 0) < 0 ? 'avoir' : 'sales_order'}
                onSuccess={() => {
                  refreshPayments();
                }}
                onLinksChanged={setExistingLinks}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-type">Type de paiement</Label>
                <Select
                  value={manualPaymentType}
                  onValueChange={v =>
                    setManualPaymentType(v as ManualPaymentType)
                  }
                >
                  <SelectTrigger id="payment-type">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer_other">
                      Virement bancaire
                    </SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                    <SelectItem value="compensation">Compensation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">
                  Montant (EUR)
                  {unifiedRemaining > 0 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      — Reste a payer : {unifiedRemaining.toFixed(2)} EUR
                    </span>
                  )}
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={unifiedRemaining}
                  value={manualPaymentAmount}
                  onChange={e => setManualPaymentAmount(e.target.value)}
                />
                {parseFloat(manualPaymentAmount) > unifiedRemaining + 0.01 && (
                  <p className="text-sm text-destructive">
                    Le montant dépasse le reste à payer (
                    {unifiedRemaining.toFixed(2)} EUR)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">Date du paiement</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={manualPaymentDate}
                  onChange={e => setManualPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-ref">
                  Reference{' '}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="payment-ref"
                  placeholder="N° chèque, réf. virement..."
                  value={manualPaymentRef}
                  onChange={e => setManualPaymentRef(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-note">
                  Note{' '}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="payment-note"
                  placeholder="Commentaire..."
                  value={manualPaymentNote}
                  onChange={e => setManualPaymentNote(e.target.value)}
                />
              </div>

              <ButtonV2
                onClick={() => {
                  setPaymentSubmitting(true);
                  void markAsManuallyPaid(
                    order.id,
                    manualPaymentType,
                    parseFloat(manualPaymentAmount),
                    {
                      reference: manualPaymentRef || undefined,
                      note: manualPaymentNote || undefined,
                      date: manualPaymentDate
                        ? new Date(manualPaymentDate)
                        : undefined,
                    }
                  )
                    .then(() => {
                      refreshPayments();
                      // Reset form for next payment
                      setManualPaymentAmount(
                        Math.max(
                          0,
                          unifiedRemaining -
                            parseFloat(manualPaymentAmount || '0')
                        ).toFixed(2)
                      );
                      setManualPaymentRef('');
                      setManualPaymentNote('');
                    })
                    .catch((err: unknown) => {
                      console.error(
                        '[OrderDetailModal] Manual payment failed:',
                        err
                      );
                    })
                    .finally(() => setPaymentSubmitting(false));
                }}
                disabled={
                  paymentSubmitting ||
                  !manualPaymentAmount ||
                  parseFloat(manualPaymentAmount) <= 0 ||
                  parseFloat(manualPaymentAmount) > unifiedRemaining + 0.01 ||
                  unifiedRemaining <= 0
                }
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {paymentSubmitting
                  ? 'Enregistrement...'
                  : 'Enregistrer le paiement'}
              </ButtonV2>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal Quick View Organisation */}
      {order.customer_id && order.customer_type === 'organization' && (
        <OrganisationQuickViewModal
          organisationId={order.customer_id}
          open={showOrgModal}
          onOpenChange={setShowOrgModal}
        />
      )}

      {/* Modal Création Facture */}
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

      {/* Modal Création Devis */}
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
          // Refresh linked quotes after creation
          if (order?.id) {
            void fetch(`/api/qonto/quotes/by-order/${order.id}`)
              .then(r => r.json())
              .then(
                (data: {
                  quotes?: Array<{
                    id: string;
                    quote_number: string;
                    status: string;
                    total_amount: number;
                  }>;
                }) => {
                  setLinkedQuotes(data.quotes ?? []);
                }
              )
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

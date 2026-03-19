'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  InvoiceCreateFromOrderModal,
  QuoteCreateFromOrderModal,
  type IOrderForInvoice,
  type IOrderForDocument,
} from '@verone/finance/components';
import { Badge, Button, Card, Skeleton, SuccessDialog } from '@verone/ui';
import {
  CheckCircle,
  CreditCard,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  ScrollText,
} from 'lucide-react';

/** Invoice linked to this order (from financial_documents) */
interface ILinkedInvoice {
  id: string;
  document_number: string;
  status: string;
  total_ttc: number;
  amount_paid: number;
  document_date: string;
  due_date: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
}

interface PaymentSectionProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  totalHt: number;
  totalTtc: number;
  taxRate: number;
  currency: string;
  paymentTerms: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string | null;
  customerType: 'organization' | 'individual';
  // Frais de service
  shippingCostHt?: number;
  handlingCostHt?: number;
  insuranceCostHt?: number;
  feesVatRate?: number;
  // Adresses
  billingAddress?: Record<string, string> | null;
  shippingAddress?: Record<string, string> | null;
  orderItems: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number;
    products?: {
      name: string;
    } | null;
  }>;
  // Rapprochement (intégré)
  isMatched?: boolean;
  matchedTransactionLabel?: string | null;
  matchedTransactionAmount?: number | null;
  matchedTransactionEmittedAt?: string | null;
  matchedTransactionId?: string | null;
}

function getInvoiceStatusLabel(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'finalized':
    case 'sent':
      return {
        label: 'Finalisee',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'paid':
      return {
        label: 'Payee',
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    case 'cancelled':
      return {
        label: 'Annulee',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
      };
    case 'synchronized':
    case 'draft':
      return {
        label: 'Brouillon',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
      };
  }
}

export function PaymentSection({
  orderId,
  orderNumber,
  orderStatus,
  totalHt,
  totalTtc,
  taxRate,
  currency,
  paymentTerms,
  paymentStatus,
  customerName,
  customerEmail,
  customerType,
  shippingCostHt,
  handlingCostHt,
  insuranceCostHt,
  feesVatRate,
  billingAddress,
  shippingAddress,
  orderItems,
  isMatched,
  matchedTransactionLabel,
  matchedTransactionAmount,
  matchedTransactionEmittedAt,
  matchedTransactionId,
}: PaymentSectionProps): React.ReactNode {
  const router = useRouter();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [linkedInvoices, setLinkedInvoices] = useState<ILinkedInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState('');

  // Fetch linked invoices from financial_documents
  const fetchLinkedInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const res = await fetch(`/api/qonto/invoices/by-order/${orderId}`);
      if (!res.ok) {
        console.error('[PaymentSection] Failed to fetch invoices:', res.status);
        return;
      }
      const data = (await res.json()) as {
        success: boolean;
        invoices?: ILinkedInvoice[];
      };
      setLinkedInvoices(data.invoices ?? []);
    } catch (error) {
      console.error('[PaymentSection] Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  }, [orderId]);

  useEffect(() => {
    void fetchLinkedInvoices();
  }, [fetchLinkedInvoices]);

  // Active invoices = not cancelled
  const activeInvoices = linkedInvoices.filter(
    inv => inv.status !== 'cancelled'
  );
  const hasActiveInvoice = activeInvoices.length > 0;

  // Draft invoice = synchronized or draft_validated (not yet finalized)
  const hasDraftInvoice = activeInvoices.some(inv => inv.status === 'draft');

  // Can create invoice if: not draft, not paid, AND no active invoice exists
  const canCreateInvoice =
    orderStatus !== 'draft' && paymentStatus !== 'paid' && !hasActiveInvoice;

  // Facture définitive = finalisée, envoyée ou payée (pas brouillon)
  const hasFinalizedInvoice = activeInvoices.some(
    inv => inv.status !== 'draft' && inv.status !== 'cancelled'
  );

  // Devis possible si : commande pas draft ET pas de facture définitive
  const canCreateQuote = orderStatus !== 'draft' && !hasFinalizedInvoice;

  // Preparer l'objet commande pour le modal de creation de facture
  const orderForInvoice: IOrderForInvoice = {
    id: orderId,
    order_number: orderNumber,
    total_ht: totalHt,
    total_ttc: totalTtc,
    tax_rate: taxRate,
    currency: currency,
    payment_terms: paymentTerms,
    billing_address: billingAddress as IOrderForInvoice['billing_address'],
    shipping_address: shippingAddress as IOrderForInvoice['shipping_address'],
    shipping_cost_ht: shippingCostHt ?? null,
    handling_cost_ht: handlingCostHt ?? null,
    insurance_cost_ht: insuranceCostHt ?? null,
    fees_vat_rate: feesVatRate ?? null,
    organisations:
      customerType === 'organization'
        ? { name: customerName, email: customerEmail }
        : null,
    individual_customers:
      customerType === 'individual'
        ? {
            first_name: customerName.split(' ')[0] ?? '',
            last_name: customerName.split(' ').slice(1).join(' ') ?? '',
            email: customerEmail,
          }
        : null,
    sales_order_items: orderItems,
  };

  const handleInvoiceCreated = (
    _invoiceId: string,
    invoiceNumber: string
  ): void => {
    setCreatedInvoiceNumber(invoiceNumber);
    setShowSuccessDialog(true);
  };

  const handleSuccessDialogClose = (): void => {
    setShowSuccessDialog(false);
    router.refresh();
    void fetchLinkedInvoices();
  };

  return (
    <>
      <Card>
        <div className="p-3 space-y-2">
          {/* Header: statut paiement */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paiement
              </span>
            </div>
            {paymentStatus === 'paid' ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200 text-[10px] px-1.5 py-0"
              >
                <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                Payé
              </Badge>
            ) : paymentStatus === 'partial' ||
              paymentStatus === 'partially_paid' ? (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] px-1.5 py-0"
              >
                Partiel
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0"
              >
                Non payé
              </Badge>
            )}
          </div>

          {/* Rapprochement — intégré */}
          {isMatched ? (
            <div className="bg-green-50 p-2 rounded border border-green-200 text-xs space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {matchedTransactionLabel ?? 'Transaction liée'}
                </span>
                <span className="font-bold text-green-700">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(Math.abs(matchedTransactionAmount ?? 0))}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                {matchedTransactionEmittedAt && (
                  <span>
                    Payé le{' '}
                    {new Date(matchedTransactionEmittedAt).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                )}
                {matchedTransactionId && (
                  <a
                    href={`https://app.qonto.com/transactions/${matchedTransactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Qonto
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Non rapprochée
            </p>
          )}

          {/* Factures liées — compact */}
          {loadingInvoices ? (
            <Skeleton className="h-6 w-full" />
          ) : hasActiveInvoice ? (
            <div className="space-y-1">
              {activeInvoices.map(invoice => {
                const statusInfo = getInvoiceStatusLabel(invoice.status);
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded border p-1.5 bg-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">
                        {invoice.document_number}
                      </span>
                      <span className="text-gray-400">
                        {invoice.total_ttc?.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`${statusInfo.className} text-[10px] px-1 py-0`}
                      >
                        {statusInfo.label}
                      </Badge>
                      <Link href={`/factures/${invoice.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Action buttons — compact */}
          <div className="flex gap-1">
            {!loadingInvoices && canCreateQuote && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => setShowQuoteModal(true)}
              >
                <ScrollText className="h-3 w-3 mr-1" />
                Devis
              </Button>
            )}
            {!loadingInvoices && canCreateInvoice ? (
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => setShowInvoiceModal(true)}
              >
                <FileText className="h-3 w-3 mr-1" />
                Facture
              </Button>
            ) : loadingInvoices ? (
              <Button size="sm" className="flex-1 h-7 text-xs" disabled>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ...
              </Button>
            ) : !loadingInvoices && hasDraftInvoice ? (
              <Button size="sm" className="flex-1 h-7 text-xs" disabled>
                <FileText className="h-3 w-3 mr-1" />
                Facture brouillon
              </Button>
            ) : !hasActiveInvoice && orderStatus === 'draft' ? (
              <p className="text-[10px] text-gray-400 text-center flex-1">
                Valider commande pour facturer
              </p>
            ) : !hasActiveInvoice && paymentStatus === 'paid' ? (
              <p className="text-[10px] text-gray-400 text-center flex-1">
                Déjà payée
              </p>
            ) : null}

            {paymentStatus !== 'paid' && orderStatus !== 'draft' && (
              <Link
                href={`/finance/rapprochement?orderId=${orderId}&amount=${totalTtc}`}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Associer paiement
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Modal creation devis */}
      <QuoteCreateFromOrderModal
        order={orderForInvoice as unknown as IOrderForDocument}
        open={showQuoteModal}
        onOpenChange={setShowQuoteModal}
        onSuccess={() => {
          void fetchLinkedInvoices();
        }}
      />

      {/* Modal creation facture */}
      <InvoiceCreateFromOrderModal
        order={orderForInvoice}
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onSuccess={handleInvoiceCreated}
      />

      {/* Modal confirmation après création */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={open => {
          if (!open) handleSuccessDialogClose();
        }}
        title="Facture créée"
        description={`La facture ${createdInvoiceNumber} a été créée en brouillon dans Qonto.`}
        closeText="OK"
      />
    </>
  );
}

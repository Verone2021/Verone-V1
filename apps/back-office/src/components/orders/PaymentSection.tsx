'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  InvoiceCreateFromOrderModal,
  QuoteCreateFromOrderModal,
  RapprochementFromOrderModal,
  type IOrderForInvoice,
  type IOrderForDocument,
  type OrderForLink,
} from '@verone/finance/components';
import { Badge, Button, Card, Skeleton, SuccessDialog } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  CheckCircle,
  CreditCard,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  ScrollText,
} from 'lucide-react';

import {
  getInvoiceStatusLabel,
  type ILinkedInvoice,
  type ILinkedTransaction,
} from './PaymentSection.helpers';

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
  /** Montant déjà rapproché (sum of allocated_amount on transaction_document_links) */
  paidAmount?: number;
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
  /** Date commande (pour scoring rapprochement) */
  orderDate?: string | null;
  /** Nom alternatif client (pour scoring rapprochement — legal_name vs trade_name) */
  customerNameAlt?: string | null;
  // Rapprochement (legacy prop: première transaction uniquement — prop kept for compat)
  isMatched?: boolean;
  matchedTransactionLabel?: string | null;
  matchedTransactionAmount?: number | null;
  matchedTransactionEmittedAt?: string | null;
  matchedTransactionId?: string | null;
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
  paidAmount = 0,
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
  orderDate,
  customerNameAlt,
  isMatched,
  matchedTransactionLabel,
  matchedTransactionAmount,
  matchedTransactionEmittedAt,
  matchedTransactionId,
}: PaymentSectionProps): React.ReactNode {
  const router = useRouter();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [linkedInvoices, setLinkedInvoices] = useState<ILinkedInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState('');

  // Auto-fetch: liste complète des transactions liées (N-N supporté)
  const [autoLinks, setAutoLinks] = useState<ILinkedTransaction[]>([]);

  const fetchAutoLinks = useCallback(async () => {
    try {
      const { createClient } = await import('@verone/utils/supabase/client');
      const supabase = createClient();
      const { data: links } = await supabase
        .from('transaction_document_links')
        .select(
          'id, allocated_amount, transaction_id, bank_transactions!inner(id, label, emitted_at)'
        )
        .eq('sales_order_id', orderId)
        .order('created_at', { ascending: true });

      if (!links || links.length === 0) {
        setAutoLinks([]);
        return;
      }

      const mapped: ILinkedTransaction[] = links.map(row => {
        const bt = row.bank_transactions as unknown as {
          id: string;
          label: string | null;
          emitted_at: string | null;
        } | null;
        return {
          transactionId: bt?.id ?? row.transaction_id,
          label: bt?.label ?? null,
          amount: Number(row.allocated_amount) || 0,
          emittedAt: bt?.emitted_at ?? null,
        };
      });
      setAutoLinks(mapped);
    } catch (err) {
      console.error('[PaymentSection] Auto-match check failed:', err);
    }
  }, [orderId]);

  useEffect(() => {
    void fetchAutoLinks();
  }, [fetchAutoLinks]);

  // Liste effective : props legacy (1 item) prioritaires si fournies, sinon auto-fetch
  const effectiveLinks: ILinkedTransaction[] =
    isMatched && matchedTransactionId
      ? [
          {
            transactionId: matchedTransactionId,
            label: matchedTransactionLabel ?? null,
            amount: matchedTransactionAmount ?? 0,
            emittedAt: matchedTransactionEmittedAt ?? null,
          },
          // Compléter avec les liens supplémentaires auto-fetched (si plus d'une ligne)
          ...autoLinks.filter(l => l.transactionId !== matchedTransactionId),
        ]
      : autoLinks;

  const hasMatches = effectiveLinks.length > 0;
  const remainingAmount = Math.max(0, (totalTtc ?? 0) - (paidAmount ?? 0));
  const hasRemaining = remainingAmount > 0.01;

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

          {/* Rapprochement — intégré (N transactions liées supportées) */}
          {hasMatches ? (
            <div className="space-y-1">
              {effectiveLinks.map(link => (
                <div
                  key={link.transactionId}
                  className="bg-green-50 p-2 rounded border border-green-200 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-green-800 font-medium flex items-center gap-1 truncate">
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span className="truncate" title={link.label ?? ''}>
                        {link.label ?? 'Transaction liée'}
                      </span>
                    </span>
                    <span className="font-bold text-green-700 whitespace-nowrap">
                      {formatCurrency(Math.abs(link.amount))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    {link.emittedAt && (
                      <span>
                        Payé le{' '}
                        {new Date(link.emittedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    <a
                      href={`https://app.qonto.com/transactions/${link.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Qonto
                    </a>
                  </div>
                </div>
              ))}

              {/* Récap total / payé / reste si paiement partiel */}
              {paidAmount > 0 && (
                <div className="flex items-center justify-between text-[10px] px-1 pt-0.5 text-gray-600">
                  <span>
                    Total {formatCurrency(totalTtc)} · Payé{' '}
                    {formatCurrency(paidAmount)}
                  </span>
                  {hasRemaining ? (
                    <span className="font-semibold text-orange-700">
                      Reste {formatCurrency(remainingAmount)}
                    </span>
                  ) : (
                    <span className="font-semibold text-green-700">Soldée</span>
                  )}
                </div>
              )}
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
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => setShowRapprochementModal(true)}
              >
                <CreditCard className="h-3 w-3 mr-1" />
                {hasMatches && hasRemaining
                  ? `Rapprocher ${formatCurrency(remainingAmount)}`
                  : 'Associer paiement'}
              </Button>
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

      {/* Modal rapprochement bancaire (1 doc → N transactions) */}
      <RapprochementFromOrderModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        order={
          {
            id: orderId,
            order_number: orderNumber,
            customer_name: customerName,
            customer_name_alt: customerNameAlt ?? null,
            total_ttc: totalTtc,
            paid_amount: paidAmount,
            created_at: orderDate ?? new Date().toISOString(),
            order_date: orderDate ?? null,
            shipped_at: null,
            payment_status_v2: paymentStatus,
          } satisfies OrderForLink
        }
        onSuccess={() => {
          void fetchAutoLinks();
          router.refresh();
        }}
        orderType="sales_order"
      />
    </>
  );
}

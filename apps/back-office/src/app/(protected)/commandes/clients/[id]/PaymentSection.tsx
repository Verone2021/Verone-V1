'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import {
  InvoiceCreateFromOrderModal,
  type IOrderForInvoice,
} from '@verone/finance/components';
import { Badge, Button, Card, Skeleton } from '@verone/ui';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react';

/** Invoice linked to this order (from financial_documents) */
interface ILinkedInvoice {
  id: string;
  document_number: string;
  workflow_status: string;
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
}: PaymentSectionProps): React.ReactNode {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [linkedInvoices, setLinkedInvoices] = useState<ILinkedInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

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
    inv => inv.workflow_status !== 'cancelled'
  );
  const hasActiveInvoice = activeInvoices.length > 0;

  // Can create invoice if: not draft, not paid, AND no active invoice exists
  const canCreateInvoice =
    orderStatus !== 'draft' && paymentStatus !== 'paid' && !hasActiveInvoice;

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

  const handleInvoiceCreated = (_invoiceId: string): void => {
    // Refresh linked invoices after creation
    void fetchLinkedInvoices();
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Paiement</h2>
        </div>

        <div className="space-y-3">
          {/* Statut paiement */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            {paymentStatus === 'paid' ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Paye
              </Badge>
            ) : paymentStatus === 'partial' ||
              paymentStatus === 'partially_paid' ? (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Partiel
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Non paye
              </Badge>
            )}
          </div>

          {/* Montant TTC */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-medium">{totalTtc?.toFixed(2)} EUR</span>
          </div>

          {/* Factures liees */}
          {loadingInvoices ? (
            <div className="pt-2">
              <Skeleton className="h-10 w-full" />
            </div>
          ) : hasActiveInvoice ? (
            <div className="pt-2 space-y-2">
              {activeInvoices.map(invoice => {
                const statusInfo = getInvoiceStatusLabel(
                  invoice.workflow_status ?? invoice.status
                );
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-md border p-3 bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {invoice.document_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.total_ttc?.toFixed(2)} EUR
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                      <Link href={`/factures/${invoice.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Boutons d'action */}
          <div className="pt-2 space-y-2">
            {/* Bouton Creer facture - uniquement si aucune facture active */}
            {!loadingInvoices && canCreateInvoice ? (
              <Button
                variant="default"
                className="w-full"
                onClick={() => setShowInvoiceModal(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Creer une facture
              </Button>
            ) : loadingInvoices ? (
              <Button variant="default" className="w-full" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Chargement...
              </Button>
            ) : !hasActiveInvoice && orderStatus === 'draft' ? (
              <p className="text-xs text-muted-foreground text-center">
                La commande doit etre validee ou expediee pour creer une facture
              </p>
            ) : !hasActiveInvoice && paymentStatus === 'paid' ? (
              <p className="text-xs text-muted-foreground text-center">
                Commande deja payee
              </p>
            ) : null}

            {/* Bouton Associer un paiement (masqué en draft) */}
            {paymentStatus !== 'paid' && orderStatus !== 'draft' && (
              <Link
                href={`/finance/rapprochement?orderId=${orderId}&amount=${totalTtc}`}
              >
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Associer un paiement
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Modal creation facture */}
      <InvoiceCreateFromOrderModal
        order={orderForInvoice}
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onSuccess={handleInvoiceCreated}
      />
    </>
  );
}

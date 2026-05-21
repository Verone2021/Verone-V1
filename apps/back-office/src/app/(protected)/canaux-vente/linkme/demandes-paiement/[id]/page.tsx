'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Upload,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Card } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';

import { CommissionsTable } from '../_components/CommissionsTable';
import { PaymentHistory } from '../_components/PaymentHistory';
import { ProcessPaymentModal } from '../_components/ProcessPaymentModal';
import { StatusBadge } from '../_components/StatusBadge';
import { UploadInvoiceBackOfficeModal } from '../_components/UploadInvoiceBackOfficeModal';
import { formatCurrency, formatDate } from '../_components/helpers';
import {
  type PaymentRequestAdmin,
  type PaymentRequestStatus,
} from '../_components/types';
import { usePaymentHistory } from '../hooks/use-linkme-payments';

// ============================================================================
// Types locaux
// ============================================================================

interface CommissionRow {
  order_number: string;
  order_date: string | null;
  order_amount_ht: number;
  total_payout_ht: number;
  total_payout_ttc: number;
}

interface PaymentRequestDetail {
  id: string;
  request_number: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_email: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: PaymentRequestStatus;
  invoice_received: boolean;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  financial_document_id: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
}

interface ItemRow {
  commission_amount_ttc: number;
  linkme_commissions: {
    order_number: string;
    order_date: string | null;
    order_amount_ht: number;
    total_payout_ht: number;
    total_payout_ttc: number;
  } | null;
}

type PRRaw = {
  id: string;
  request_number: string;
  affiliate_id: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: string;
  invoice_received: boolean;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  financial_document_id: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  linkme_affiliates: {
    display_name: string;
    email: string | null;
  } | null;
};

// ============================================================================
// Page principale
// ============================================================================

export default function PaymentRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [request, setRequest] = useState<PaymentRequestDetail | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceUrlLoading, setInvoiceUrlLoading] = useState(false);

  // L'historique est chargé ici pour calculer alreadyPaidTTC (passé au modal)
  const { data: paymentHistory = [], refetch: refetchHistory } =
    usePaymentHistory(id);
  const alreadyPaidTTC = paymentHistory.reduce((s, p) => s + p.amountTTC, 0);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: prRows, error: prError } = await supabase
        .from('linkme_payment_requests' as 'linkme_affiliates')
        .select(
          `id, request_number, affiliate_id, total_amount_ht, total_amount_ttc, status,
           invoice_received, invoice_file_name, invoice_received_at, financial_document_id,
           payment_reference, paid_at, created_at, notes,
           linkme_affiliates ( display_name, email )`
        )
        .eq('id', id)
        .limit(1)
        .returns<PRRaw[]>();

      if (prError) throw prError;

      const raw = prRows?.[0];
      if (!raw) throw new Error('Not found');

      setRequest({
        id: raw.id,
        request_number: raw.request_number,
        affiliate_id: raw.affiliate_id,
        affiliate_name: raw.linkme_affiliates?.display_name ?? 'Affilié',
        affiliate_email: raw.linkme_affiliates?.email ?? '',
        total_amount_ht: raw.total_amount_ht ?? 0,
        total_amount_ttc: raw.total_amount_ttc ?? 0,
        status: raw.status as PaymentRequestStatus,
        invoice_received: raw.invoice_received ?? false,
        invoice_file_name: raw.invoice_file_name,
        invoice_received_at: raw.invoice_received_at,
        financial_document_id: raw.financial_document_id,
        payment_reference: raw.payment_reference,
        paid_at: raw.paid_at,
        created_at: raw.created_at,
        notes: raw.notes,
      });

      const { data: itemsData, error: itemsError } = await supabase
        .from('linkme_payment_request_items' as 'linkme_affiliates')
        .select(
          `commission_amount_ttc,
           linkme_commissions (
             order_number, order_date, order_amount_ht,
             total_payout_ht, total_payout_ttc
           )`
        )
        .eq('payment_request_id', id)
        .returns<ItemRow[]>();

      if (itemsError) throw itemsError;

      const rows = itemsData ?? [];
      const mapped = rows
        .filter(r => r.linkme_commissions !== null)
        .map(r => r.linkme_commissions as CommissionRow)
        .sort((a, b) => {
          const da = a.order_date ?? '';
          const db = b.order_date ?? '';
          return da.localeCompare(db);
        });

      setCommissions(mapped);
    } catch (err) {
      console.error('[PaymentRequestDetail] fetch error:', err);
      setError('Impossible de charger les détails de cette demande.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData().catch(err => {
      console.error('[PaymentRequestDetail] fetchData error:', err);
    });
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error ?? !request) {
    return (
      <div className="p-6">
        <Link
          href="/canaux-vente/linkme/demandes-paiement"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes
        </Link>
        <Card className="p-12 text-center">
          <p className="text-red-600">{error ?? 'Demande introuvable.'}</p>
        </Card>
      </div>
    );
  }

  const canProcessPayment =
    request.status === 'pending' || request.status === 'partially_paid';

  return (
    <div className="p-6 space-y-6">
      {/* Retour */}
      <Link
        href="/canaux-vente/linkme/demandes-paiement"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {request.request_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Créée le {formatDate(request.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={request.status} />
          {canProcessPayment && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Banknote className="h-4 w-4" />
              Traiter le paiement
            </button>
          )}
        </div>
      </div>

      {/* Cartes info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Affilié</p>
            <p className="text-sm font-medium text-gray-900">
              {request.affiliate_name}
            </p>
            {request.affiliate_email && (
              <p className="text-xs text-gray-400">{request.affiliate_email}</p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Montant total TTC</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(request.total_amount_ttc)}
            </p>
            <p className="text-xs text-gray-400">
              HT : {formatCurrency(request.total_amount_ht)}
            </p>
          </div>
        </Card>

        {request.paid_at && (
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Soldée le</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(request.paid_at)}
              </p>
              {request.payment_reference && (
                <p className="text-xs text-gray-400 truncate max-w-[160px]">
                  {request.payment_reference}
                </p>
              )}
            </div>
          </Card>
        )}

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Commandes incluses</p>
            <p className="text-sm font-semibold text-gray-900">
              {commissions.length} commande{commissions.length > 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      </div>

      {/* Note */}
      {request.notes && (
        <Card className="p-4 border-l-4 border-blue-400 bg-blue-50">
          <p className="text-sm text-blue-800">{request.notes}</p>
        </Card>
      )}

      {/* Section Facture */}
      <Card className="p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Facture de l&apos;affilié
          </h2>
        </div>

        {request.invoice_received ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Reçue
              </span>
              <span className="text-gray-700">
                {request.invoice_file_name ?? 'facture.pdf'}
              </span>
              {request.invoice_received_at && (
                <span className="text-xs text-gray-500">
                  le {formatDate(request.invoice_received_at)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={invoiceUrlLoading}
                onClick={() => {
                  setInvoiceUrlLoading(true);
                  fetch(`/api/linkme/invoices/${request.id}/signed-url`)
                    .then(r => r.json() as Promise<{ signedUrl?: string }>)
                    .then(body => {
                      if (body.signedUrl) {
                        window.open(body.signedUrl, '_blank', 'noopener');
                      }
                    })
                    .catch(err => {
                      console.error('[PaymentRequestDetail] signed url:', err);
                    })
                    .finally(() => setInvoiceUrlLoading(false));
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {invoiceUrlLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Télécharger
              </button>
              {request.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  Remplacer
                </button>
              )}
            </div>
            {request.financial_document_id && (
              <p className="text-xs text-gray-500">
                Cette facture a généré{' '}
                <Link
                  href={`/finance/depenses/${request.financial_document_id}`}
                  className="text-blue-600 hover:underline"
                >
                  une dépense en compta
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Aucune facture déposée pour le moment. Si l&apos;affilié t&apos;a
              envoyé sa facture par email, dépose-la manuellement ici.
            </p>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Déposer la facture (cas email)
            </button>
          </div>
        )}
      </Card>

      {/* Historique des virements */}
      <PaymentHistory
        requestId={request.id}
        totalAmountTTC={request.total_amount_ttc}
        onProcessPayment={() => setPaymentModalOpen(true)}
      />

      {/* Tableau des commissions */}
      <CommissionsTable commissions={commissions} />

      {/* Modals */}
      <UploadInvoiceBackOfficeModal
        isOpen={uploadModalOpen}
        request={
          request
            ? ({
                id: request.id,
                requestNumber: request.request_number,
                affiliateId: request.affiliate_id,
                affiliateName: request.affiliate_name,
                affiliateEmail: request.affiliate_email,
                totalAmountHT: request.total_amount_ht,
                totalAmountTTC: request.total_amount_ttc,
                status: request.status,
                invoiceReceived: request.invoice_received,
                financialDocumentId: request.financial_document_id,
                invoiceFileUrl: null,
                invoiceFileName: request.invoice_file_name,
                invoiceReceivedAt: request.invoice_received_at,
                paidAt: request.paid_at,
                paymentReference: request.payment_reference,
                createdAt: request.created_at,
              } satisfies PaymentRequestAdmin)
            : null
        }
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          void fetchData().catch(err => {
            console.error('[PaymentRequestDetail] refetch after upload:', err);
          });
        }}
      />

      <ProcessPaymentModal
        isOpen={paymentModalOpen}
        request={
          request
            ? ({
                id: request.id,
                requestNumber: request.request_number,
                affiliateId: request.affiliate_id,
                affiliateName: request.affiliate_name,
                affiliateEmail: request.affiliate_email,
                totalAmountHT: request.total_amount_ht,
                totalAmountTTC: request.total_amount_ttc,
                status: request.status,
                invoiceReceived: request.invoice_received,
                financialDocumentId: request.financial_document_id,
                invoiceFileUrl: null,
                invoiceFileName: request.invoice_file_name,
                invoiceReceivedAt: request.invoice_received_at,
                paidAt: request.paid_at,
                paymentReference: request.payment_reference,
                createdAt: request.created_at,
              } satisfies PaymentRequestAdmin)
            : null
        }
        alreadyPaidTTC={alreadyPaidTTC}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          void Promise.all([fetchData(), refetchHistory()]).catch(err => {
            console.error('[PaymentRequestDetail] refetch after payment:', err);
          });
        }}
      />
    </div>
  );
}

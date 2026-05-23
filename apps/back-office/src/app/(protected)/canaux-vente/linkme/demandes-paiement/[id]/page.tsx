'use client';

import { useState } from 'react';

import { ArrowLeft, Banknote, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Card } from '@verone/ui';

import { CommissionsTable } from '../_components/CommissionsTable';
import { InvoiceSection } from '../_components/InvoiceSection';
import { PaymentHistory } from '../_components/PaymentHistory';
import { ProcessPaymentModal } from '../_components/ProcessPaymentModal';
import { RequestInfoCards } from '../_components/RequestInfoCards';
import { StatusBadge } from '../_components/StatusBadge';
import { UploadInvoiceBackOfficeModal } from '../_components/UploadInvoiceBackOfficeModal';
import { formatDate } from '../_components/helpers';
import type { PaymentRequestAdmin } from '../_components/types';
import {
  usePaymentHistory,
  usePaymentRequestCommissions,
  usePaymentRequestDetail,
} from '../hooks/use-linkme-payments';

// ============================================================================
// Page principale
// ============================================================================

export default function PaymentRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const {
    data: request,
    isLoading,
    error,
    refetch: refetchDetail,
  } = usePaymentRequestDetail(id);

  const { data: commissions = [] } = usePaymentRequestCommissions(id);

  const { data: paymentHistory = [], refetch: refetchHistory } =
    usePaymentHistory(id);

  const alreadyPaidTTC = paymentHistory.reduce((s, p) => s + p.amountTTC, 0);

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
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Demande introuvable.'}
          </p>
        </Card>
      </div>
    );
  }

  const canProcessPayment =
    request.status === 'pending' || request.status === 'partially_paid';

  const requestAsAdmin = {
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
  } satisfies PaymentRequestAdmin;

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
      <RequestInfoCards
        affiliateName={request.affiliate_name}
        affiliateEmail={request.affiliate_email}
        totalAmountTTC={request.total_amount_ttc}
        totalAmountHT={request.total_amount_ht}
        paidAt={request.paid_at}
        paymentReference={request.payment_reference}
        status={request.status}
        commissionsCount={commissions.length}
      />

      {/* Note */}
      {request.notes && (
        <Card className="p-4 border-l-4 border-blue-400 bg-blue-50">
          <p className="text-sm text-blue-800">{request.notes}</p>
        </Card>
      )}

      {/* Section Facture */}
      <InvoiceSection
        requestId={request.id}
        invoiceReceived={request.invoice_received}
        invoiceFileName={request.invoice_file_name}
        invoiceReceivedAt={request.invoice_received_at}
        financialDocumentId={request.financial_document_id}
        status={request.status}
        onUploadClick={() => setUploadModalOpen(true)}
      />

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
        request={requestAsAdmin}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          void refetchDetail().catch(err => {
            console.error('[PaymentRequestDetail] refetch after upload:', err);
          });
        }}
      />

      <ProcessPaymentModal
        isOpen={paymentModalOpen}
        request={requestAsAdmin}
        alreadyPaidTTC={alreadyPaidTTC}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          void Promise.all([refetchDetail(), refetchHistory()]).catch(err => {
            console.error('[PaymentRequestDetail] refetch after payment:', err);
          });
        }}
      />
    </div>
  );
}

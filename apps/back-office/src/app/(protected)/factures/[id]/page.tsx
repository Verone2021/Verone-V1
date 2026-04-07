'use client';

import { use } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { featureFlags } from '@verone/utils/feature-flags';
import { AlertTriangle, ArrowLeft, Lock, Loader2 } from 'lucide-react';

import { DocumentDetailDialogs } from './DocumentDetailDialogs';
import { DocumentDetailHeader } from './DocumentDetailHeader';
import { DocumentDetailMain } from './DocumentDetailMain';
import { DocumentDetailSidebar } from './DocumentDetailSidebar';
import { getDocumentNumber, type DocumentType } from './types';
import { useDocumentDetail } from './use-document-detail';

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type') as DocumentType | null;

  const detail = useDocumentDetail({ id, typeParam, router });

  // Feature flag check
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Finance - Phase 2
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (detail.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (detail.error || !detail.document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/factures">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <p>{detail.error ?? 'Document non trouvé'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docNumber = getDocumentNumber(detail.document, detail.documentType);

  return (
    <div className="space-y-6">
      <DocumentDetailHeader
        id={id}
        document={detail.document}
        documentType={detail.documentType}
        docNumber={docNumber}
        isDraft={detail.isDraft}
        isFinalized={detail.isFinalized}
        isPaid={detail.isPaid}
        isCancelled={detail.isCancelled}
        isOverdue={detail.isOverdue}
        actionLoading={detail.actionLoading}
        onDownloadPdf={detail.handleDownloadPdf}
        onSendEmail={() => {
          void detail.handleSendEmail().catch(error => {
            console.error('[DocumentDetail] Send email failed:', error);
          });
        }}
        onShowFinalize={() => detail.setShowFinalizeDialog(true)}
        onShowDelete={() => detail.setShowDeleteDialog(true)}
        onShowConvert={() => detail.setShowConvertDialog(true)}
        onShowAccept={() => detail.setShowAcceptDialog(true)}
        onShowDecline={() => detail.setShowDeclineDialog(true)}
        onShowCreditNote={() => detail.setShowCreditNoteDialog(true)}
        onShowPayment={() => detail.setShowPaymentModal(true)}
        onShowReconcile={() => detail.setShowReconcileModal(true)}
        onShowArchive={() => detail.setShowArchiveDialog(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DocumentDetailMain
          document={detail.document}
          documentType={detail.documentType}
          docNumber={docNumber}
          isOverdue={detail.isOverdue}
          computedTotals={detail.computedTotals}
        />

        <DocumentDetailSidebar
          document={detail.document}
          documentType={detail.documentType}
          orderLink={detail.orderLink}
          organisationId={detail.organisationId}
          partnerLegalName={detail.partnerLegalName}
          partnerTradeName={detail.partnerTradeName}
          onShowOrgModal={() => detail.setShowOrgModal(true)}
        />
      </div>

      <DocumentDetailDialogs
        id={id}
        documentType={detail.documentType}
        docNumber={docNumber}
        invoiceNumber={detail.document.invoice_number}
        organisationId={detail.organisationId}
        invoiceForCreditNote={detail.invoiceForCreditNote}
        computedTotals={detail.computedTotals}
        currency={detail.document.currency}
        showFinalizeDialog={detail.showFinalizeDialog}
        showDeleteDialog={detail.showDeleteDialog}
        showConvertDialog={detail.showConvertDialog}
        showCreditNoteDialog={detail.showCreditNoteDialog}
        showAcceptDialog={detail.showAcceptDialog}
        showDeclineDialog={detail.showDeclineDialog}
        showArchiveDialog={detail.showArchiveDialog}
        showPaymentModal={detail.showPaymentModal}
        showReconcileModal={detail.showReconcileModal}
        showOrgModal={detail.showOrgModal}
        setShowFinalizeDialog={detail.setShowFinalizeDialog}
        setShowDeleteDialog={detail.setShowDeleteDialog}
        setShowConvertDialog={detail.setShowConvertDialog}
        setShowCreditNoteDialog={detail.setShowCreditNoteDialog}
        setShowAcceptDialog={detail.setShowAcceptDialog}
        setShowDeclineDialog={detail.setShowDeclineDialog}
        setShowArchiveDialog={detail.setShowArchiveDialog}
        setShowPaymentModal={detail.setShowPaymentModal}
        setShowReconcileModal={detail.setShowReconcileModal}
        setShowOrgModal={detail.setShowOrgModal}
        handleFinalize={detail.handleFinalize}
        handleDelete={detail.handleDelete}
        handleConvertToInvoice={detail.handleConvertToInvoice}
        handleAcceptQuote={detail.handleAcceptQuote}
        handleDeclineQuote={detail.handleDeclineQuote}
        handleArchive={detail.handleArchive}
      />
    </div>
  );
}

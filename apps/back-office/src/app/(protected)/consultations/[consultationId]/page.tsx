'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

import { ConsultationOrderInterface } from '@verone/consultations';
import { ConsultationTimeline } from '@verone/consultations';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { ConsultationHeader } from './ConsultationHeader';
import { ConsultationInfoCard } from './ConsultationInfoCard';
import { ConsultationLinkedOrders } from './ConsultationLinkedOrders';
import { ConsultationLinkedQuotes } from './ConsultationLinkedQuotes';
import { ConsultationModals } from './ConsultationModals';
import { ConsultationToolbar } from './ConsultationToolbar';
import { getClientName } from './helpers';
import { useConsultationDetail } from './use-consultation-detail';

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.consultationId as string;

  const detail = useConsultationDetail(consultationId);

  if (detail.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mx-auto mb-1" />
          <p className="text-gray-600">Chargement de la consultation...</p>
        </div>
      </div>
    );
  }

  if (!detail.consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-1">
            <AlertCircle className="h-3 w-3 text-gray-400 mx-auto mb-1" />
            <h3 className="text-xs font-medium text-gray-900 mb-1">
              Consultation non trouvée
            </h3>
            <p className="text-gray-600 mb-1">
              Cette consultation n&apos;existe pas ou a été supprimée.
            </p>
            <ButtonUnified
              onClick={() => router.push('/consultations')}
              variant="outline"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Retour aux consultations
            </ButtonUnified>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = getClientName(detail.consultation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compact */}
      <div className="bg-white border-b">
        <div className="w-full px-2 py-1">
          <ConsultationHeader
            consultation={detail.consultation}
            clientName={clientName}
            onBack={() => router.push('/consultations')}
          />
          <ConsultationToolbar
            consultation={detail.consultation}
            consultationItemsCount={detail.consultationItems.length}
            emailPdfLoading={detail.emailPdfLoading}
            pdfLoading={detail.pdfLoading}
            creatingOrder={detail.creatingOrder}
            onEdit={() => detail.setShowEditModal(true)}
            onStatusChange={status => {
              void detail.handleStatusChange(status).catch(error => {
                console.error(
                  '[ConsultationDetailPage] Status change failed:',
                  error
                );
              });
            }}
            onValidate={() => {
              void detail.handleValidateConsultation().catch(error => {
                console.error(
                  '[ConsultationDetailPage] Validate failed:',
                  error
                );
              });
            }}
            onArchive={() => {
              void detail.handleArchiveConsultation().catch(error => {
                console.error(
                  '[ConsultationDetailPage] Archive failed:',
                  error
                );
              });
            }}
            onUnarchive={() => {
              void detail.handleUnarchiveConsultation().catch(error => {
                console.error(
                  '[ConsultationDetailPage] Unarchive failed:',
                  error
                );
              });
            }}
            onDelete={() => detail.setShowDeleteModal(true)}
            onEmail={detail.handleOpenEmail}
            onPdf={detail.handleOpenPdf}
            onCreateQuote={detail.handleOpenQuoteModal}
            onCreateOrder={() => {
              void detail.handleCreateOrder().catch(error => {
                console.error(
                  '[ConsultationDetailPage] Create order failed:',
                  error
                );
              });
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-2 py-1 space-y-1">
        <ConsultationInfoCard
          consultation={detail.consultation}
          consultationId={consultationId}
          clientName={clientName}
        />

        {/* Produits consultation */}
        <ConsultationOrderInterface
          consultationId={consultationId}
          onItemsChanged={detail.handleItemsChanged}
        />

        {/* Devis + Commandes + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
          <ConsultationLinkedQuotes
            linkedQuotes={detail.linkedQuotes}
            quotesLoading={detail.quotesLoading}
            onDeleteQuote={detail.handleDeleteQuote}
          />
          <ConsultationLinkedOrders
            linkedSalesOrders={detail.linkedSalesOrders}
            salesOrdersLoading={detail.salesOrdersLoading}
          />
          <ConsultationTimeline
            events={detail.historyEvents}
            loading={detail.historyLoading}
          />
        </div>
      </div>

      <ConsultationModals
        consultation={detail.consultation}
        consultationId={consultationId}
        clientName={clientName}
        consultationItems={detail.consultationItems}
        images={detail.images}
        linkedQuotes={detail.linkedQuotes}
        linkedSalesOrdersCount={detail.linkedSalesOrders.length}
        calculateTotal={detail.calculateTotal}
        showEditModal={detail.showEditModal}
        setShowEditModal={detail.setShowEditModal}
        handleUpdateConsultation={detail.handleUpdateConsultation}
        showEmailModal={detail.showEmailModal}
        setShowEmailModal={detail.setShowEmailModal}
        emailPdfImages={detail.emailPdfImages}
        fetchHistory={detail.fetchHistory}
        showQuoteModal={detail.showQuoteModal}
        setShowQuoteModal={detail.setShowQuoteModal}
        orderForQuoteModal={detail.orderForQuoteModal}
        supersededQuoteIds={detail.supersededQuoteIds}
        handleQuoteSuccess={detail.handleQuoteSuccess}
        showDeleteModal={detail.showDeleteModal}
        setShowDeleteModal={detail.setShowDeleteModal}
        deleting={detail.deleting}
        handleDeleteConsultation={detail.handleDeleteConsultation}
        showPdfPreview={detail.showPdfPreview}
        setShowPdfPreview={detail.setShowPdfPreview}
        pdfImages={detail.pdfImages}
      />
    </div>
  );
}

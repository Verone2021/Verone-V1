'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

import { ConsultationOrderInterface } from '@verone/consultations';
import { ConsultationTimeline } from '@verone/consultations';
import { ConsultationMarginReportPdf } from '@verone/consultations/pdf-templates';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const PdfPreviewModal = dynamic(
  () =>
    import('@verone/finance').then(mod => ({ default: mod.PdfPreviewModal })),
  { ssr: false }
);

import type { ConsultationItem } from '@verone/consultations';
import { QuickPurchaseOrderModal } from '@verone/orders';

import { ConsultationHeader } from './ConsultationHeader';
import { ConsultationInfoCard } from './ConsultationInfoCard';
import { ConsultationLinkedOrders } from './ConsultationLinkedOrders';
import { ConsultationLinkedQuotes } from './ConsultationLinkedQuotes';
import { ConsultationModals } from './ConsultationModals';
import { ConsultationOrderDialog } from './ConsultationOrderDialog';
import { ConsultationToolbar } from './ConsultationToolbar';
import { getClientName } from './helpers';
import { useConsultationDetail } from './use-consultation-detail';

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.consultationId as string;

  const detail = useConsultationDetail(consultationId);
  const [showMarginReport, setShowMarginReport] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [pendingOrderItems, setPendingOrderItems] = useState<
    ConsultationItem[]
  >([]);
  const [quickPOQueue, setQuickPOQueue] = useState<string[]>([]);

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
            onMarginReport={() => setShowMarginReport(true)}
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

      {/* Content — 2 colonnes */}
      <div className="w-full px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Colonne gauche — Produits & Marges */}
          <div className="lg:col-span-8 space-y-4">
            <ConsultationOrderInterface
              consultationId={consultationId}
              onItemsChanged={detail.handleItemsChanged}
              onCreatePurchaseOrder={items => {
                setPendingOrderItems(items);
                setShowOrderDialog(true);
              }}
            />
          </div>

          {/* Colonne droite — Client + Devis + Commandes + Timeline */}
          <div className="lg:col-span-4 space-y-4">
            <ConsultationInfoCard
              consultation={detail.consultation}
              consultationId={consultationId}
              clientName={clientName}
            />
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
      </div>

      {/* Modal PO rapide pré-rempli — itère sur toute la queue */}
      {quickPOQueue.length > 0 && quickPOQueue[0] && (
        <QuickPurchaseOrderModal
          open={quickPOQueue.length > 0}
          onClose={() => {
            setQuickPOQueue([]);
          }}
          productId={quickPOQueue[0]}
          onSuccess={() => {
            setQuickPOQueue(prev => prev.slice(1));
            void detail.fetchHistory().catch(console.error);
          }}
        />
      )}

      {/* Dialog choix type commande */}
      <ConsultationOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        acceptedItems={pendingOrderItems}
        creatingSO={detail.creatingOrder}
        onCreateSalesOrder={() => {
          setShowOrderDialog(false);
          void detail.handleCreateOrder().catch(error => {
            console.error('[ConsultationDetailPage] Create SO failed:', error);
          });
        }}
        onCreatePurchaseOrder={supplierGroups => {
          setShowOrderDialog(false);
          // Collecter TOUS les product_ids des items acceptés (un par groupe fournisseur)
          const productIds = supplierGroups.flatMap(group =>
            group.items.map(item => item.product_id)
          );
          if (productIds.length > 0) {
            setQuickPOQueue(productIds);
          }
        }}
      />

      {/* Modal rapport marges PDF */}
      {showMarginReport && detail.consultation && (
        <PdfPreviewModal
          isOpen={showMarginReport}
          onClose={() => setShowMarginReport(false)}
          title="Rapport Interne — Marges"
          filename={`rapport-marges-${clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`}
          document={
            <ConsultationMarginReportPdf
              consultation={detail.consultation}
              items={detail.consultationItems}
              clientName={clientName}
            />
          }
        />
      )}

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

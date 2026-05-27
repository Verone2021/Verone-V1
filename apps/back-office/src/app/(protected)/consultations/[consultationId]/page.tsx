'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

import { ConsultationOrderInterface } from '@verone/consultations';
import { ConsultationTimeline } from '@verone/consultations';
import { ConsultationMarginReportPdf } from '@verone/consultations/pdf-templates';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';

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
  const params = useParams<{ consultationId: string }>();
  const consultationId = params.consultationId;

  const detail = useConsultationDetail(consultationId);
  const [showMarginReport, setShowMarginReport] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [pendingOrderItems, setPendingOrderItems] = useState<
    ConsultationItem[]
  >([]);
  const [quickPOQueue, setQuickPOQueue] = useState<string[]>([]);

  // Cas « consultation absente » : on vérifie en DB directe si elle existe
  // mais est supprimée (deleted_at NOT NULL), pour différencier l'UX entre
  // « n'existe pas » et « supprimée le X ». Évite la confusion utilisateur.
  const [deletedInfo, setDeletedInfo] = useState<{
    deletedAt: string;
    clientLabel: string | null;
  } | null>(null);
  const [deletedChecked, setDeletedChecked] = useState(false);

  useEffect(() => {
    if (detail.loading || detail.consultation) return;
    if (deletedChecked) return;

    const checkDeleted = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('client_consultations')
          .select(
            'id, deleted_at, client_email, enseigne:enseignes(name), organisation:organisations(legal_name, trade_name)'
          )
          .eq('id', consultationId)
          .not('deleted_at', 'is', null)
          .maybeSingle();

        if (data?.deleted_at) {
          const enseigne = data.enseigne as { name: string } | null;
          const org = data.organisation as {
            legal_name: string | null;
            trade_name: string | null;
          } | null;
          const clientLabel =
            enseigne?.name ??
            org?.trade_name ??
            org?.legal_name ??
            data.client_email ??
            null;
          setDeletedInfo({
            deletedAt: data.deleted_at,
            clientLabel,
          });
        }
      } catch (err) {
        console.error('[ConsultationDetail] Deleted check failed:', err);
      } finally {
        setDeletedChecked(true);
      }
    };

    void checkDeleted();
  }, [detail.loading, detail.consultation, consultationId, deletedChecked]);

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
    // Pendant la vérification DB de "supprimée", on garde un spinner discret
    if (!deletedChecked) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mx-auto mb-1" />
            <p className="text-gray-600">Vérification...</p>
          </div>
        </div>
      );
    }

    // Cas 1 : consultation supprimée (deleted_at NOT NULL)
    if (deletedInfo) {
      const deletedDate = new Date(deletedInfo.deletedAt).toLocaleDateString(
        'fr-FR',
        { day: '2-digit', month: 'long', year: 'numeric' }
      );
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md border-amber-200">
            <CardContent className="text-center p-6 space-y-3">
              <Trash2 className="h-10 w-10 text-amber-600 mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Consultation supprimée
                </h3>
                <p className="text-sm text-gray-600">
                  {deletedInfo.clientLabel ? (
                    <>
                      La consultation de{' '}
                      <strong>{deletedInfo.clientLabel}</strong> a été supprimée
                      le <strong>{deletedDate}</strong>.
                    </>
                  ) : (
                    <>
                      Cette consultation a été supprimée le{' '}
                      <strong>{deletedDate}</strong>.
                    </>
                  )}
                </p>
              </div>
              <ButtonUnified
                onClick={() => router.push('/consultations')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-3 w-3 mr-2" />
                Retour aux consultations
              </ButtonUnified>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Cas 2 : consultation inexistante (mauvais ID, jamais créée)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center p-6 space-y-3">
            <AlertCircle className="h-10 w-10 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Consultation introuvable
              </h3>
              <p className="text-sm text-gray-600">
                Cette consultation n&apos;existe pas dans le système. Vérifie le
                lien.
              </p>
            </div>
            <ButtonUnified
              onClick={() => router.push('/consultations')}
              variant="outline"
              className="w-full"
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
              void detail.handleStatusChange(status).catch((error: unknown) => {
                console.error(
                  '[ConsultationDetailPage] Status change failed:',
                  error
                );
              });
            }}
            onValidate={() => {
              void detail
                .handleValidateConsultation()
                .catch((error: unknown) => {
                  console.error(
                    '[ConsultationDetailPage] Validate failed:',
                    error
                  );
                });
            }}
            onUnvalidate={() => {
              void detail
                .handleUnvalidateConsultation()
                .catch((error: unknown) => {
                  console.error(
                    '[ConsultationDetailPage] Unvalidate failed:',
                    error
                  );
                });
            }}
            onArchive={() => {
              void detail
                .handleArchiveConsultation()
                .catch((error: unknown) => {
                  console.error(
                    '[ConsultationDetailPage] Archive failed:',
                    error
                  );
                });
            }}
            onUnarchive={() => {
              void detail
                .handleUnarchiveConsultation()
                .catch((error: unknown) => {
                  console.error(
                    '[ConsultationDetailPage] Unarchive failed:',
                    error
                  );
                });
            }}
            onDelete={() => detail.setShowDeleteModal(true)}
            onEmail={detail.handleOpenEmail}
            onPdf={detail.handleOpenPdf}
            onMarginReport={() => {
              void detail.handleOpenMarginReport().catch((error: unknown) => {
                console.error(
                  '[ConsultationDetailPage] Margin report preload failed:',
                  error
                );
              });
              setShowMarginReport(true);
            }}
            onCreateQuote={detail.handleOpenQuoteModal}
            onCreateOrder={() => {
              void detail.handleCreateOrder().catch((error: unknown) => {
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
          void detail.handleCreateOrder().catch((error: unknown) => {
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

      {/* Modal rapport marges PDF — Rapport interne (avec marges et prix d'achat) */}
      {showMarginReport && detail.consultation && (
        <PdfPreviewModal
          isOpen={showMarginReport}
          onClose={() => setShowMarginReport(false)}
          title={`Rapport interne — Marges — ${clientName}`}
          filename={`rapport-marges-${clientName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')}-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`}
          document={
            <ConsultationMarginReportPdf
              consultation={detail.consultation}
              items={detail.consultationItems}
              clientName={clientName}
              clientInfo={detail.clientInfo}
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
        clientInfo={detail.clientInfo}
      />
    </div>
  );
}

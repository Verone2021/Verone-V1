'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';

import {
  ConsultationOrderInterface,
  ConsultationTimeline,
  useConsultationSupplierCosts,
} from '@verone/consultations';
import { ConsultationMarginReportPdf } from '@verone/consultations/pdf-templates';
import { createClient } from '@verone/utils/supabase/client';

const PdfPreviewModal = dynamic(
  () => import('@verone/finance').then(m => ({ default: m.PdfPreviewModal })),
  { ssr: false }
);

import type { ConsultationItem } from '@verone/consultations';
import { usePurchaseOrders } from '@verone/orders';
import { toast } from 'sonner';

import { ConsultationHeader } from './ConsultationHeader';
import { ConsultationNotFoundState } from './ConsultationNotFoundState';
import { ConsultationInfoCard } from './ConsultationInfoCard';
import { ConsultationLinkedOrders } from './ConsultationLinkedOrders';
import { ConsultationLinkedQuotes } from './ConsultationLinkedQuotes';
import { ConsultationModals } from './ConsultationModals';
import {
  ConsultationOrderDialog,
  type SupplierGroup,
} from './ConsultationOrderDialog';
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
  const [creatingPO, setCreatingPO] = useState(false);

  const { supplierCosts, supplierCostInputs, upsertSupplierCost } =
    useConsultationSupplierCosts(consultationId);
  const { createOrder: createPurchaseOrder } = usePurchaseOrders();

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

  /**
   * BO-CONSULT-MULTI-001 : UNE commande fournisseur par fournisseur, en
   * brouillon, avec ses frais de port et de douane. Avant, l'écran ouvrait
   * une fenêtre de saisie par produit et le regroupement calculé était perdu.
   */
  const handleCreatePurchaseOrders = async (
    supplierGroups: SupplierGroup[]
  ): Promise<void> => {
    if (supplierGroups.length === 0) return;
    setShowOrderDialog(false);
    setCreatingPO(true);
    try {
      const createdNumbers: string[] = [];
      const orderedItemIds: string[] = [];

      for (const group of supplierGroups) {
        if (group.purchaseLines.length === 0) continue;
        // Les « autres frais » n'ont pas d'équivalent sur la commande : ils
        // sont signalés en note plutôt que rangés dans une case inexacte.
        const otherCostNote =
          group.otherCostHt > 0
            ? ` — autres frais à ajouter : ${group.otherCostHt.toFixed(2)}€ HT`
            : '';

        const order = await createPurchaseOrder({
          supplier_id: group.supplierId,
          shipping_cost_ht: group.shippingCostHt,
          customs_cost_ht: group.customsCostHt,
          notes: `Consultation ${consultationId.slice(0, 8).toUpperCase()}${otherCostNote}`,
          items: group.purchaseLines,
        });

        if (order) {
          createdNumbers.push(order.po_number);
          orderedItemIds.push(...group.items.map(item => item.id));
        }
      }

      if (createdNumbers.length === 0) {
        toast.error('Aucune commande fournisseur créée');
        return;
      }

      // Les lignes commandées ne seront plus reproposées à la commande
      for (const itemId of orderedItemIds) {
        await detail.updateItem(itemId, { status: 'ordered' });
      }

      await detail.fetchHistory();
      toast.success(
        createdNumbers.length > 1
          ? `${createdNumbers.length} commandes fournisseur créées : ${createdNumbers.join(', ')}`
          : `Commande fournisseur ${createdNumbers[0]} créée`
      );
      router.push('/commandes/fournisseurs');
    } catch (error) {
      console.error('[ConsultationDetailPage] Create PO failed:', error);
      toast.error('La création des commandes fournisseur a échoué');
    } finally {
      setCreatingPO(false);
    }
  };

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
      <ConsultationNotFoundState
        deletedChecked={deletedChecked}
        deletedInfo={deletedInfo}
      />
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
            consultationItemsCount={
              detail.consultationItems.filter(i => i.status !== 'rejected')
                .length
            }
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
              consultation={detail.consultation}
              supplierCosts={supplierCosts}
              supplierCostInputs={supplierCostInputs}
              onSaveSupplierCost={upsertSupplierCost}
              consultationItems={detail.consultationItems}
              loading={detail.itemsLoading}
              error={detail.itemsError}
              addItem={detail.addItem}
              updateItem={detail.updateItem}
              removeItem={detail.removeItem}
              fetchConsultationItems={detail.fetchConsultationItems}
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

      <ConsultationOrderDialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        acceptedItems={pendingOrderItems}
        consultation={detail.consultation}
        supplierCosts={supplierCosts}
        creatingPO={creatingPO}
        creatingSO={detail.creatingOrder}
        onCreateSalesOrder={() => {
          setShowOrderDialog(false);
          void detail.handleCreateOrder().catch((error: unknown) => {
            console.error('[ConsultationDetailPage] Create SO failed:', error);
          });
        }}
        onCreatePurchaseOrder={supplierGroups => {
          void handleCreatePurchaseOrders(supplierGroups);
        }}
      />

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

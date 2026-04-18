'use client';

import dynamic from 'next/dynamic';

import type {
  ClientConsultation,
  ConsultationImage,
  ConsultationItem,
  ConsultationQuote,
} from '@verone/consultations';
import { ConsultationSummaryPdf } from '@verone/consultations';
import { EditConsultationModal } from '@verone/consultations';
import { SendConsultationEmailModal } from '@verone/consultations';
import { QuoteCreateFromOrderModal } from '@verone/finance/components';
import type { IOrderForDocument } from '@verone/finance/components';
import { ButtonUnified } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  AlertTriangle,
  FileText,
  ShoppingCart,
  Loader2,
  Trash2,
} from 'lucide-react';

import type { PdfImages } from './use-consultation-detail';

// Dynamic import PdfPreviewModal (no SSR — @react-pdf uses browser APIs)
const PdfPreviewModal = dynamic(
  () =>
    import('@verone/finance/components').then(mod => ({
      default: mod.PdfPreviewModal,
    })),
  { ssr: false }
);

interface ConsultationModalsProps {
  consultation: ClientConsultation;
  consultationId: string;
  clientName: string;
  consultationItems: ConsultationItem[];
  images: ConsultationImage[];
  linkedQuotes: ConsultationQuote[];
  linkedSalesOrdersCount: number;
  calculateTotal: () => number;
  // Edit modal
  showEditModal: boolean;
  setShowEditModal: (v: boolean) => void;
  handleUpdateConsultation: (
    updates: Partial<ClientConsultation>
  ) => Promise<boolean>;
  // Email modal
  showEmailModal: boolean;
  setShowEmailModal: (v: boolean) => void;
  emailPdfImages: PdfImages;
  fetchHistory: () => Promise<void>;
  // Quote modal
  showQuoteModal: boolean;
  setShowQuoteModal: (v: boolean) => void;
  orderForQuoteModal: IOrderForDocument | null;
  supersededQuoteIds: string[];
  handleQuoteSuccess: (quoteId: string) => void;
  // Delete modal
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  deleting: boolean;
  handleDeleteConsultation: () => Promise<void>;
  // PDF modal
  showPdfPreview: boolean;
  setShowPdfPreview: (v: boolean) => void;
  pdfImages: PdfImages;
}

export function ConsultationModals({
  consultation,
  consultationId,
  clientName,
  consultationItems,
  images,
  linkedQuotes,
  linkedSalesOrdersCount,
  calculateTotal,
  showEditModal,
  setShowEditModal,
  handleUpdateConsultation,
  showEmailModal,
  setShowEmailModal,
  emailPdfImages,
  fetchHistory,
  showQuoteModal,
  setShowQuoteModal,
  orderForQuoteModal,
  supersededQuoteIds,
  handleQuoteSuccess,
  showDeleteModal,
  setShowDeleteModal,
  deleting,
  handleDeleteConsultation,
  showPdfPreview,
  setShowPdfPreview,
  pdfImages,
}: ConsultationModalsProps) {
  return (
    <>
      {/* Modal d'édition */}
      <EditConsultationModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        consultation={consultation}
        onUpdated={handleUpdateConsultation}
      />

      {/* Modal envoi email */}
      <SendConsultationEmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        consultationId={consultationId}
        clientEmail={consultation.client_email ?? ''}
        clientName={clientName}
        consultationPdfDocument={
          <ConsultationSummaryPdf
            consultation={consultation}
            items={consultationItems}
            images={images}
            totalHT={calculateTotal()}
            clientName={clientName}
            preloadedImages={emailPdfImages}
          />
        }
        linkedQuotes={linkedQuotes.map(q => ({
          id: q.id,
          document_number: q.document_number,
          qonto_pdf_url: q.qonto_pdf_url,
          qonto_invoice_id: q.qonto_invoice_id,
        }))}
        onSent={() => {
          void fetchHistory().catch(err => {
            console.error(
              '[ConsultationModals] Refresh history after email:',
              err
            );
          });
        }}
      />

      {/* Modal creation devis (reutilise le composant des commandes) */}
      <QuoteCreateFromOrderModal
        order={orderForQuoteModal}
        open={showQuoteModal}
        onOpenChange={setShowQuoteModal}
        isConsultation
        consultationId={consultationId}
        supersededQuoteIds={supersededQuoteIds}
        onSuccess={handleQuoteSuccess}
      />

      {/* Modal de confirmation de suppression */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="h-screen md:h-auto max-w-full md:max-w-md md:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Supprimer la consultation
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les éléments suivants seront
              définitivement supprimés :
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 mt-0.5 text-gray-500" />
              <div>
                <p className="font-medium">
                  Consultation &quot;{clientName}&quot;
                </p>
                <p className="text-gray-500">
                  {consultationItems.length} produit(s) associé(s)
                </p>
              </div>
            </div>
            {linkedQuotes.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 mt-0.5 text-red-500" />
                <div>
                  <p className="font-medium">
                    {linkedQuotes.length} devis supprimé(s) de Qonto + DB locale
                  </p>
                  <ul className="text-gray-500 mt-1 space-y-0.5">
                    {linkedQuotes.map(q => (
                      <li key={q.id}>
                        {q.document_number} — {Number(q.total_ht).toFixed(2)} €
                        HT (
                        {q.quote_status === 'draft'
                          ? 'Brouillon'
                          : q.quote_status}
                        )
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {linkedSalesOrdersCount > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <ShoppingCart className="h-4 w-4 mt-0.5 text-orange-500" />
                <p className="font-medium">
                  {linkedSalesOrdersCount} commande(s) liée(s)
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-col md:flex-row">
            <ButtonUnified
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="w-full md:w-auto"
            >
              Annuler
            </ButtonUnified>
            <ButtonUnified
              className="w-full md:w-auto"
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                void handleDeleteConsultation().catch(error => {
                  console.error('[ConsultationModals] Delete failed:', error);
                });
              }}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
            </ButtonUnified>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal PDF preview */}
      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          title={`Résumé - ${clientName}`}
          filename={`consultation-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`}
          document={
            <ConsultationSummaryPdf
              consultation={consultation}
              items={consultationItems}
              images={images}
              totalHT={calculateTotal()}
              clientName={clientName}
              preloadedImages={pdfImages}
            />
          }
        />
      )}
    </>
  );
}

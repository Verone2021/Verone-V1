'use client';

import { useState } from 'react';

import { toast } from 'sonner';

import type {
  ClientConsultation,
  ConsultationItem,
  ConsultationQuote,
} from '@verone/consultations';
import { countUnpricedLines } from '@verone/consultations';
import type { IOrderForDocument } from '@verone/finance/components';

import {
  resolveClientInfo,
  resolvePartnerForQuote,
  buildOrderForDocument,
  type ConsultationClientInfo,
} from './consultation-async-handlers';
import { preloadProductImages } from './helpers';

export type PdfImages = {
  consultationImages: Array<{ id: string; base64: string }>;
  productImages: Record<string, string>;
};

export type { ConsultationClientInfo };

interface UseConsultationDocumentHandlersDeps {
  consultation: ClientConsultation | null;
  consultationId: string;
  consultationItems: ConsultationItem[];
  linkedQuotes: ConsultationQuote[];
  refetchLinkedQuotes: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  deleteQuote: (id: string) => Promise<boolean>;
}

export function useConsultationDocumentHandlers({
  consultation,
  consultationId,
  consultationItems,
  linkedQuotes,
  refetchLinkedQuotes,
  fetchHistory,
  deleteQuote,
}: UseConsultationDocumentHandlersDeps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailPdfLoading, setEmailPdfLoading] = useState(false);
  const [pdfImages, setPdfImages] = useState<PdfImages>({
    consultationImages: [],
    productImages: {},
  });
  const [emailPdfImages, setEmailPdfImages] = useState<PdfImages>({
    consultationImages: [],
    productImages: {},
  });
  const [clientInfo, setClientInfo] = useState<ConsultationClientInfo | null>(
    null
  );
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [orderForQuoteModal, setOrderForQuoteModal] =
    useState<IOrderForDocument | null>(null);
  const [supersededQuoteIds, setSupersededQuoteIds] = useState<string[]>([]);

  const handleOpenPdf = () => {
    if (!consultation) return;
    setPdfLoading(true);
    void Promise.all([
      preloadProductImages(consultationItems),
      resolveClientInfo(consultation),
    ])
      .then(([productImages, info]) => {
        setPdfImages({ consultationImages: [], productImages });
        setClientInfo(info);
        setShowPdfPreview(true);
      })
      .catch((err: unknown) => {
        console.error('[PDF] Preload failed:', err);
        setShowPdfPreview(true);
      })
      .finally(() => setPdfLoading(false));
  };

  const handleOpenEmail = () => {
    if (!consultation) return;
    setEmailPdfLoading(true);
    void Promise.all([
      preloadProductImages(consultationItems),
      resolveClientInfo(consultation),
    ])
      .then(([productImages, info]) => {
        setEmailPdfImages({ consultationImages: [], productImages });
        setClientInfo(info);
      })
      .catch((err: unknown) => {
        console.error('[Email] Preload failed:', err);
      })
      .finally(() => {
        setEmailPdfLoading(false);
        setShowEmailModal(true);
      });
  };

  const handleOpenMarginReport = async () => {
    if (!consultation) return;
    try {
      const info = await resolveClientInfo(consultation);
      setClientInfo(info);
    } catch (err) {
      console.error('[MarginReport] Client info preload failed:', err);
    }
  };

  const handleOpenQuoteModal = () => {
    void (async () => {
      if (!consultation) return;
      const n = countUnpricedLines(consultationItems);
      if (n > 0) {
        toast.error(`Prix de vente à fixer pour ${n} ligne(s)`);
        return;
      }
      const activeQuotes = linkedQuotes.filter(
        q => q.quote_status === 'draft' || q.quote_status === 'sent'
      );
      if (activeQuotes.length > 0) {
        const activeNumbers = activeQuotes
          .map(q => q.document_number)
          .join(', ');
        const confirmed = window.confirm(
          `Un devis actif existe deja (${activeNumbers}).\n\nCreer une nouvelle version ?\nL'ancien sera marque comme "Remplace".`
        );
        if (!confirmed) return;
      }

      setSupersededQuoteIds(activeQuotes.map(q => q.id));

      const partner = await resolvePartnerForQuote(consultation);
      if (!partner) return;

      const orderData = buildOrderForDocument(
        consultationId,
        consultation,
        consultationItems,
        partner.partnerId,
        partner.partnerOrg
      );

      setOrderForQuoteModal(orderData);
      setShowQuoteModal(true);
    })().catch((err: unknown) => {
      console.error('[ConsultationDetail] Open quote modal failed:', err);
    });
  };

  const handleQuoteSuccess = (quoteId: string) => {
    setShowQuoteModal(false);
    setSupersededQuoteIds([]);
    void (async () => {
      await refetchLinkedQuotes();
      await fetchHistory();
    })().catch((err: unknown) => {
      console.error('[ConsultationDetail] Refresh failed:', err);
    });
    window.open(`/factures/devis/${quoteId}`, '_blank');
  };

  const handleDeleteQuote = (quote: {
    id: string;
    qonto_invoice_id: string | null;
    document_number: string;
  }) => {
    if (
      window.confirm(
        `Supprimer le devis ${quote.document_number} ?\nCela le supprimera aussi de Qonto.`
      )
    ) {
      void (async () => {
        if (quote.qonto_invoice_id) {
          try {
            await fetch(`/api/qonto/quotes/${quote.qonto_invoice_id}`, {
              method: 'DELETE',
            });
          } catch (err: unknown) {
            console.error('[ConsultationDetail] Qonto delete failed:', err);
            // Continue with local delete even if Qonto fails
          }
        }
        const ok = await deleteQuote(quote.id);
        if (ok) {
          await refetchLinkedQuotes();
          await fetchHistory();
        }
      })().catch((err: unknown) => {
        console.error('[ConsultationDetail] Delete quote failed:', err);
      });
    }
  };

  return {
    showEmailModal,
    setShowEmailModal,
    showPdfPreview,
    setShowPdfPreview,
    pdfLoading,
    emailPdfLoading,
    pdfImages,
    emailPdfImages,
    clientInfo,
    showQuoteModal,
    setShowQuoteModal,
    orderForQuoteModal,
    supersededQuoteIds,
    setSupersededQuoteIds,
    handleOpenPdf,
    handleOpenEmail,
    handleOpenMarginReport,
    handleOpenQuoteModal,
    handleQuoteSuccess,
    handleDeleteQuote,
  };
}

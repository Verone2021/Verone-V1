'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import type { ClientConsultation } from '@verone/consultations';
import { useConsultations } from '@verone/consultations';
import { useConsultationHistory } from '@verone/consultations';
import { useConsultationImages } from '@verone/consultations';
import { useConsultationItems } from '@verone/consultations';
import { useConsultationQuotes } from '@verone/consultations';
import { useConsultationSalesOrders } from '@verone/consultations';
import { useQuotes } from '@verone/finance/hooks';
import type { IOrderForDocument } from '@verone/finance/components';
import { useSalesOrders } from '@verone/orders';

import {
  resolvePartnerForOrder,
  resolvePartnerForQuote,
  buildOrderForDocument,
} from './consultation-async-handlers';
import { preloadProductImages } from './helpers';

export type PdfImages = {
  consultationImages: Array<{ id: string; base64: string }>;
  productImages: Record<string, string>;
};

export function useConsultationDetail(consultationId: string) {
  const router = useRouter();
  const {
    consultations,
    loading,
    fetchConsultations,
    updateStatus,
    updateConsultation,
    validateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation,
  } = useConsultations();

  const [consultation, setConsultation] = useState<ClientConsultation | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
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

  const { consultationItems, calculateTotal, fetchConsultationItems } =
    useConsultationItems(consultationId);

  const { images } = useConsultationImages({ consultationId, autoFetch: true });

  const {
    quotes: linkedQuotes,
    loading: quotesLoading,
    fetchQuotes: refetchLinkedQuotes,
  } = useConsultationQuotes(consultationId);

  const { deleteQuote } = useQuotes();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [orderForQuoteModal, setOrderForQuoteModal] =
    useState<IOrderForDocument | null>(null);
  const [supersededQuoteIds, setSupersededQuoteIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { createOrder } = useSalesOrders();
  const [creatingOrder, setCreatingOrder] = useState(false);

  const {
    salesOrders: linkedSalesOrders,
    loading: salesOrdersLoading,
    refetch: refetchLinkedSalesOrders,
  } = useConsultationSalesOrders(consultationId);

  const {
    events: historyEvents,
    loading: historyLoading,
    fetchHistory,
  } = useConsultationHistory(consultationId);

  useEffect(() => {
    void fetchConsultations().catch(error => {
      console.error('[ConsultationDetail] Fetch failed:', error);
    });
  }, [fetchConsultations]);

  useEffect(() => {
    if (consultations && consultations.length > 0) {
      const foundConsultation = consultations.find(
        c => c.id === consultationId
      );
      setConsultation(foundConsultation ?? null);
    }
  }, [consultations, consultationId]);

  // ── Simple handlers ───────────────────────────────────────────────

  const handleStatusChange = async (
    newStatus: ClientConsultation['status']
  ) => {
    if (!consultation) return;
    const success = await updateStatus(consultationId, newStatus);
    if (success) {
      setConsultation(prev => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleUpdateConsultation = async (
    updates: Partial<ClientConsultation>
  ): Promise<boolean> => {
    try {
      const success = await updateConsultation(consultationId, updates);
      if (success) await fetchConsultations();
      return success;
    } catch (error) {
      console.error('[ConsultationDetail] Update failed:', error);
      return false;
    }
  };

  const handleValidateConsultation = async () => {
    try {
      const success = await validateConsultation(consultationId);
      if (success) await fetchConsultations();
    } catch (error) {
      console.error('[ConsultationDetail] Validate failed:', error);
    }
  };

  const handleArchiveConsultation = async () => {
    try {
      const success = await archiveConsultation(consultationId);
      if (success) await fetchConsultations();
    } catch (error) {
      console.error('[ConsultationDetail] Archive failed:', error);
    }
  };

  const handleUnarchiveConsultation = async () => {
    try {
      const success = await unarchiveConsultation(consultationId);
      if (success) await fetchConsultations();
    } catch (error) {
      console.error('[ConsultationDetail] Unarchive failed:', error);
    }
  };

  const handleItemsChanged = useCallback(() => {
    void fetchConsultationItems(consultationId).catch(err => {
      console.error('[ConsultationDetail] Refresh items failed:', err);
    });
  }, [fetchConsultationItems, consultationId]);

  const handleDeleteConsultation = async () => {
    setDeleting(true);
    try {
      const success = await deleteConsultation(consultationId);
      if (success) router.push('/consultations');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── PDF / Email image preloading ──────────────────────────────────

  const handleOpenPdf = () => {
    setPdfLoading(true);
    void preloadProductImages(consultationItems)
      .then(productImages => {
        setPdfImages({ consultationImages: [], productImages });
        setShowPdfPreview(true);
      })
      .catch(err => {
        console.error('[PDF] Image preload failed:', err);
        setShowPdfPreview(true);
      })
      .finally(() => setPdfLoading(false));
  };

  const handleOpenEmail = () => {
    setEmailPdfLoading(true);
    void preloadProductImages(consultationItems)
      .then(productImages => {
        setEmailPdfImages({ consultationImages: [], productImages });
      })
      .catch(err => {
        console.error('[Email] Image preload failed:', err);
      })
      .finally(() => {
        setEmailPdfLoading(false);
        setShowEmailModal(true);
      });
  };

  // ── Order creation ─────────────────────────────────────────────────

  const handleCreateOrder = async () => {
    if (!consultation || consultationItems.length === 0) return;
    setCreatingOrder(true);
    try {
      const partner = await resolvePartnerForOrder(consultation);
      if (!partner) {
        console.error('[ConsultationDetail] No partner found for order');
        return;
      }

      const items = consultationItems
        .filter(item => !item.is_free)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: item.unit_price ?? 0,
          tax_rate: 0.2,
          discount_percentage: 0,
          eco_tax: 0,
        }));

      if (items.length === 0) {
        console.error('[ConsultationDetail] No billable items for order');
        return;
      }

      const order = await createOrder({
        customer_id: partner.partnerId,
        customer_type: 'organization',
        items,
        notes: consultation.descriptif ?? undefined,
        consultation_id: consultationId,
        billing_address: partner.billingAddress,
      });

      if (order) {
        await refetchLinkedSalesOrders();
        await fetchHistory();
        router.push(`/commandes/clients`);
      }
    } catch (error) {
      console.error('[ConsultationDetail] Create order failed:', error);
    } finally {
      setCreatingOrder(false);
    }
  };

  // ── Quote modal ────────────────────────────────────────────────────

  const handleOpenQuoteModal = () => {
    void (async () => {
      if (!consultation) return;

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
    })().catch(err => {
      console.error('[ConsultationDetail] Open quote modal failed:', err);
    });
  };

  const handleQuoteSuccess = (quoteId: string) => {
    setShowQuoteModal(false);
    setSupersededQuoteIds([]);
    void (async () => {
      await refetchLinkedQuotes();
      await fetchHistory();
    })().catch(err => {
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
          } catch (err) {
            console.error('[ConsultationDetail] Qonto delete failed:', err);
            // Continue with local delete even if Qonto fails
          }
        }
        const ok = await deleteQuote(quote.id);
        if (ok) {
          await refetchLinkedQuotes();
          await fetchHistory();
        }
      })().catch(err => {
        console.error('[ConsultationDetail] Delete quote failed:', err);
      });
    }
  };

  // ── Return ─────────────────────────────────────────────────────────

  return {
    // Data
    consultation,
    loading,
    consultationItems,
    images,
    linkedQuotes,
    quotesLoading,
    linkedSalesOrders,
    salesOrdersLoading,
    historyEvents,
    historyLoading,
    calculateTotal,
    // Modal states
    showEditModal,
    setShowEditModal,
    showEmailModal,
    setShowEmailModal,
    showPdfPreview,
    setShowPdfPreview,
    showQuoteModal,
    setShowQuoteModal,
    showDeleteModal,
    setShowDeleteModal,
    orderForQuoteModal,
    supersededQuoteIds,
    setSupersededQuoteIds,
    // Loading states
    pdfLoading,
    emailPdfLoading,
    creatingOrder,
    deleting,
    // PDF images
    pdfImages,
    emailPdfImages,
    // Handlers
    handleStatusChange,
    handleUpdateConsultation,
    handleValidateConsultation,
    handleArchiveConsultation,
    handleUnarchiveConsultation,
    handleItemsChanged,
    handleCreateOrder,
    handleDeleteConsultation,
    handleOpenPdf,
    handleOpenEmail,
    handleOpenQuoteModal,
    handleQuoteSuccess,
    handleDeleteQuote,
    fetchHistory,
  };
}

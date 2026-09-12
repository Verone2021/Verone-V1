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
import { filterBillableItems, countUnpricedLines } from '@verone/consultations';
import { useQuotes } from '@verone/finance/hooks';
import { useSalesOrders } from '@verone/orders';

import { toast } from 'sonner';

import {
  resolvePartnerForOrder,
  buildOrderForDocument as _buildOrderForDocument,
  resolveClientInfo as _resolveClientInfo,
} from './consultation-async-handlers';
import { preloadProductImages as _preloadProductImages } from './helpers';
import {
  useConsultationDocumentHandlers,
  type PdfImages,
  type ConsultationClientInfo,
} from './use-consultation-document-handlers';

export type { PdfImages, ConsultationClientInfo };

export function useConsultationDetail(consultationId: string) {
  const router = useRouter();
  const {
    consultations,
    loading,
    fetchConsultations,
    updateStatus,
    updateConsultation,
    validateConsultation,
    unvalidateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation,
  } = useConsultations();

  const [consultation, setConsultation] = useState<ClientConsultation | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    consultationItems,
    loading: itemsLoading,
    error: itemsError,
    calculateTotal,
    fetchConsultationItems,
    addItem,
    updateItem,
    removeItem,
    toggleFreeItem,
    getTotalItemsCount,
  } = useConsultationItems(consultationId);

  const { images } = useConsultationImages({ consultationId, autoFetch: true });

  const {
    quotes: linkedQuotes,
    loading: quotesLoading,
    fetchQuotes: refetchLinkedQuotes,
  } = useConsultationQuotes(consultationId);

  const { deleteQuote } = useQuotes();

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

  const docHandlers = useConsultationDocumentHandlers({
    consultation,
    consultationId,
    consultationItems,
    linkedQuotes,
    refetchLinkedQuotes,
    fetchHistory,
    deleteQuote,
  });

  useEffect(() => {
    void fetchConsultations().catch((error: unknown) => {
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

  const handleUnvalidateConsultation = async () => {
    try {
      const success = await unvalidateConsultation(consultationId);
      if (success) await fetchConsultations();
    } catch (error) {
      console.error('[ConsultationDetail] Unvalidate failed:', error);
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
    void fetchConsultationItems(consultationId).catch((err: unknown) => {
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

  const handleCreateOrder = async () => {
    if (!consultation || consultationItems.length === 0) return;
    setCreatingOrder(true);
    try {
      // Décision 2 BO-CONSULT-P2-001 : refus explicite si prix manquants
      const n = countUnpricedLines(consultationItems);
      if (n > 0) {
        toast.error(`Prix de vente à fixer pour ${n} ligne(s)`);
        return;
      }

      const partner = await resolvePartnerForOrder(consultation);
      if (!partner) {
        console.error('[ConsultationDetail] No partner found for order');
        return;
      }

      const items = filterBillableItems(consultationItems).map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price,
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

  return {
    consultation,
    loading,
    consultationItems,
    itemsLoading,
    itemsError,
    addItem,
    updateItem,
    removeItem,
    toggleFreeItem,
    getTotalItemsCount,
    fetchConsultationItems,
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
    showDeleteModal,
    setShowDeleteModal,
    // Loading states
    creatingOrder,
    deleting,
    // Handlers
    handleStatusChange,
    handleUpdateConsultation,
    handleValidateConsultation,
    handleUnvalidateConsultation,
    handleArchiveConsultation,
    handleUnarchiveConsultation,
    handleItemsChanged,
    handleCreateOrder,
    handleDeleteConsultation,
    fetchHistory,
    // Document handlers (PDF, email, quotes)
    ...docHandlers,
  };
}

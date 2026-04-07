'use client';

import { useState, useEffect, useMemo } from 'react';

import { useRapprochementData } from './use-rapprochement-data';
import { useRapprochementScoring } from './use-rapprochement-scoring';
import { useRapprochementSelection } from './use-rapprochement-selection';
import { useRapprochementActions } from './use-rapprochement-actions';
import { useRapprochementVat } from './use-rapprochement-vat';
import type { RapprochementModalProps, LinkSuccessState } from './types';

type UseRapprochementParams = Pick<
  RapprochementModalProps,
  | 'open'
  | 'transactionId'
  | 'transactionQontoId'
  | 'amount'
  | 'counterpartyName'
  | 'organisationId'
  | 'onSuccess'
>;

export function useRapprochement({
  open,
  transactionId,
  transactionQontoId,
  amount,
  counterpartyName,
  organisationId,
  onSuccess,
}: UseRapprochementParams) {
  const [activeTab, setActiveTab] = useState<
    'orders' | 'purchase_orders' | 'documents'
  >('orders');
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<LinkSuccessState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const data = useRapprochementData(transactionId);

  const totalAllocated = useMemo(
    () =>
      data.existingLinks.reduce(
        (sum, link) => sum + Math.abs(link.allocated_amount),
        0
      ),
    [data.existingLinks]
  );
  const remainingAmount = Math.abs(amount) - totalAllocated;

  const selection = useRapprochementSelection(remainingAmount);

  const scoring = useRapprochementScoring({
    orders: data.orders,
    purchaseOrders: data.purchaseOrders,
    amount,
    transactionDate: data.transactionDate,
    organisationId,
    counterpartyName,
  });

  const vat = useRapprochementVat({ transactionId, transactionQontoId });

  const actions = useRapprochementActions({
    transactionId,
    remainingAmount,
    allocatedAmount: selection.allocatedAmount,
    selectedDocumentId: selection.selectedDocumentId,
    selectedOrderId: selection.selectedOrderId,
    selectedPurchaseOrderId: selection.selectedPurchaseOrderId,
    documents: data.documents,
    orders: data.orders,
    purchaseOrders: data.purchaseOrders,
    setIsLinking,
    setLinkSuccess,
    fetchAvailableItems: data.fetchAvailableItems,
    autoAttachPDF: vat.autoAttachPDF,
    autoCalculateVAT: vat.autoCalculateVAT,
    onSuccess,
  });

  // Charger les données au mount
  useEffect(() => {
    if (!open) return;

    void data.fetchAvailableItems();

    // Reset des sélections
    selection.resetSelections();
    setLinkSuccess(null);

    // Onglet par défaut selon le type de transaction
    // Débit = dépense = commandes fournisseurs, Crédit = recette = commandes clients
    if (amount < 0) {
      setActiveTab('purchase_orders');
    } else {
      setActiveTab('orders');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, amount]);

  // Filtrer les documents
  const filteredDocuments = data.documents.filter(
    d =>
      d.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les commandes clients (avec scores)
  const filteredOrders = scoring.ordersWithScores.filter(
    o =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les commandes fournisseurs (avec scores)
  const filteredPurchaseOrders = scoring.purchaseOrdersWithScores.filter(
    po =>
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    // State
    activeTab,
    setActiveTab,
    isLinking,
    linkSuccess,
    setLinkSuccess,
    searchQuery,
    setSearchQuery,
    // Data
    isLoading: data.isLoading,
    existingLinks: data.existingLinks,
    // Computed
    totalAllocated,
    remainingAmount,
    filteredDocuments,
    filteredOrders,
    filteredPurchaseOrders,
    // Scoring
    suggestions: scoring.suggestions,
    purchaseOrderSuggestions: scoring.purchaseOrderSuggestions,
    // Selection
    selectedDocumentId: selection.selectedDocumentId,
    setSelectedDocumentId: selection.setSelectedDocumentId,
    selectedOrderId: selection.selectedOrderId,
    setSelectedOrderId: selection.setSelectedOrderId,
    selectedPurchaseOrderId: selection.selectedPurchaseOrderId,
    setSelectedPurchaseOrderId: selection.setSelectedPurchaseOrderId,
    allocatedAmount: selection.allocatedAmount,
    setAllocatedAmount: selection.setAllocatedAmount,
    // Actions
    handleLinkDocument: actions.handleLinkDocument,
    handleLinkOrder: actions.handleLinkOrder,
    handleLinkPurchaseOrder: actions.handleLinkPurchaseOrder,
    handleUnlink: actions.handleUnlink,
    handleQuickLink: (orderId: string) =>
      selection.handleQuickLink(orderId, data.orders),
    handleQuickLinkPurchaseOrder: (purchaseOrderId: string) =>
      selection.handleQuickLinkPurchaseOrder(
        purchaseOrderId,
        data.purchaseOrders
      ),
    fetchAvailableItems: data.fetchAvailableItems,
  };
}

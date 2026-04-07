'use client';

import { useState } from 'react';

import type { SalesOrder, PurchaseOrder } from './types';

export function useRapprochementSelection(remainingAmount: number) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<
    string | null
  >(null);
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');

  const resetSelections = () => {
    setSelectedDocumentId(null);
    setSelectedOrderId(null);
    setSelectedPurchaseOrderId(null);
    setAllocatedAmount('');
  };

  // Lier directement via suggestion (raccourci) - commandes clients
  const handleQuickLink = async (orderId: string, orders: SalesOrder[]) => {
    setSelectedOrderId(orderId);
    // Montant par défaut = min(restant transaction, restant commande)
    const order = orders.find(o => o.id === orderId);
    const orderRemaining = order ? order.remaining : remainingAmount;
    const defaultAmount = Math.min(remainingAmount, orderRemaining);
    setAllocatedAmount(String(defaultAmount.toFixed(2)));
  };

  // Lier directement via suggestion (raccourci) - commandes fournisseurs
  const handleQuickLinkPurchaseOrder = async (
    purchaseOrderId: string,
    purchaseOrders: PurchaseOrder[]
  ) => {
    setSelectedPurchaseOrderId(purchaseOrderId);
    const po = purchaseOrders.find(p => p.id === purchaseOrderId);
    const poRemaining = po ? po.total_ttc : remainingAmount;
    const defaultAmount = Math.min(remainingAmount, poRemaining);
    setAllocatedAmount(String(defaultAmount.toFixed(2)));
  };

  return {
    selectedDocumentId,
    setSelectedDocumentId,
    selectedOrderId,
    setSelectedOrderId,
    selectedPurchaseOrderId,
    setSelectedPurchaseOrderId,
    allocatedAmount,
    setAllocatedAmount,
    resetSelections,
    handleQuickLink,
    handleQuickLinkPurchaseOrder,
  };
}

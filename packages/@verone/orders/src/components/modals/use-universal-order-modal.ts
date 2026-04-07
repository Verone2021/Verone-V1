'use client';

import { useState } from 'react';

import { useInlineEdit } from '@verone/common/hooks';

import type { CreateOrderItemData, OrderItem } from '@verone/orders/hooks';
import { useOrderItems } from '@verone/orders/hooks';

import type { OrderHeader } from './universal-order-modal.types';
import { useUniversalOrderHeader } from './use-universal-order-header';

interface UseUniversalOrderModalProps {
  orderId: string | null;
  orderType: 'sales' | 'purchase' | null;
  open: boolean;
  initialEditMode: boolean;
  onUpdate?: () => void;
}

export function useUniversalOrderModal({
  orderId,
  orderType,
  open,
  initialEditMode,
  onUpdate,
}: UseUniversalOrderModalProps) {
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const { orderHeader, setOrderHeader, loading, error } =
    useUniversalOrderHeader({
      orderId,
      orderType,
      open,
    });

  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    addItem,
    updateItem,
    removeItem,
    refetch: _refetch,
  } = useOrderItems({
    orderId: orderId ?? '',
    orderType: orderType ?? 'purchase',
  });

  const inlineEdit = useInlineEdit({
    salesOrderId: orderType === 'sales' ? (orderId ?? undefined) : undefined,
    purchaseOrderId:
      orderType === 'purchase' ? (orderId ?? undefined) : undefined,
    onUpdate: (updatedData: Partial<OrderHeader>) => {
      console.warn(
        '[UniversalOrderDetailsModal] Order header updated:',
        updatedData
      );
      setOrderHeader(prev => (prev ? { ...prev, ...updatedData } : null));
      onUpdate?.();
    },
    onError: (err: string) => {
      console.error('❌ Order header update error:', err);
    },
  });

  const toggleMode = () => {
    if (!isEditMode && orderHeader) {
      inlineEdit.startEdit('order_header', {
        billing_address: orderHeader.billing_address,
        shipping_address: orderHeader.shipping_address,
        delivery_address: orderHeader.delivery_address,
        expected_delivery_date: orderHeader.expected_delivery_date,
        payment_terms: orderHeader.payment_terms,
        tax_rate: orderHeader.tax_rate,
        eco_tax_vat_rate: orderHeader.eco_tax_vat_rate,
      });
    } else {
      inlineEdit.cancelEdit('order_header');
    }
    setIsEditMode(prev => !prev);
  };

  const handleSaveHeader = async () => {
    const success = await inlineEdit.saveChanges('order_header');
    if (success) setIsEditMode(false);
  };

  const handleHeaderChange = (field: string, value: string | number | null) => {
    inlineEdit.updateEditedData('order_header', { [field]: value });
  };

  const handleAddProduct = async (data: CreateOrderItemData) => {
    try {
      await addItem(data);
      setShowAddProductModal(false);
      onUpdate?.();
    } catch (err) {
      console.error('[UniversalOrderDetailsModal] Erreur ajout produit:', err);
    }
  };

  const handleUpdateItem = async (itemId: string, data: Partial<OrderItem>) => {
    try {
      await updateItem(itemId, data);
      onUpdate?.();
    } catch (err) {
      console.error(
        '[UniversalOrderDetailsModal] Erreur modification item:',
        err
      );
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      onUpdate?.();
    } catch (err) {
      console.error(
        '[UniversalOrderDetailsModal] Erreur suppression item:',
        err
      );
    }
  };

  const isLoading = loading || itemsLoading;
  const hasError = error ?? itemsError;

  return {
    isEditMode,
    showAddProductModal,
    setShowAddProductModal,
    orderHeader,
    items,
    isLoading,
    hasError,
    inlineEdit,
    toggleMode,
    handleSaveHeader,
    handleHeaderChange,
    handleAddProduct,
    handleUpdateItem,
    handleRemoveItem,
  };
}

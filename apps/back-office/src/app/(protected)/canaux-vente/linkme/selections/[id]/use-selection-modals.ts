'use client';

import { useState } from 'react';

import { type SelectionItem } from '../../hooks/use-linkme-selections';
import type { ProductTabValue, ProductSourceValue } from './selection-types';

export function useSelectionModals() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [newMarginRate, setNewMarginRate] = useState<number>(10);
  const [productSource, setProductSource] =
    useState<ProductSourceValue>('catalog');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<SelectionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SelectionItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const [productTab, setProductTab] = useState<ProductTabValue>('all');
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const handleOpenViewModal = (item: SelectionItem) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (item: SelectionItem) => {
    setEditItem(item);
    setIsEditModalOpen(true);
  };

  const resetAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedProductId(null);
    setNewMarginRate(10);
    setSearchQuery('');
    setProductSource('catalog');
  };

  return {
    isAddModalOpen,
    setIsAddModalOpen,
    searchQuery,
    setSearchQuery,
    selectedProductId,
    setSelectedProductId,
    newMarginRate,
    setNewMarginRate,
    productSource,
    setProductSource,
    isViewModalOpen,
    setIsViewModalOpen,
    viewItem,
    isEditModalOpen,
    setIsEditModalOpen,
    editItem,
    deleteItemId,
    setDeleteItemId,
    productTab,
    setProductTab,
    isProductsOpen,
    setIsProductsOpen,
    productSearchQuery,
    setProductSearchQuery,
    handleOpenViewModal,
    handleOpenEditModal,
    resetAddModal,
  };
}

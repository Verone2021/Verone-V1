'use client';

/**
 * Form state hook for AddAllocationDialog
 *
 * @module use-add-allocation-form
 * @since 2025-12-20
 */

import { useState } from 'react';

import { type LinkMeOwner } from './hooks/use-linkme-owners';
import { type ProductForStorage } from './hooks/use-products-for-storage';
import {
  useCreateStorageAllocation,
  useUpdateStorageStartDate,
} from './hooks/use-storage-billing';

export interface AddAllocationFormState {
  selectedOwner: LinkMeOwner | null;
  setSelectedOwner: (v: LinkMeOwner | null) => void;
  selectedProduct: ProductForStorage | null;
  setSelectedProduct: (v: ProductForStorage | null) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  billable: boolean;
  setBillable: (v: boolean) => void;
  storageStartDate: Date | undefined;
  setStorageStartDate: (v: Date | undefined) => void;
  ownerSearch: string;
  setOwnerSearch: (v: string) => void;
  productSearch: string;
  setProductSearch: (v: string) => void;
  ownerOpen: boolean;
  setOwnerOpen: (v: boolean) => void;
  productOpen: boolean;
  setProductOpen: (v: boolean) => void;
  startDateOpen: boolean;
  setStartDateOpen: (v: boolean) => void;
  previewVolume: number;
  createAllocation: ReturnType<typeof useCreateStorageAllocation>;
  updateStartDateMutation: ReturnType<typeof useUpdateStorageStartDate>;
  resetForm: () => void;
}

export function useAddAllocationForm(): AddAllocationFormState {
  const [selectedOwner, setSelectedOwner] = useState<LinkMeOwner | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForStorage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [billable, setBillable] = useState(true);
  const [storageStartDate, setStorageStartDate] = useState<Date | undefined>(
    undefined
  );
  const [ownerSearch, setOwnerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);

  const createAllocation = useCreateStorageAllocation();
  const updateStartDateMutation = useUpdateStorageStartDate();

  const previewVolume = selectedProduct
    ? selectedProduct.volume_m3 * quantity
    : 0;

  const resetForm = () => {
    setSelectedOwner(null);
    setSelectedProduct(null);
    setQuantity(1);
    setBillable(true);
    setStorageStartDate(undefined);
  };

  return {
    selectedOwner,
    setSelectedOwner,
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    billable,
    setBillable,
    storageStartDate,
    setStorageStartDate,
    ownerSearch,
    setOwnerSearch,
    productSearch,
    setProductSearch,
    ownerOpen,
    setOwnerOpen,
    productOpen,
    setProductOpen,
    startDateOpen,
    setStartDateOpen,
    previewVolume,
    createAllocation,
    updateStartDateMutation,
    resetForm,
  };
}

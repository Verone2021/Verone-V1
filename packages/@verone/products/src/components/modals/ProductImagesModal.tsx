'use client';

import { useState } from 'react';

import { ProductPhotosModal } from '@/components/business/product-photos-modal';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

interface ProductImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onUpdate: (updatedProduct: any) => void;
}

export function ProductImagesModal({
  isOpen,
  onClose,
  product,
  onUpdate,
}: ProductImagesModalProps) {
  return (
    <ProductPhotosModal
      isOpen={isOpen}
      onClose={onClose}
      productId={product.id}
      productName={product.name || 'Produit'}
      productType="product"
    />
  );
}

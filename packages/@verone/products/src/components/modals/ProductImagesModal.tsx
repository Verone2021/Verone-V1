'use client';

import { useState } from 'react';

// FIXME: ProductPhotosModal component can't be imported from apps/back-office in package
// import { ProductPhotosModal } from '@/components/business/product-photos-modal';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';

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
    /* FIXME: ProductPhotosModal component can't be imported from apps/back-office
    <ProductPhotosModal
      isOpen={isOpen}
      onClose={onClose}
      productId={product.id}
      productName={product.name || 'Produit'}
      productType="product"
    />
    */
    <div className="p-4 border rounded">
      <p>Modal photos produit (temporairement désactivée)</p>
    </div>
  );
}

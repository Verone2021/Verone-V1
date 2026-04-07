'use client';

import type { SelectedProduct } from '@verone/products';
import { UniversalProductSelectorV2 } from '@verone/products';

interface CollectionProductsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (products: SelectedProduct[]) => Promise<void>;
}

export function CollectionProductsModal({
  open,
  onClose,
  onSelect,
}: CollectionProductsModalProps) {
  if (!open) return null;

  return (
    <UniversalProductSelectorV2
      open={open}
      onClose={onClose}
      onSelect={onSelect}
      mode="multi"
      context="collections"
      selectedProducts={[]}
      showQuantity={false}
      showImages
    />
  );
}

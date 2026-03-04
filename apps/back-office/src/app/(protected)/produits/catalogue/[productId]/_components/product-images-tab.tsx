'use client';

import type { ComponentProps } from 'react';

import { ProductImageGallery } from '@verone/products';
import { ButtonUnified } from '@verone/ui';
import { ImageIcon } from 'lucide-react';

interface ProductImagesTabProps {
  productId: string;
  productName: string;
  productStatus: ComponentProps<typeof ProductImageGallery>['productStatus'];
  imageCount: number;
  onOpenPhotosModal: () => void;
}

export function ProductImagesTab({
  productId,
  productName,
  productStatus,
  imageCount,
  onOpenPhotosModal,
}: ProductImagesTabProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <ProductImageGallery
          productId={productId}
          productName={productName}
          productStatus={productStatus}
          compact={false}
          onManagePhotos={onOpenPhotosModal}
        />
      </section>

      <div className="flex justify-center">
        <ButtonUnified
          variant="outline"
          size="sm"
          onClick={onOpenPhotosModal}
          icon={ImageIcon}
          iconPosition="left"
        >
          Gérer photos ({imageCount})
        </ButtonUnified>
      </div>
    </div>
  );
}

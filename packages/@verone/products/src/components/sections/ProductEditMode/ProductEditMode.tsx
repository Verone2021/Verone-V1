/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
'use client';

import { CategoryHierarchyModal } from '@verone/categories/components/modals/CategorizeModal';
import { Badge, ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { Eye } from 'lucide-react';

import { ProductCharacteristicsModal } from '../../modals/ProductCharacteristicsModal';
import { ProductDescriptionsModal } from '../../modals/ProductDescriptionsModal';
import { ProductImagesModal } from '../../modals/ProductImagesModal';
import { useProductEditMode } from './hooks';
import { ProductEditMainColumn } from './ProductEditMainColumn';
import { ProductEditManagementColumn } from './ProductEditManagementColumn';
import { ProductEditSidebar } from './ProductEditSidebar';
import type { ProductEditModeProps } from './types';

export function ProductEditMode({
  product,
  onSwitchToView,
  onUpdate,
  className,
}: ProductEditModeProps) {
  const {
    suppliers,
    formData,
    showCategorizeModal,
    setShowCategorizeModal,
    showCharacteristicsModal,
    setShowCharacteristicsModal,
    showDescriptionsModal,
    setShowDescriptionsModal,
    showImagesModal,
    setShowImagesModal,
    handleFieldChange,
    completionPercentage,
    missingFields,
  } = useProductEditMode(product);

  const onFieldChange = (field: string, value: unknown) => {
    handleFieldChange(field, value, onUpdate);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Header compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onSwitchToView}
            className="h-6 text-[10px] px-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            Présentation
          </ButtonV2>
          <nav className="text-[10px] text-gray-600">
            Administration › {String(product.name)}
          </nav>
        </div>
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-[9px] px-1 py-0">
            {completionPercentage}% complet
          </Badge>
        </div>
      </div>

      {/* Layout 3 colonnes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <ProductEditSidebar
          product={product}
          completionPercentage={completionPercentage}
          missingFields={missingFields as string[]}
          onShowImagesModal={() => setShowImagesModal(true)}
        />

        <ProductEditMainColumn
          product={product}
          formData={formData}
          suppliers={suppliers}
          onFieldChange={onFieldChange}
          onShowCategorizeModal={() => setShowCategorizeModal(true)}
          onShowDescriptionsModal={() => setShowDescriptionsModal(true)}
          onShowCharacteristicsModal={() => setShowCharacteristicsModal(true)}
        />

        <ProductEditManagementColumn
          formData={formData}
          onFieldChange={onFieldChange}
        />
      </div>

      {/* Modals */}
      <CategoryHierarchyModal
        isOpen={showCategorizeModal}
        onClose={() => setShowCategorizeModal(false)}
        product={product}
        onUpdate={onUpdate}
      />

      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={() => setShowCharacteristicsModal(false)}
        productId={product.id}
        productName={product.name ?? 'Produit'}
        initialData={{
          variant_attributes: product.variant_attributes,
          dimensions: product.dimensions,
          weight: product.weight,
        }}
        onUpdate={onUpdate}
      />

      <ProductDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        productId={product.id}
        productName={product.name ?? 'Produit'}
        initialData={{
          description: product.description,
          technical_description: product.technical_description,
          selling_points: product.selling_points,
        }}
        onUpdate={onUpdate}
      />

      <ProductImagesModal
        isOpen={showImagesModal}
        onClose={() => setShowImagesModal(false)}
        product={product}
        onUpdate={onUpdate}
      />
    </div>
  );
}

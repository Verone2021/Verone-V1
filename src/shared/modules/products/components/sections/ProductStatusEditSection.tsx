'use client';

import React from 'react';

import { Settings, Save, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@verone/utils';
import {
  useProductStatus,
  PRODUCT_STATUS_OPTIONS,
  type ProductStatus,
} from '@/shared/modules/products/hooks';

interface ProductStatusEditSectionProps {
  product: {
    id: string;
    product_status: ProductStatus;
    name?: string;
  };
  onUpdate: (updatedData: Partial<{ product_status: ProductStatus }>) => void;
  className?: string;
}

/**
 * Section éditable pour le statut commercial manuel du produit
 *
 * Permet de modifier product_status via inline edit
 * Business rule: Précommande/Arrêté → min_stock = 0 + suppression alertes
 */
export function ProductStatusEditSection({
  product,
  onUpdate,
  className,
}: ProductStatusEditSectionProps) {
  const {
    currentStatus,
    isEditing,
    isSaving,
    error,
    startEdit,
    cancelEdit,
    saveStatus,
    getStatusOption,
  } = useProductStatus({
    productId: product.id,
    initialStatus: product.product_status,
    onUpdate: newStatus => {
      onUpdate({ product_status: newStatus });
    },
  });

  const currentOption = getStatusOption(currentStatus);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Settings className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900">Statut Commercial</h3>
        </div>

        {!isEditing && (
          <Badge
            variant={currentOption.variant}
            className="text-sm font-medium"
          >
            {currentOption.icon} {currentOption.label}
          </Badge>
        )}
      </div>

      {/* Mode Lecture */}
      {!isEditing && (
        <>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-600">{currentOption.description}</p>
            <p className="mt-1 text-xs text-gray-500">
              ✏️ Cliquez pour modifier le statut commercial
            </p>
          </div>

          <ButtonV2
            variant="outline"
            size="sm"
            onClick={startEdit}
            className="mt-3 w-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Modifier le statut
          </ButtonV2>
        </>
      )}

      {/* Mode Édition */}
      {isEditing && (
        <>
          <div className="space-y-2">
            {PRODUCT_STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => saveStatus(option.value)}
                disabled={isSaving}
                className={cn(
                  'w-full rounded-md border p-3 text-left transition-colors',
                  'hover:bg-gray-50',
                  currentStatus === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200',
                  isSaving && 'cursor-not-allowed opacity-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {option.icon} {option.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                  {currentStatus === option.value && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              disabled={isSaving}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </ButtonV2>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          {/* Saving State */}
          {isSaving && (
            <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-600">
              ⏳ Sauvegarde en cours...
            </div>
          )}
        </>
      )}
    </div>
  );
}

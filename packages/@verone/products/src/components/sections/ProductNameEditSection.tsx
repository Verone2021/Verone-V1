'use client';

import { useState } from 'react';

import { Save, X, Edit } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@verone/common/hooks';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price_ht?: number;
}

interface ProductNameEditSectionProps {
  product: Product;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
}

export function ProductNameEditSection({
  product,
  onUpdate,
  className,
}: ProductNameEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    productId: product.id,
    onUpdate: updatedData => {
      onUpdate(updatedData);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour nom produit:', error);
    },
  });

  const section: EditableSection = 'general';
  const editData = getEditedData(section);
  const error = getError(section);

  const handleStartEdit = () => {
    startEdit(section, {
      name: product.name,
    });
  };

  const handleSave = async () => {
    const success = await saveChanges(section);
    if (success) {
      console.log('✅ Nom produit mis à jour avec succès');
    }
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const handleFieldChange = (field: string, value: string) => {
    updateEditedData(section, { [field]: value });
  };

  if (isEditing(section)) {
    return (
      <div className={cn('bg-white border border-black p-4', className)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-3">
            <div>
              <Label className="text-sm font-medium text-black mb-1">
                Nom du produit *
              </Label>
              <Input
                value={editData?.name || ''}
                onChange={e => handleFieldChange('name', e.target.value)}
                className="text-xl font-bold border-gray-300 focus:border-black focus:ring-black"
                placeholder="Nom du produit"
                required
              />
            </div>
            <div className="text-sm text-gray-600">
              SKU: {product.sku || 'Non défini'}
            </div>
          </div>
          <div className="flex space-x-1 ml-4">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
              className="text-xs px-2 py-1 h-6"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
              className="text-xs px-2 py-1 h-6"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // Mode affichage
  return (
    <div className={cn('bg-white border border-black p-4', className)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-black mb-1">{product.name}</h1>
          <div className="text-sm text-gray-600 mb-2">
            SKU: {product.sku || 'Non défini'}
          </div>
        </div>
        <ButtonUnified
          variant="outline"
          size="sm"
          icon={Edit}
          onClick={handleStartEdit}
        >
          Modifier
        </ButtonUnified>
      </div>
    </div>
  );
}

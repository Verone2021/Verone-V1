'use client';

import { ButtonV2, Input, Label, Textarea } from '@verone/ui';
import {
  AlertCircle,
  Edit,
  Ruler,
  Save,
  ShoppingCart,
  Tag,
  Weight,
  X,
} from 'lucide-react';

import type { DetailsSectionData, SourcingProduct } from './types';

interface SourcingProductDetailsSectionProps {
  product: SourcingProduct;
  isEditing: boolean;
  isSaving: boolean;
  editedData: DetailsSectionData | null;
  error: string | null;
  hasChanges: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateData: (patch: Partial<DetailsSectionData>) => void;
  onSave: () => Promise<void>;
}

export function SourcingProductDetailsSection({
  product,
  isEditing,
  isSaving,
  editedData,
  error,
  hasChanges,
  onStartEdit,
  onCancelEdit,
  onUpdateData,
  onSave,
}: SourcingProductDetailsSectionProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Détails Produit
          </h3>
          <div className="flex space-x-1">
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </ButtonV2>
            <ButtonV2
              variant="default"
              size="sm"
              onClick={() => void onSave()}
              disabled={isSaving || !hasChanges}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSaving ? (
                <span className="animate-spin">&#8987;</span>
              ) : (
                <Save className="h-4 w-4" />
              )}
            </ButtonV2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="manufacturer" className="text-xs text-gray-600">
              Fabricant
            </Label>
            <Input
              id="manufacturer"
              value={editedData?.manufacturer ?? ''}
              onChange={e => onUpdateData({ manufacturer: e.target.value })}
              placeholder="HAY, Fermob..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="supplier_moq" className="text-xs text-gray-600">
              MOQ (quantité min.)
            </Label>
            <Input
              id="supplier_moq"
              type="number"
              min="1"
              value={editedData?.supplier_moq ?? ''}
              onChange={e =>
                onUpdateData({ supplier_moq: parseInt(e.target.value) || 0 })
              }
              placeholder="10"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-xs text-gray-600">
            Description
          </Label>
          <Textarea
            id="description"
            value={editedData?.description ?? ''}
            onChange={e => onUpdateData({ description: e.target.value })}
            placeholder="Description du produit..."
            rows={3}
            className="mt-1 resize-none"
          />
        </div>

        <div>
          <Label className="text-xs text-gray-600">
            Dimensions (cm) L x l x H
          </Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={editedData?.dimensions_length ?? ''}
              onChange={e =>
                onUpdateData({
                  dimensions_length: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="L"
            />
            <Input
              type="number"
              step="0.1"
              min="0"
              value={editedData?.dimensions_width ?? ''}
              onChange={e =>
                onUpdateData({
                  dimensions_width: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="l"
            />
            <Input
              type="number"
              step="0.1"
              min="0"
              value={editedData?.dimensions_height ?? ''}
              onChange={e =>
                onUpdateData({
                  dimensions_height: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="H"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="weight" className="text-xs text-gray-600">
            Poids (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            min="0"
            value={editedData?.weight ?? ''}
            onChange={e =>
              onUpdateData({ weight: parseFloat(e.target.value) || 0 })
            }
            placeholder="5.5"
            className="mt-1"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Détails Produit
        </h3>
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={onStartEdit}
          className="text-gray-500 hover:text-black"
        >
          <Edit className="h-4 w-4" />
        </ButtonV2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {product.manufacturer && (
          <div className="flex items-center text-sm text-gray-600">
            <Tag className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium mr-1">Fabricant:</span>
            {product.manufacturer}
          </div>
        )}
        {product.supplier_moq != null && product.supplier_moq > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <ShoppingCart className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium mr-1">MOQ:</span>
            {product.supplier_moq}
          </div>
        )}
        {product.dimensions && (
          <div className="flex items-center text-sm text-gray-600">
            <Ruler className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium mr-1">Dim.:</span>
            {product.dimensions.length || 0} x {product.dimensions.width || 0} x{' '}
            {product.dimensions.height || 0} cm
          </div>
        )}
        {product.weight != null && product.weight > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <Weight className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium mr-1">Poids:</span>
            {product.weight} kg
          </div>
        )}
      </div>

      {product.description && (
        <p className="text-sm text-gray-600 mt-2">{product.description}</p>
      )}

      {!product.manufacturer &&
        !product.description &&
        !product.supplier_moq &&
        !product.dimensions &&
        !product.weight && (
          <p className="text-sm text-gray-400 italic">Aucun détail renseigné</p>
        )}
    </div>
  );
}

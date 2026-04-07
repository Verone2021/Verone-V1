'use client';

import { ButtonV2, Input, Label } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { AlertCircle, Edit, Euro, Save, X } from 'lucide-react';

import type { PricingSectionData, SourcingProduct } from './types';

interface SourcingProductPricingSectionProps {
  product: SourcingProduct;
  isEditing: boolean;
  isSaving: boolean;
  editedData: PricingSectionData | null;
  error: string | null;
  hasChanges: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateData: (patch: Partial<PricingSectionData>) => void;
  onSave: () => Promise<void>;
}

export function SourcingProductPricingSection({
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
}: SourcingProductPricingSectionProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Euro className="h-4 w-4 mr-2" />
            Prix d'Achat
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
                <span className="animate-spin">⏳</span>
              ) : (
                <Save className="h-4 w-4" />
              )}
            </ButtonV2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cost_price" className="text-xs text-gray-600">
              Prix d'achat HT (€) *
            </Label>
            <div className="relative mt-1">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0.01"
                value={editedData?.cost_price ?? ''}
                onChange={e =>
                  onUpdateData({ cost_price: parseFloat(e.target.value) || 0 })
                }
                placeholder="250.00"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="eco_tax_default" className="text-xs text-gray-600">
              Éco-participation (€)
            </Label>
            <div className="relative mt-1">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
              <Input
                id="eco_tax_default"
                type="number"
                step="0.01"
                min="0"
                value={editedData?.eco_tax_default ?? ''}
                onChange={e =>
                  onUpdateData({
                    eco_tax_default: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="2.50"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Taxe éco-responsable (DEEE, mobilier...)
            </p>
          </div>
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
          <Euro className="h-4 w-4 mr-2" />
          Prix d'Achat
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs text-red-600 font-medium mb-1">
            Prix d'achat HT
          </p>
          <p className="text-xl font-bold text-red-900">
            {product.cost_price
              ? formatPrice(product.cost_price)
              : 'Non défini'}
            {product.cost_net_avg != null &&
              product.cost_net_avg !== product.cost_price && (
                <span className="text-sm font-normal text-red-600 ml-1">
                  ({formatPrice(product.cost_net_avg)} net)
                </span>
              )}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-orange-600 font-medium mb-1">
            Éco-participation
          </p>
          <p className="text-xl font-bold text-orange-900">
            {product.eco_tax_default
              ? formatPrice(product.eco_tax_default)
              : '0,00 €'}
          </p>
        </div>
      </div>
    </div>
  );
}

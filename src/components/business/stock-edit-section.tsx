'use client';

import React from 'react';
import { Truck, Save, X } from 'lucide-react';
import { ButtonV2 } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '../../lib/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '../../hooks/use-inline-edit';

interface Product {
  id: string;
  condition: 'new' | 'refurbished' | 'used';
  min_stock?: number;
}

interface StockEditSectionProps {
  product: Product;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
}

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'refurbished', label: 'Reconditionné' },
  { value: 'used', label: 'Occasion' },
] as const;

/**
 * Section édition paramètres stock produit (Simplifié)
 *
 * **Champs éditables** (par utilisateur):
 * - `min_stock`: Seuil alerte minimum
 * - `condition`: État produit (new/refurbished/used)
 *
 * **Note**: Les statuts (stock_status, product_status) sont gérés dans la sidebar
 * via les composants StockStatusCompact et ProductStatusCompact (Phase 3.4).
 *
 * @see useInlineEdit pour logique sauvegarde (section 'stock')
 */
export const StockEditSection = React.memo(
  function StockEditSection({
    product,
    onUpdate,
    className,
  }: StockEditSectionProps) {
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
        console.error('❌ Erreur mise à jour stock:', error);
      },
    });

    const section: EditableSection = 'stock';
    const editData = getEditedData(section);
    const error = getError(section);

    const handleStartEdit = () => {
      startEdit(section, {
        condition: product.condition,
        min_stock: product.min_stock || 5,
      });
    };

    const handleSave = async () => {
      const success = await saveChanges(section);
      if (success) {
        // Optionnel : afficher une notification de succès
      }
    };

    const handleCancel = () => {
      cancelEdit(section);
    };

    const handleFieldChange = (field: string, value: any) => {
      updateEditedData(section, { [field]: value });
    };

    if (isEditing(section)) {
      return (
        <div className={cn('card-verone p-4', className)}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-black flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Stock
            </h3>
            <div className="flex space-x-2">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving(section)}
              >
                <X className="h-3 w-3 mr-1" />
                Annuler
              </ButtonV2>
              <ButtonV2
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges(section) || isSaving(section)}
              >
                <Save className="h-3 w-3 mr-1" />
                {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
              </ButtonV2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Seuil d'alerte minimum */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Seuil d'alerte minimum
              </label>
              <input
                type="number"
                value={editData?.min_stock || 0}
                onChange={e =>
                  handleFieldChange('min_stock', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                min="0"
                step="1"
              />
              <div className="text-xs text-gray-500 mt-1">
                Alerte lorsque le stock descend en dessous de cette valeur
              </div>
            </div>

            {/* Condition Produit */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Condition Produit
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CONDITION_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center p-2 border rounded-md cursor-pointer transition-colors',
                      editData?.condition === option.value
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={option.value}
                      checked={editData?.condition === option.value}
                      onChange={e =>
                        handleFieldChange('condition', e.target.value)
                      }
                      className="sr-only"
                    />
                    <span className="text-sm text-black">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
              ❌ {error}
            </div>
          )}
        </div>
      );
    }

    // Mode affichage
    const currentCondition = CONDITION_OPTIONS.find(
      opt => opt.value === product.condition
    );

    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Stock
          </h3>
          <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
            <Truck className="h-3 w-3 mr-1" />
            Modifier
          </ButtonV2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black opacity-70">Seuil minimum:</span>
            <span className="text-black">{product.min_stock || 5} unités</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black opacity-70">Condition:</span>
            <Badge variant="outline">{currentCondition?.label}</Badge>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Ne re-render QUE si les champs stock changent
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.condition === nextProps.product.condition &&
      prevProps.product.min_stock === nextProps.product.min_stock
    );
  }
);

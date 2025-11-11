'use client';

import React from 'react';

import { useInlineEdit, type EditableSection } from '@verone/common/hooks';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { Truck, Save, X } from 'lucide-react';

interface Product {
  id: string;
  min_stock?: number;
}

interface StockEditSectionProps {
  product: Product;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
}

/**
 * Section édition paramètres stock produit (Simplifié)
 *
 * **Champs éditables** (par utilisateur):
 * - `min_stock`: Seuil alerte minimum
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
        min_stock: product.min_stock ?? 0,
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving(section)}
              >
                <X className="h-3 w-3 mr-1" />
                Annuler
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges(section) || isSaving(section)}
              >
                <Save className="h-3 w-3 mr-1" />
                {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
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
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Stock
          </h3>
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            <Truck className="h-3 w-3 mr-1" />
            Modifier
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-black opacity-70">Seuil minimum:</span>
            <span className="text-black">{product.min_stock ?? 0} unités</span>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Ne re-render QUE si les champs stock changent
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.min_stock === nextProps.product.min_stock
    );
  }
);

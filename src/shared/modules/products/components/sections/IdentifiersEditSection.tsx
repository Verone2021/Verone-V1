'use client';

import { useState } from 'react';

import { Tag, Save, X, RefreshCw } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { generateSKU } from '@/lib/business-rules/naming-rules';
import { cn } from '@verone/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@/shared/modules/common/hooks/use-inline-edit';

interface Product {
  id: string;
  sku: string;
  slug: string;
  supplier_reference?: string;
  gtin?: string;
  variant_attributes?: Record<string, any>;
}

interface IdentifiersEditSectionProps {
  product: Product;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
}

export function IdentifiersEditSection({
  product,
  onUpdate,
  className,
}: IdentifiersEditSectionProps) {
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
      console.error('❌ Erreur mise à jour identifiants:', error);
    },
  });

  const section: EditableSection = 'identifiers';
  const editData = getEditedData(section);
  const error = getError(section);

  const handleStartEdit = () => {
    startEdit(section, {
      sku: product.sku,
      slug: product.slug,
      supplier_reference: product.supplier_reference || '',
      gtin: product.gtin || '',
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

  const handleFieldChange = (field: string, value: string) => {
    updateEditedData(section, { [field]: value });
  };

  const generateNewSKU = () => {
    if (!editData) return;

    // Générer un nouveau SKU basé sur les règles métier
    const familyCode = 'GEN'; // TODO: Récupérer depuis la hiérarchie
    const productCode = editData.sku.split('-')[1] || 'PROD';
    const newSKU = generateSKU(
      familyCode,
      productCode,
      product.variant_attributes
    );

    handleFieldChange('sku', newSKU);
  };

  const generateSlugFromSKU = () => {
    if (!editData?.sku) return;

    const slug = editData.sku.toLowerCase().replace(/-/g, '-');
    handleFieldChange('slug', slug);
  };

  const validateGTIN = (gtin: string): boolean => {
    // Validation basique GTIN-8, GTIN-12, GTIN-13, GTIN-14
    const cleanGTIN = gtin.replace(/\D/g, '');
    return [8, 12, 13, 14].includes(cleanGTIN.length);
  };

  if (isEditing(section)) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-black flex items-center">
            <Tag className="h-4 w-4 mr-1" />
            Identifiants & Références
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
          {/* SKU */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-black">
                SKU (Stock Keeping Unit) *
              </label>
              <ButtonV2
                type="button"
                variant="outline"
                size="sm"
                onClick={generateNewSKU}
                className="h-6 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto
              </ButtonV2>
            </div>
            <input
              type="text"
              value={editData?.sku || ''}
              onChange={e =>
                handleFieldChange('sku', e.target.value.toUpperCase())
              }
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="PRD-001-BLA-CER"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Format recommandé: [FAMILLE]-[PRODUIT]-[COULEUR]-[MATIERE]
            </div>
          </div>

          {/* Slug URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-black">
                URL Slug *
              </label>
              <ButtonV2
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSlugFromSKU}
                className="h-6 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Depuis SKU
              </ButtonV2>
            </div>
            <input
              type="text"
              value={editData?.slug || ''}
              onChange={e =>
                handleFieldChange(
                  'slug',
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                )
              }
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="produit-variant-unique"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Utilisé dans l'URL. Caractères autorisés: a-z, 0-9, -
            </div>
          </div>

          {/* Référence fournisseur */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Référence fournisseur
            </label>
            <input
              type="text"
              value={editData?.supplier_reference || ''}
              onChange={e =>
                handleFieldChange('supplier_reference', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="REF-FOURNISSEUR-123"
            />
            <div className="text-xs text-gray-500 mt-1">
              Référence interne du fournisseur pour ce produit
            </div>
          </div>

          {/* GTIN/EAN */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              GTIN/EAN (Code-barres)
            </label>
            <input
              type="text"
              value={editData?.gtin || ''}
              onChange={e =>
                handleFieldChange('gtin', e.target.value.replace(/\D/g, ''))
              }
              className={cn(
                'w-full px-3 py-2 font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black',
                editData?.gtin && !validateGTIN(editData.gtin)
                  ? 'border-red-300'
                  : 'border-gray-300'
              )}
              placeholder="1234567890123"
              maxLength={14}
            />
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs text-gray-500">
                Code-barres international (8, 12, 13 ou 14 chiffres)
              </div>
              {editData?.gtin && (
                <div
                  className={cn(
                    'text-xs font-medium',
                    validateGTIN(editData.gtin)
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {validateGTIN(editData.gtin) ? '✓ Valide' : '✗ Invalide'}
                </div>
              )}
            </div>
          </div>

          {/* Aperçu des URLs générées */}
          {editData && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium text-black mb-2">
                Aperçu URLs générées
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-gray-600">Page produit:</span>
                  <div className="font-mono text-blue-600">
                    /catalogue/{editData.slug}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">API:</span>
                  <div className="font-mono text-blue-600">
                    /api/products/{product.id}
                  </div>
                </div>
              </div>
            </div>
          )}
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
        <h3 className="text-sm font-medium text-black flex items-center">
          <Tag className="h-4 w-4 mr-1" />
          Identifiants & Références
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Tag className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-2 text-xs">
        {/* ID (readonly) */}
        <div>
          <span className="text-black opacity-70">ID (readonly):</span>
          <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 break-all">
            {product.id}
          </div>
        </div>

        {/* SKU */}
        <div>
          <span className="text-black opacity-70">SKU:</span>
          <div className="font-mono text-sm font-medium text-black bg-blue-50 px-2 py-1 rounded mt-1">
            {product.sku}
          </div>
        </div>

        {/* Slug */}
        <div>
          <span className="text-black opacity-70">URL Slug:</span>
          <div className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
            {product.slug}
          </div>
        </div>

        {/* Référence fournisseur */}
        {product.supplier_reference && (
          <div>
            <span className="text-black opacity-70">Ref. Fournisseur:</span>
            <div className="font-medium text-black bg-gray-100 px-2 py-1 rounded mt-1">
              {product.supplier_reference}
            </div>
          </div>
        )}

        {/* GTIN */}
        {product.gtin && (
          <div>
            <span className="text-black opacity-70">GTIN/EAN:</span>
            <div className="font-mono text-black bg-gray-100 px-2 py-1 rounded mt-1">
              {product.gtin}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

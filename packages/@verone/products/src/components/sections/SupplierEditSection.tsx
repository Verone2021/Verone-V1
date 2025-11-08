'use client';

import { useState } from 'react';

import { Truck, Save, X, Edit, ExternalLink, AlertCircle } from 'lucide-react';

import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@verone/common/hooks/use-inline-edit';
import { SupplierSelector } from '@verone/suppliers/components/selectors/SupplierSelector';

interface Product {
  id: string;
  supplier_id?: string;
  supplier_reference?: string;
  supplier_page_url?: string;
  variant_group_id?: string | null;
  supplier?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

interface VariantGroup {
  id: string;
  name: string;
  has_common_supplier: boolean;
  supplier_id?: string | null;
}

interface SupplierEditSectionProps {
  product: Product;
  variantGroup?: VariantGroup | null;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
}

export function SupplierEditSection({
  product,
  variantGroup,
  onUpdate,
  className,
}: SupplierEditSectionProps) {
  // Vérifier si le fournisseur est géré au niveau du groupe
  const isSupplierManagedByGroup = !!(
    variantGroup?.has_common_supplier && product.variant_group_id
  );
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
      console.error('❌ Erreur mise à jour données fournisseur:', error);
    },
  });

  const section: EditableSection = 'supplier';
  const editData = getEditedData(section);
  const error = getError(section);

  // Données actuelles
  const currentSupplierName = product.supplier?.name || 'Non défini';
  const currentSupplierReference = product.supplier_reference || '-';
  const currentSupplierPageUrl = product.supplier_page_url || null;

  const handleStartEdit = () => {
    startEdit(section, {
      supplier_id: product.supplier_id || null,
      supplier_reference: product.supplier_reference || '',
      supplier_page_url: product.supplier_page_url || '',
    });
  };

  const handleSave = async () => {
    const success = await saveChanges(section);
    if (success) {
      console.log('✅ Données fournisseur mises à jour avec succès');
    }
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const handleFieldChange = (field: string, value: string | null) => {
    updateEditedData(section, { [field]: value });
  };

  if (isEditing(section)) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Informations Fournisseur
          </h3>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCancel}
              disabled={isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* SÉLECTION FOURNISSEUR */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">
              🏢 FOURNISSEUR PRINCIPAL
            </h4>
            <SupplierSelector
              selectedSupplierId={editData?.supplier_id || null}
              onSupplierChange={supplierId =>
                handleFieldChange('supplier_id', supplierId)
              }
              label="Fournisseur"
              placeholder="Sélectionner un fournisseur"
              className="w-full"
            />
            <div className="text-xs text-blue-600 mt-2">
              Organisation qui fournit ce produit
            </div>
          </div>

          {/* RÉFÉRENCE FOURNISSEUR */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-800 mb-3">
              🔖 RÉFÉRENCE FOURNISSEUR
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence / SKU fournisseur
              </label>
              <input
                type="text"
                value={editData?.supplier_reference || ''}
                onChange={e =>
                  handleFieldChange('supplier_reference', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: CHAIR-BLU-001"
              />
              <div className="text-xs text-gray-600 mt-1">
                Référence produit dans le catalogue du fournisseur
              </div>
            </div>
          </div>

          {/* URL PAGE FOURNISSEUR */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-800 mb-3">
              🔗 PAGE CATALOGUE FOURNISSEUR
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL page produit
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={editData?.supplier_page_url || ''}
                  onChange={e =>
                    handleFieldChange('supplier_page_url', e.target.value)
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://fournisseur.com/produit/123"
                />
                {editData?.supplier_page_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(editData.supplier_page_url, '_blank')
                    }
                    type="button"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Lien direct vers la page produit chez le fournisseur
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
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
          Fournisseur
        </h3>
        {isSupplierManagedByGroup ? (
          <p className="text-xs text-black">
            ℹ️ Géré par le groupe de variantes
          </p>
        ) : (
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </Button>
        )}
      </div>

      {/* Message informatif si géré par le groupe */}
      {isSupplierManagedByGroup && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          ℹ️ Le fournisseur est commun à toutes les variantes du groupe "
          {variantGroup?.name}".{' '}
          <a
            href={`/catalogue/variantes/${variantGroup?.id}`}
            className="underline font-medium hover:text-blue-900"
          >
            Modifier depuis la page du groupe
          </a>
        </div>
      )}

      <div className="space-y-3">
        {/* Fournisseur */}
        {product.supplier_id ? (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">
              🏢 FOURNISSEUR
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-medium">
                {currentSupplierName}
              </span>
            </div>
            {product.supplier?.email && (
              <div className="text-xs text-blue-700 mt-1">
                📧 {product.supplier.email}
              </div>
            )}
            {product.supplier?.phone && (
              <div className="text-xs text-blue-700">
                📞 {product.supplier.phone}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-500 italic">
              Aucun fournisseur défini
            </div>
          </div>
        )}

        {/* Référence fournisseur */}
        {product.supplier_reference && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-1">
              🔖 RÉFÉRENCE FOURNISSEUR
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-mono text-sm">
                {currentSupplierReference}
              </span>
            </div>
          </div>
        )}

        {/* URL page fournisseur */}
        {currentSupplierPageUrl && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 font-medium mb-1">
              🔗 PAGE FOURNISSEUR
            </div>
            <div className="flex justify-between items-center">
              <a
                href={currentSupplierPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center underline"
              >
                Voir sur le site fournisseur
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        )}

        {/* Message si aucune donnée */}
        {!product.supplier_id &&
          !product.supplier_reference &&
          !currentSupplierPageUrl && (
            <div className="text-center text-gray-400 text-xs italic py-2">
              Aucune information fournisseur renseignée
            </div>
          )}
      </div>
    </div>
  );
}

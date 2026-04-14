'use client';

import { useState } from 'react';

import { SupplierSelector } from '@verone/organisations/components/suppliers';
import { SupplierFormModal } from '@verone/organisations/components/forms';
import { ButtonV2 } from '@verone/ui';
import {
  AlertCircle,
  Building,
  Edit,
  Globe,
  Plus,
  Save,
  X,
} from 'lucide-react';

import type { SourcingProduct, SupplierSectionData } from './types';

interface SourcingProductSupplierSectionProps {
  product: SourcingProduct;
  isEditing: boolean;
  isSaving: boolean;
  editedData: SupplierSectionData | null;
  error: string | null;
  hasChanges: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateData: (patch: Partial<SupplierSectionData>) => void;
  onSave: () => Promise<void>;
}

export function SourcingProductSupplierSection({
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
}: SourcingProductSupplierSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Fournisseur
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

        <SupplierSelector
          selectedSupplierId={editedData?.supplier_id ?? null}
          onSupplierChange={supplierId => {
            onUpdateData({ supplier_id: supplierId ?? null });
          }}
          label="Sélectionner un fournisseur"
          placeholder="Rechercher un fournisseur..."
          required={false}
        />

        <ButtonV2
          variant="outline"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="w-full mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau fournisseur
        </ButtonV2>

        <SupplierFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={newSupplier => {
            onUpdateData({ supplier_id: newSupplier.id });
            setShowCreateModal(false);
          }}
        />

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
          <Building className="h-4 w-4 mr-2" />
          Fournisseur
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

      {product.supplier ? (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-lg font-semibold text-blue-900 mb-2">
            {product.supplier.name}
          </p>
          <div className="flex flex-col space-y-1">
            <a
              href={`/contacts-organisations/suppliers/${product.supplier.id}`}
              className="inline-flex items-center text-blue-600 hover:underline text-sm"
            >
              <Building className="h-4 w-4 mr-2" />
              Voir la fiche fournisseur
            </a>
            {product.supplier.website && (
              <a
                href={product.supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:underline text-sm"
              >
                <Globe className="h-4 w-4 mr-2" />
                Site web du fournisseur
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
          <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Aucun fournisseur assigné</p>
          <p className="text-xs text-gray-500 mt-1">
            Cliquez sur l'icône de modification pour en ajouter un
          </p>
        </div>
      )}
    </div>
  );
}

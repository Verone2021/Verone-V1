'use client';

import type { useRouter } from 'next/navigation';

import { Input } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { ChevronLeft, Edit3, Plus, Package } from 'lucide-react';

import { getVariantTypeIcon, formatVariantType } from './variant-utils';

interface VariantGroupHeaderProps {
  variantGroupName: string;
  variantType: string | undefined;
  editingName: boolean;
  editedName: string;
  savingName: boolean;
  onEditGroup: () => void;
  onCreateProduct: () => void;
  onAddProducts: () => void;
  onStartEditName: () => void;
  onSaveName: () => Promise<void>;
  onCancelEditName: () => void;
  onEditedNameChange: (value: string) => void;
  router: ReturnType<typeof useRouter>;
}

export function VariantGroupHeader({
  variantGroupName,
  variantType,
  editingName,
  editedName,
  savingName,
  onEditGroup,
  onCreateProduct,
  onAddProducts,
  onStartEditName,
  onSaveName,
  onCancelEditName,
  onEditedNameChange,
  router,
}: VariantGroupHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <ButtonV2
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </ButtonV2>
        <div>
          <div className="flex items-center gap-3">
            {getVariantTypeIcon(variantType ?? '')}
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editedName}
                  onChange={e => onEditedNameChange(e.target.value)}
                  onBlur={() => {
                    void onSaveName().catch(error => {
                      console.error('[VariantGroup] Save name failed:', error);
                    });
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      void onSaveName().catch(error => {
                        console.error(
                          '[VariantGroup] Save name failed:',
                          error
                        );
                      });
                    }
                    if (e.key === 'Escape') onCancelEditName();
                  }}
                  disabled={savingName}
                  className="text-2xl font-bold h-10"
                  autoFocus
                />
                {savingName && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold text-gray-900">
                  {variantGroupName}
                </h1>
                <button
                  onClick={onStartEditName}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Modifier le nom"
                >
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Type: {formatVariantType(variantType)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onEditGroup}
          className="flex items-center"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Modifier les informations
        </ButtonV2>
        <ButtonV2
          size="sm"
          onClick={onCreateProduct}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer un produit
        </ButtonV2>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={onAddProducts}
          className="flex items-center"
        >
          <Package className="w-4 h-4 mr-2" />
          Importer existants
        </ButtonV2>
      </div>
    </div>
  );
}

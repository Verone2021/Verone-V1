/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';

import { Edit, Package, Home } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@verone/common/hooks/use-inline-edit';
import type { RoomType } from '@verone/types';
import { getRoomLabel } from '@verone/types';

import { CharacteristicsEditForm } from './CharacteristicsEditForm';

interface Product {
  id: string;
  name: string;
  variant_attributes?: Record<string, any>;
  dimensions?: Record<string, any>;
  suitable_rooms?: string[];
}

interface CharacteristicsEditSectionProps {
  product: Product;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
}

const formatDimension = (value: string): string => {
  if (!value) return value;
  if (
    value.includes('cm') ||
    value.includes('mm') ||
    value.includes('m') ||
    value.includes('kg') ||
    value.includes('g')
  ) {
    return value;
  }
  if (value.toLowerCase().includes('poids')) {
    return value.includes('kg') ? value : `${value} kg`;
  }
  return `${value} cm`;
};

export function CharacteristicsEditSection({
  product,
  onUpdate,
  className,
}: CharacteristicsEditSectionProps) {
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [newDimensionKey, setNewDimensionKey] = useState('');
  const [newDimensionValue, setNewDimensionValue] = useState('');

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
      console.error('Erreur mise à jour caractéristiques:', error);
    },
  });

  const section = 'characteristics' as EditableSection;
  const editData = getEditedData(section) as Product | null;
  const error = getError(section);

  const handleStartEdit = () => {
    startEdit(section, {
      variant_attributes: product.variant_attributes ?? {},
      dimensions: product.dimensions ?? {},
      suitable_rooms: (product.suitable_rooms ?? []) as RoomType[],
    });
  };

  const handleSave = async () => {
    await saveChanges(section);
  };

  const addVariantAttribute = () => {
    if (newAttributeKey.trim() && newAttributeValue.trim()) {
      const variants = { ...(editData?.variant_attributes ?? {}) };
      variants[newAttributeKey.trim()] = newAttributeValue.trim();
      updateEditedData(section, { variant_attributes: variants });
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  const removeVariantAttribute = (key: string) => {
    const variants = { ...(editData?.variant_attributes ?? {}) };
    delete variants[key];
    updateEditedData(section, { variant_attributes: variants });
  };

  const addDimension = () => {
    if (newDimensionKey.trim() && newDimensionValue.trim()) {
      const dimensions = { ...(editData?.dimensions ?? {}) };
      dimensions[newDimensionKey.trim()] = newDimensionValue.trim();
      updateEditedData(section, { dimensions });
      setNewDimensionKey('');
      setNewDimensionValue('');
    }
  };

  const removeDimension = (key: string) => {
    const dimensions = { ...(editData?.dimensions ?? {}) };
    delete dimensions[key];
    updateEditedData(section, { dimensions });
  };

  if (isEditing(section)) {
    return (
      <div className={cn('bg-white border border-black p-4', className)}>
        <CharacteristicsEditForm
          editData={editData}
          newAttributeKey={newAttributeKey}
          newAttributeValue={newAttributeValue}
          newDimensionKey={newDimensionKey}
          newDimensionValue={newDimensionValue}
          isSaving={isSaving(section)}
          hasChanges={hasChanges(section)}
          error={error}
          onNewAttributeKeyChange={setNewAttributeKey}
          onNewAttributeValueChange={setNewAttributeValue}
          onNewDimensionKeyChange={setNewDimensionKey}
          onNewDimensionValueChange={setNewDimensionValue}
          onAddAttribute={addVariantAttribute}
          onRemoveAttribute={removeVariantAttribute}
          onAddDimension={addDimension}
          onRemoveDimension={removeDimension}
          onSave={() => {
            void handleSave().catch(() => undefined);
          }}
          onCancel={() => cancelEdit(section)}
        />
      </div>
    );
  }

  const characteristics = product.variant_attributes ?? {};
  const dimensions = product.dimensions ?? {};
  const rooms = (product.suitable_rooms ?? []) as RoomType[];
  const hasCharacteristics = Object.values(characteristics).some(
    v => v && v.toString().trim() !== ''
  );
  const hasDimensions = Object.values(dimensions).some(
    v => v && v.toString().trim() !== ''
  );
  const hasRooms = rooms.length > 0;
  const hasAnyData = hasCharacteristics || hasDimensions || hasRooms;

  return (
    <div className={cn('bg-white border border-black p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Caractéristiques & Spécifications
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      {hasAnyData ? (
        <div className="space-y-6">
          {hasCharacteristics && (
            <div className="space-y-3">
              <h4 className="text-base font-medium text-black flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Caractéristiques
              </h4>
              <div className="space-y-3">
                {Object.entries(characteristics).map(
                  ([key, value]) =>
                    value && (
                      <div
                        key={key}
                        className="flex justify-between items-start"
                      >
                        <div className="text-sm font-medium text-gray-600 min-w-[120px]">
                          {key}:
                        </div>
                        <div className="text-gray-900 text-sm text-right flex-1">
                          {value as string}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {hasDimensions && (
            <div className="space-y-3">
              <h4 className="text-base font-medium text-black flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Dimensions
              </h4>
              <div className="space-y-3">
                {Object.entries(dimensions).map(
                  ([key, value]) =>
                    value && (
                      <div
                        key={key}
                        className="flex justify-between items-start"
                      >
                        <div className="text-sm font-medium text-gray-600 min-w-[120px]">
                          {key}:
                        </div>
                        <div className="text-gray-900 text-sm text-right flex-1">
                          {formatDimension(value as string)}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {hasRooms && (
            <div className="space-y-3">
              <h4 className="text-base font-medium text-black flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Pièces d'utilisation
              </h4>
              <div className="flex flex-wrap gap-2">
                {rooms.map(roomType => (
                  <Badge
                    key={roomType}
                    variant="outline"
                    className="border-black text-black text-xs"
                  >
                    {getRoomLabel(roomType)}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Adapté pour {rooms.length} pièce{rooms.length > 1 ? 's' : ''}{' '}
                différente{rooms.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400 text-sm italic py-6">
          <div className="space-y-2">
            <Package className="h-8 w-8 mx-auto opacity-30" />
            <div>Aucune caractéristique, dimension ou pièce définie</div>
            <div className="text-xs">
              Cliquez sur "Modifier" pour ajouter des informations
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

import { Save, X, Package, Plus, Home, Edit } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { ButtonUnified } from '@/components/ui/button-unified';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoomMultiSelect } from '@/components/ui/room-multi-select';
import { cn } from '@/lib/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@/shared/modules/common/hooks/use-inline-edit';
import type { RoomType } from '@/types/room-types';
import { getRoomLabel } from '@/types/room-types';

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

// Helper function pour formater les dimensions avec les unités
const formatDimension = (value: string): string => {
  if (!value) return value;

  // Si la valeur contient déjà une unité, la retourner telle quelle
  if (
    value.includes('cm') ||
    value.includes('mm') ||
    value.includes('m') ||
    value.includes('kg') ||
    value.includes('g')
  ) {
    return value;
  }

  // Pour le poids, on assume des kg si c'est un nombre seul
  if (value.toLowerCase().includes('poids')) {
    return value.includes('kg') ? value : `${value} kg`;
  }

  // Sinon, ajouter 'cm' par défaut pour les dimensions
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
      console.error('❌ Erreur mise à jour caractéristiques:', error);
    },
  });

  const section = 'characteristics' as EditableSection;
  const editData = getEditedData(section);
  const error = getError(section);

  const handleStartEdit = () => {
    const currentCharacteristics = product.variant_attributes || {};
    const currentDimensions = product.dimensions || {};
    const currentRooms = (product.suitable_rooms || []) as RoomType[];
    startEdit(section, {
      variant_attributes: currentCharacteristics,
      dimensions: currentDimensions,
      suitable_rooms: currentRooms,
    });
  };

  const handleSave = async () => {
    const success = await saveChanges(section);
    if (success) {
      console.log('✅ Caractéristiques mises à jour avec succès');
    }
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const addVariantAttribute = () => {
    if (newAttributeKey.trim() && newAttributeValue.trim()) {
      const variants = { ...(editData?.variant_attributes || {}) };
      variants[newAttributeKey.trim()] = newAttributeValue.trim();
      updateEditedData(section, {
        variant_attributes: variants,
      });
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  const removeVariantAttribute = (key: string) => {
    const variants = { ...(editData?.variant_attributes || {}) };
    delete variants[key];
    updateEditedData(section, {
      variant_attributes: variants,
    });
  };

  const addDimension = () => {
    if (newDimensionKey.trim() && newDimensionValue.trim()) {
      const dimensions = { ...(editData?.dimensions || {}) };
      dimensions[newDimensionKey.trim()] = newDimensionValue.trim();
      updateEditedData(section, {
        dimensions: dimensions,
      });
      setNewDimensionKey('');
      setNewDimensionValue('');
    }
  };

  const removeDimension = (key: string) => {
    const dimensions = { ...(editData?.dimensions || {}) };
    delete dimensions[key];
    updateEditedData(section, {
      dimensions: dimensions,
    });
  };

  const handleRoomsChange = (rooms: RoomType[]) => {
    updateEditedData(section, {
      suitable_rooms: rooms,
    });
  };

  if (isEditing(section)) {
    return (
      <div className={cn('bg-white border border-black p-4', className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Caractéristiques
          </h3>
          <div className="flex space-x-1">
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

        <div className="space-y-4">
          {/* Liste des attributs existants */}
          {Object.keys(editData?.variant_attributes || {}).length > 0 && (
            <div className="space-y-2">
              <Label>Attributs définis :</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(editData?.variant_attributes || {}).map(
                  ([key, value]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span className="font-medium">{key}:</span>
                      <span>{value as string}</span>
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeVariantAttribute(key)}
                      >
                        <X className="h-3 w-3" />
                      </ButtonV2>
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}

          {/* Ajouter un nouvel attribut */}
          <div className="space-y-2">
            <Label>Ajouter un attribut :</Label>
            <div className="flex gap-2">
              <Input
                value={newAttributeKey}
                onChange={e => setNewAttributeKey(e.target.value)}
                placeholder="Nom de l'attribut (ex: Couleur)"
                className="flex-1 border-gray-300 focus:border-black focus:ring-black"
              />
              <Input
                value={newAttributeValue}
                onChange={e => setNewAttributeValue(e.target.value)}
                placeholder="Valeur (ex: Rouge)"
                className="flex-1 border-gray-300 focus:border-black focus:ring-black"
                onKeyPress={e => e.key === 'Enter' && addVariantAttribute()}
              />
              <ButtonV2
                type="button"
                variant="outline"
                onClick={addVariantAttribute}
                disabled={!newAttributeKey.trim() || !newAttributeValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </ButtonV2>
            </div>
          </div>

          {/* Suggestions d'attributs courants */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">
              Attributs suggérés :
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'Couleur', placeholder: 'Blanc, Noir, Rouge...' },
                { key: 'Matériau', placeholder: 'Bois, Métal, Tissu...' },
                { key: 'Finition', placeholder: 'Mat, Brillant, Satiné...' },
                { key: 'Style', placeholder: 'Moderne, Classique, Vintage...' },
                { key: 'Taille', placeholder: 'S, M, L, XL...' },
              ].map(({ key, placeholder }) => (
                <ButtonV2
                  key={key}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setNewAttributeKey(key);
                    setNewAttributeValue('');
                  }}
                >
                  + {key}
                </ButtonV2>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 my-6" />

          {/* Section Dimensions */}
          <div className="space-y-4">
            <h4 className="text-base font-medium text-black flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Dimensions
            </h4>

            {/* Liste des dimensions existantes */}
            {Object.keys(editData?.dimensions || {}).length > 0 && (
              <div className="space-y-2">
                <Label>Dimensions définies :</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(editData?.dimensions || {}).map(
                    ([key, value]) => (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <span className="font-medium">{key}:</span>
                        <span>{value as string}</span>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeDimension(key)}
                        >
                          <X className="h-3 w-3" />
                        </ButtonV2>
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Ajouter une nouvelle dimension */}
            <div className="space-y-2">
              <Label>Ajouter une dimension :</Label>
              <div className="flex gap-2">
                <Input
                  value={newDimensionKey}
                  onChange={e => setNewDimensionKey(e.target.value)}
                  placeholder="Type (ex: Longueur)"
                  className="flex-1 border-gray-300 focus:border-black focus:ring-black"
                />
                <div className="flex-1 relative">
                  <Input
                    value={newDimensionValue}
                    onChange={e => setNewDimensionValue(e.target.value)}
                    placeholder={
                      newDimensionKey.toLowerCase().includes('poids')
                        ? '2.5'
                        : '120'
                    }
                    className="border-gray-300 focus:border-black focus:ring-black pr-12"
                    onKeyPress={e => e.key === 'Enter' && addDimension()}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {newDimensionKey.toLowerCase().includes('poids')
                      ? 'kg'
                      : 'cm'}
                  </span>
                </div>
                <ButtonV2
                  type="button"
                  variant="outline"
                  onClick={addDimension}
                  disabled={
                    !newDimensionKey.trim() || !newDimensionValue.trim()
                  }
                >
                  <Plus className="h-4 w-4" />
                </ButtonV2>
              </div>
              <div className="text-xs text-gray-500">
                Les unités (cm, kg) sont ajoutées automatiquement à l'affichage
              </div>
            </div>

            {/* Suggestions de dimensions courantes */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">
                Dimensions suggérées :
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Longueur',
                  'Largeur',
                  'Hauteur',
                  'Profondeur',
                  'Diamètre',
                  'Épaisseur',
                  'Poids',
                ].map(dimension => (
                  <ButtonV2
                    key={dimension}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setNewDimensionKey(dimension);
                      setNewDimensionValue('');
                    }}
                  >
                    + {dimension}
                  </ButtonV2>
                ))}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 my-6" />

          {/* Section Pièces d'utilisation */}
          <div className="space-y-4">
            <h4 className="text-base font-medium text-black flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Pièces d'utilisation
            </h4>

            <div className="space-y-2">
              <Label>
                Sélectionner les pièces où ce produit peut être utilisé :
              </Label>
              <RoomMultiSelect
                value={editData?.suitable_rooms || []}
                onChange={handleRoomsChange}
                placeholder="Choisir les pièces..."
                className="w-full"
              />
              <div className="text-xs text-gray-500">
                Cette information aide les clients à trouver le produit selon
                leur besoin par pièce.
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // Mode affichage
  const characteristics = product.variant_attributes || {};
  const dimensions = product.dimensions || {};
  const rooms = (product.suitable_rooms || []) as RoomType[];

  const hasCharacteristics = Object.values(characteristics).some(
    value => value && value.toString().trim() !== ''
  );
  const hasDimensions = Object.values(dimensions).some(
    value => value && value.toString().trim() !== ''
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
        <ButtonUnified
          variant="outline"
          size="sm"
          icon={Edit}
          onClick={handleStartEdit}
        >
          Modifier
        </ButtonUnified>
      </div>

      {hasAnyData ? (
        <div className="space-y-6">
          {/* Section Caractéristiques */}
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

          {/* Section Dimensions */}
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

          {/* Section Pièces d'utilisation */}
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

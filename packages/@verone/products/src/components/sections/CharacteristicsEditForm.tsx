/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Save, X, Package, Plus, Home } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';

interface CharacteristicsEditFormProps {
  editData: {
    variant_attributes?: Record<string, any>;
    dimensions?: Record<string, any>;
    suitable_rooms?: string[];
  } | null;
  newAttributeKey: string;
  newAttributeValue: string;
  newDimensionKey: string;
  newDimensionValue: string;
  isSaving: boolean;
  hasChanges: boolean;
  error: string | null;
  onNewAttributeKeyChange: (v: string) => void;
  onNewAttributeValueChange: (v: string) => void;
  onNewDimensionKeyChange: (v: string) => void;
  onNewDimensionValueChange: (v: string) => void;
  onAddAttribute: () => void;
  onRemoveAttribute: (key: string) => void;
  onAddDimension: () => void;
  onRemoveDimension: (key: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CharacteristicsEditForm({
  editData,
  newAttributeKey,
  newAttributeValue,
  newDimensionKey,
  newDimensionValue,
  isSaving,
  hasChanges,
  error,
  onNewAttributeKeyChange,
  onNewAttributeValueChange,
  onNewDimensionKeyChange,
  onNewDimensionValueChange,
  onAddAttribute,
  onRemoveAttribute,
  onAddDimension,
  onRemoveDimension,
  onSave,
  onCancel,
}: CharacteristicsEditFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Caractéristiques
        </h3>
        <div className="flex space-x-2">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="h-3 w-3 mr-1" />
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </ButtonV2>
        </div>
      </div>

      {Object.keys(editData?.variant_attributes ?? {}).length > 0 && (
        <div className="space-y-2">
          <Label>Attributs définis :</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(editData?.variant_attributes ?? {}).map(
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
                    onClick={() => onRemoveAttribute(key)}
                  >
                    <X className="h-3 w-3" />
                  </ButtonV2>
                </Badge>
              )
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Ajouter un attribut :</Label>
        <div className="flex gap-2">
          <Input
            value={newAttributeKey}
            onChange={e => onNewAttributeKeyChange(e.target.value)}
            placeholder="Nom de l'attribut (ex: Couleur)"
            className="flex-1"
          />
          <Input
            value={newAttributeValue}
            onChange={e => onNewAttributeValueChange(e.target.value)}
            placeholder="Valeur (ex: Rouge)"
            className="flex-1"
            onKeyPress={e => e.key === 'Enter' && onAddAttribute()}
          />
          <ButtonV2
            type="button"
            variant="outline"
            onClick={onAddAttribute}
            disabled={!newAttributeKey.trim() || !newAttributeValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </ButtonV2>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Attributs suggérés :</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'Couleur' },
            { key: 'Matériau' },
            { key: 'Finition' },
            { key: 'Style' },
            { key: 'Taille' },
          ].map(({ key }) => (
            <ButtonV2
              key={key}
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                onNewAttributeKeyChange(key);
                onNewAttributeValueChange('');
              }}
            >
              + {key}
            </ButtonV2>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      <div className="space-y-4">
        <h4 className="text-base font-medium text-black flex items-center">
          <Package className="h-4 w-4 mr-2" />
          Dimensions
        </h4>

        {Object.keys(editData?.dimensions ?? {}).length > 0 && (
          <div className="space-y-2">
            <Label>Dimensions définies :</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(editData?.dimensions ?? {}).map(
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
                      onClick={() => onRemoveDimension(key)}
                    >
                      <X className="h-3 w-3" />
                    </ButtonV2>
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Ajouter une dimension :</Label>
          <div className="flex gap-2">
            <Input
              value={newDimensionKey}
              onChange={e => onNewDimensionKeyChange(e.target.value)}
              placeholder="Type (ex: Longueur)"
              className="flex-1"
            />
            <div className="flex-1 relative">
              <Input
                value={newDimensionValue}
                onChange={e => onNewDimensionValueChange(e.target.value)}
                placeholder={
                  newDimensionKey.toLowerCase().includes('poids')
                    ? '2.5'
                    : '120'
                }
                className="pr-12"
                onKeyPress={e => e.key === 'Enter' && onAddDimension()}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {newDimensionKey.toLowerCase().includes('poids') ? 'kg' : 'cm'}
              </span>
            </div>
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onAddDimension}
              disabled={!newDimensionKey.trim() || !newDimensionValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </ButtonV2>
          </div>
        </div>

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
                  onNewDimensionKeyChange(dimension);
                  onNewDimensionValueChange('');
                }}
              >
                + {dimension}
              </ButtonV2>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 my-6" />

      <div className="space-y-4">
        <h4 className="text-base font-medium text-black flex items-center">
          <Home className="h-4 w-4 mr-2" />
          Pièces d'utilisation
        </h4>
        <div className="text-xs text-gray-500">
          Cette information aide les clients à trouver le produit selon leur
          besoin par pièce.
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

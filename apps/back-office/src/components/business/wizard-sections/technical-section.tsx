'use client';

import { useState } from 'react';

import { Settings, Plus, X, Ruler } from 'lucide-react';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import type { WizardFormData } from '../complete-product-wizard';

interface TechnicalSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function TechnicalSection({
  formData,
  setFormData,
  onSave: _onSave,
}: TechnicalSectionProps) {
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  const updateField = (
    field: keyof WizardFormData,
    value: WizardFormData[keyof WizardFormData]
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const updateDimension = (key: string, value: string) => {
    const dimensions = { ...formData.dimensions };
    if (value) {
      dimensions[key] = parseFloat(value) ?? 0;
    } else {
      delete dimensions[key];
    }
    updateField('dimensions', dimensions);
  };

  const addVariantAttribute = () => {
    if (newAttributeKey.trim() && newAttributeValue.trim()) {
      const variants = { ...formData.variant_attributes };
      variants[newAttributeKey.trim()] = newAttributeValue.trim();
      updateField('variant_attributes', variants);
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  };

  const removeVariantAttribute = (key: string) => {
    const variants = { ...formData.variant_attributes };
    delete variants[key];
    updateField('variant_attributes', variants);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Caractéristiques techniques
          </CardTitle>
          <CardDescription>
            Spécifications physiques et attributs du produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dimensions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Ruler className="h-4 w-4" />
              <Label className="text-base font-medium">Dimensions</Label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Longueur</Label>
                <div className="flex">
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0"
                    value={String(formData.dimensions.length ?? '')}
                    onChange={e => updateDimension('length', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    cm
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Largeur</Label>
                <div className="flex">
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    value={String(formData.dimensions.width ?? '')}
                    onChange={e => updateDimension('width', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    cm
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Hauteur</Label>
                <div className="flex">
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={String(formData.dimensions.height ?? '')}
                    onChange={e => updateDimension('height', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    cm
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Poids</Label>
                <div className="flex">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={e => updateField('weight', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    kg
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé dimensions */}
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR to check if any dimension is truthy */}
            {(formData.dimensions.length ||
              formData.dimensions.width ||
              formData.dimensions.height ||
              formData.weight) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Résumé :</strong>{' '}
                  {[
                    formData.dimensions.length &&
                      `L${formData.dimensions.length}cm`,
                    formData.dimensions.width &&
                      `l${formData.dimensions.width}cm`,
                    formData.dimensions.height &&
                      `H${formData.dimensions.height}cm`,
                    formData.weight && `${formData.weight}kg`,
                  ]
                    .filter(Boolean)
                    .join(' × ')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attributs variants */}
      <Card>
        <CardHeader>
          <CardTitle>Attributs et variantes</CardTitle>
          <CardDescription>
            Caractéristiques spécifiques du produit (couleur, matériau,
            finition, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Liste des attributs existants */}
          {Object.keys(formData.variant_attributes).length > 0 && (
            <div className="space-y-2">
              <Label>Attributs définis :</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.variant_attributes).map(
                  ([key, value]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span className="font-medium">{key}:</span>
                      <span>{value as string}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeVariantAttribute(key)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
                className="flex-1"
              />
              <Input
                value={newAttributeValue}
                onChange={e => setNewAttributeValue(e.target.value)}
                placeholder="Valeur (ex: Rouge)"
                className="flex-1"
                onKeyPress={e => e.key === 'Enter' && addVariantAttribute()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addVariantAttribute}
                disabled={!newAttributeKey.trim() || !newAttributeValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
              ].map(({ key, placeholder: _placeholder }) => (
                <Button
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
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

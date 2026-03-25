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

interface DimensionInputProps {
  id: string;
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  unit: string;
}

function DimensionInput({
  id,
  label,
  value,
  onChange,
  unit,
}: DimensionInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex">
        <Input
          id={id}
          type="number"
          step="0.1"
          min="0"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="rounded-r-none"
        />
        <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
          {unit}
        </div>
      </div>
    </div>
  );
}

function DimensionsSummary({ formData }: { formData: WizardFormData }) {
  if (
    !(
      formData.dimensions.length ||
      formData.dimensions.width ||
      formData.dimensions.height ||
      formData.weight
    )
  ) {
    return null;
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600">
        <strong>Résumé :</strong>{' '}
        {[
          formData.dimensions.length && `L${formData.dimensions.length}cm`,
          formData.dimensions.width && `l${formData.dimensions.width}cm`,
          formData.dimensions.height && `H${formData.dimensions.height}cm`,
          formData.weight && `${formData.weight}kg`,
        ]
          .filter(Boolean)
          .join(' × ')}
      </div>
    </div>
  );
}

function DimensionsCard({
  formData,
  updateDimension,
  updateField,
}: {
  formData: WizardFormData;
  updateDimension: (key: string, value: string) => void;
  updateField: (
    field: keyof WizardFormData,
    value: WizardFormData[keyof WizardFormData]
  ) => void;
}) {
  return (
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
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Ruler className="h-4 w-4" />
            <Label className="text-base font-medium">Dimensions</Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DimensionInput
              id="length"
              label="Longueur"
              value={String(formData.dimensions.length ?? '')}
              onChange={v => updateDimension('length', v)}
              unit="cm"
            />
            <DimensionInput
              id="width"
              label="Largeur"
              value={String(formData.dimensions.width ?? '')}
              onChange={v => updateDimension('width', v)}
              unit="cm"
            />
            <DimensionInput
              id="height"
              label="Hauteur"
              value={String(formData.dimensions.height ?? '')}
              onChange={v => updateDimension('height', v)}
              unit="cm"
            />
            <DimensionInput
              id="weight"
              label="Poids"
              value={formData.weight}
              onChange={v => updateField('weight', v)}
              unit="kg"
            />
          </div>
          <DimensionsSummary formData={formData} />
        </div>
      </CardContent>
    </Card>
  );
}

function ExistingAttributes({
  attributes,
  onRemove,
}: {
  attributes: Record<string, unknown>;
  onRemove: (key: string) => void;
}) {
  if (Object.keys(attributes).length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Attributs définis :</Label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(attributes).map(([key, value]) => (
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
              onClick={() => onRemove(key)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function AddAttributeForm({
  onAdd,
}: {
  onAdd: (key: string, value: string) => void;
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onAdd(newKey.trim(), newValue.trim());
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Ajouter un attribut :</Label>
        <div className="flex gap-2">
          <Input
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="Nom de l'attribut (ex: Couleur)"
            className="flex-1"
          />
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="Valeur (ex: Rouge)"
            className="flex-1"
            onKeyPress={e => e.key === 'Enter' && handleAdd()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!newKey.trim() || !newValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Attributs suggérés :</Label>
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
                setNewKey(key);
                setNewValue('');
              }}
            >
              + {key}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}

export function TechnicalSection({
  formData,
  setFormData,
  onSave: _onSave,
}: TechnicalSectionProps) {
  const updateField = (
    field: keyof WizardFormData,
    value: WizardFormData[keyof WizardFormData]
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateDimension = (key: string, value: string) => {
    const dimensions = { ...formData.dimensions };
    if (value) {
      dimensions[key] = parseFloat(value) || 0;
    } else {
      delete dimensions[key];
    }
    updateField('dimensions', dimensions);
  };

  const addVariantAttribute = (key: string, value: string) => {
    const variants = { ...formData.variant_attributes };
    variants[key] = value;
    updateField('variant_attributes', variants);
  };

  const removeVariantAttribute = (key: string) => {
    const variants = { ...formData.variant_attributes };
    delete variants[key];
    updateField('variant_attributes', variants);
  };

  return (
    <div className="space-y-6">
      <DimensionsCard
        formData={formData}
        updateDimension={updateDimension}
        updateField={updateField}
      />
      <Card>
        <CardHeader>
          <CardTitle>Attributs et variantes</CardTitle>
          <CardDescription>
            Caractéristiques spécifiques du produit (couleur, matériau,
            finition, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExistingAttributes
            attributes={formData.variant_attributes}
            onRemove={removeVariantAttribute}
          />
          <AddAttributeForm onAdd={addVariantAttribute} />
        </CardContent>
      </Card>
    </div>
  );
}

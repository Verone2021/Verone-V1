'use client';

import { Input, Label } from '@verone/ui';
import { CategoryFilterCombobox } from '@verone/categories/components/filters/CategoryFilterCombobox';

interface WizardStep1BasicProps {
  name: string;
  baseSku: string;
  subcategoryId: string;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function WizardStep1Basic({
  name,
  baseSku,
  subcategoryId,
  onUpdate,
}: WizardStep1BasicProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <Label className="text-sm font-medium">
          Nom du groupe <span className="text-red-500">*</span>
        </Label>
        <Input
          value={name}
          onChange={e => {
            const newName = e.target.value;
            onUpdate({ name: newName });
          }}
          placeholder="Ex: Vase Eleonore, Table Oslo..."
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Le nom du groupe sera le prefixe de tous les produits
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium">
          SKU de base <span className="text-red-500">*</span>
        </Label>
        <Input
          value={baseSku}
          onChange={e => onUpdate({ base_sku: e.target.value })}
          placeholder="VAS-ELE"
          className="mt-1 font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          Prefixe SKU auto-genere. Les variantes seront VAS-ELE-001,
          VAS-ELE-002...
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium">
          Sous-categorie <span className="text-red-500">*</span>
        </Label>
        <CategoryFilterCombobox
          value={subcategoryId}
          onValueChange={val => onUpdate({ subcategory_id: val ?? '' })}
          placeholder="Selectionner une sous-categorie..."
          entityType="variant_groups"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Categorie commune a tous les produits du groupe
        </p>
      </div>
    </div>
  );
}

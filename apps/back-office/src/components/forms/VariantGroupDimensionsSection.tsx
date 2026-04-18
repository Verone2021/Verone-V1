'use client';

import type React from 'react';

import { Input, Label } from '@verone/ui';

import type { FormData } from './variant-group-form.types';

type DimensionFields = Pick<
  FormData,
  'common_length' | 'common_width' | 'common_height' | 'common_dimensions_unit'
>;

interface VariantGroupDimensionsSectionProps {
  formData: DimensionFields;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function VariantGroupDimensionsSection({
  formData,
  setFormData,
}: VariantGroupDimensionsSectionProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <Label className="text-sm font-medium">
          Attributs communs (optionnels)
        </Label>
        <p className="text-xs text-gray-600 mt-1">
          Ces informations seront automatiquement copiées vers tous les produits
          du groupe
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">
          📐 Dimensions
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Input
            type="number"
            placeholder="Longueur"
            value={formData.common_length}
            onChange={e =>
              setFormData(prev => ({ ...prev, common_length: e.target.value }))
            }
            className="text-sm"
            step="0.1"
            min="0"
          />
          <Input
            type="number"
            placeholder="Largeur"
            value={formData.common_width}
            onChange={e =>
              setFormData(prev => ({ ...prev, common_width: e.target.value }))
            }
            className="text-sm"
            step="0.1"
            min="0"
          />
          <Input
            type="number"
            placeholder="Hauteur"
            value={formData.common_height}
            onChange={e =>
              setFormData(prev => ({ ...prev, common_height: e.target.value }))
            }
            className="text-sm"
            step="0.1"
            min="0"
          />
          <select
            value={formData.common_dimensions_unit}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                common_dimensions_unit: e.target.value as 'cm' | 'm',
              }))
            }
            className="border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            <option value="cm">cm</option>
            <option value="m">m</option>
          </select>
        </div>
      </div>
    </div>
  );
}

'use client';

import type React from 'react';

import { Input, Label } from '@verone/ui';

import type { FormData } from './variant-group-form.types';

interface VariantGroupBasicFieldsProps {
  formData: Pick<FormData, 'name' | 'base_sku'>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Partial<FormData>;
}

export function VariantGroupBasicFields({
  formData,
  setFormData,
  errors,
}: VariantGroupBasicFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nom du groupe <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Ex: Paniers Osier Naturel"
          value={formData.name}
          onChange={e =>
            setFormData(prev => ({ ...prev, name: e.target.value }))
          }
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="base_sku" className="text-sm font-medium">
          SKU de base <span className="text-red-500">*</span>
        </Label>
        <Input
          id="base_sku"
          type="text"
          placeholder="Ex: PANIERS-OSIER-NATUREL"
          value={formData.base_sku}
          onChange={e =>
            setFormData(prev => ({ ...prev, base_sku: e.target.value }))
          }
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-600">
          Généré automatiquement depuis le nom. Pattern:{' '}
          {formData.base_sku
            ? `${formData.base_sku}-[VARIANTE]`
            : 'BASE_SKU-[VARIANTE]'}
        </p>
      </div>
    </>
  );
}

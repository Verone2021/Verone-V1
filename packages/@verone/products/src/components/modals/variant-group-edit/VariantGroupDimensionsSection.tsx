'use client';

import { Input, Label } from '@verone/ui';

const DIMENSION_UNITS = [
  { value: 'cm', label: 'Centimètres (cm)' },
  { value: 'm', label: 'Mètres (m)' },
  { value: 'mm', label: 'Millimètres (mm)' },
  { value: 'in', label: 'Pouces (in)' },
] as const;

interface VariantGroupDimensionsSectionProps {
  dimensionsLength: number | undefined;
  setDimensionsLength: (v: number | undefined) => void;
  dimensionsWidth: number | undefined;
  setDimensionsWidth: (v: number | undefined) => void;
  dimensionsHeight: number | undefined;
  setDimensionsHeight: (v: number | undefined) => void;
  dimensionsUnit: string;
  setDimensionsUnit: (v: 'cm' | 'm' | 'mm' | 'in') => void;
}

export function VariantGroupDimensionsSection({
  dimensionsLength,
  setDimensionsLength,
  dimensionsWidth,
  setDimensionsWidth,
  dimensionsHeight,
  setDimensionsHeight,
  dimensionsUnit,
  setDimensionsUnit,
}: VariantGroupDimensionsSectionProps) {
  return (
    <div className="space-y-3 pt-4 border-t">
      <Label className="text-sm font-medium">
        Dimensions communes (optionnel)
      </Label>
      <p className="text-xs text-gray-600">
        Si tous les produits du groupe ont les mêmes dimensions
      </p>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <Label htmlFor="length" className="text-xs">
            Longueur
          </Label>
          <Input
            id="length"
            type="number"
            step="0.01"
            value={dimensionsLength ?? ''}
            onChange={e =>
              setDimensionsLength(
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="width" className="text-xs">
            Largeur
          </Label>
          <Input
            id="width"
            type="number"
            step="0.01"
            value={dimensionsWidth ?? ''}
            onChange={e =>
              setDimensionsWidth(
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="height" className="text-xs">
            Hauteur
          </Label>
          <Input
            id="height"
            type="number"
            step="0.01"
            value={dimensionsHeight ?? ''}
            onChange={e =>
              setDimensionsHeight(
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="unit" className="text-xs">
            Unité
          </Label>
          <select
            id="unit"
            value={dimensionsUnit}
            onChange={e =>
              setDimensionsUnit(e.target.value as 'cm' | 'm' | 'mm' | 'in')
            }
            className="mt-1 w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            {DIMENSION_UNITS.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.value}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

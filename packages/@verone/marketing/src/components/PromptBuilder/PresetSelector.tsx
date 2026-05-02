'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';

import { getPresetsByBrand } from '../../data/presets';
import type { BrandSlug } from '../../types';

export interface PresetSelectorProps {
  brand: BrandSlug;
  value: string;
  onChange: (presetId: string) => void;
  disabled?: boolean;
}

export function PresetSelector({
  brand,
  value,
  onChange,
  disabled,
}: PresetSelectorProps) {
  const presets = getPresetsByBrand(brand);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full" aria-label="Preset">
        <SelectValue placeholder="Choisir un preset" />
      </SelectTrigger>
      <SelectContent>
        {presets.map(preset => (
          <SelectItem key={preset.id} value={preset.id}>
            <div className="flex flex-col">
              <span className="font-medium">{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.description} · {preset.format}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

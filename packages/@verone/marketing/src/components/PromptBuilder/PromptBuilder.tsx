'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Label } from '@verone/ui/components/ui/label';

import { getPresetsByBrand } from '../../data/presets';
import { composePrompt } from '../../lib/compose-prompt';
import type { BrandSlug } from '../../types';

import { BrandSelector } from './BrandSelector';
import { PresetSelector } from './PresetSelector';
import { ProductInput } from './ProductInput';
import { PromptPreview } from './PromptPreview';

export interface PromptBuilderProps {
  defaultBrand?: BrandSlug;
  defaultProduct?: string;
  onCopySuccess?: () => void;
  onCopyError?: (error: Error) => void;
}

export function PromptBuilder({
  defaultBrand = 'verone',
  defaultProduct = '',
  onCopySuccess,
  onCopyError,
}: PromptBuilderProps) {
  const [brand, setBrand] = useState<BrandSlug>(defaultBrand);
  const initialPresetId = getPresetsByBrand(defaultBrand)[0]?.id ?? '';
  const [presetId, setPresetId] = useState(initialPresetId);
  const [productDescription, setProductDescription] = useState(defaultProduct);

  useEffect(() => {
    const presets = getPresetsByBrand(brand);
    if (!presets.find(p => p.id === presetId) && presets[0]) {
      setPresetId(presets[0].id);
    }
  }, [brand, presetId]);

  const composed = useMemo(
    () =>
      composePrompt({
        brand,
        presetId,
        productDescription,
      }),
    [brand, presetId, productDescription]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1.5fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres du prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Marque</Label>
            <BrandSelector value={brand} onChange={setBrand} />
          </div>
          <div className="space-y-2">
            <Label>Preset</Label>
            <PresetSelector
              brand={brand}
              value={presetId}
              onChange={setPresetId}
            />
          </div>
          <ProductInput
            value={productDescription}
            onChange={setProductDescription}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {composed ? (
          <PromptPreview
            prompt={composed}
            onCopySuccess={onCopySuccess}
            onCopyError={onCopyError}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Choisis une marque et un preset pour voir le prompt généré.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

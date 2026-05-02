'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Label } from '@verone/ui/components/ui/label';
import { ProductOrVariantPicker, type PickedItem } from '@verone/products';
import { createClient } from '@verone/utils/supabase/client';

import { BRANDS } from '../../data/brands';
import { getPresetsByBrand } from '../../data/presets';
import { composePrompt } from '../../lib/compose-prompt';
import type { BrandSlug } from '../../types';

import { BrandSelector } from './BrandSelector';
import { PresetSelector } from './PresetSelector';
import { ProductInput } from './ProductInput';
import { PromptPreview } from './PromptPreview';

const supabase = createClient();
const ALL_SLUGS = BRANDS.map(b => b.slug);

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
  const [pickedItem, setPickedItem] = useState<PickedItem | null>(null);
  const [brandSlugById, setBrandSlugById] = useState<Record<string, BrandSlug>>(
    {}
  );

  const [brand, setBrand] = useState<BrandSlug>(defaultBrand);
  const initialPresetId = getPresetsByBrand(defaultBrand)[0]?.id ?? '';
  const [presetId, setPresetId] = useState(initialPresetId);
  const [productDescription, setProductDescription] = useState(defaultProduct);
  const [productDescriptionTouched, setProductDescriptionTouched] =
    useState(false);

  // Charger la table `brands` une seule fois pour mapper UUID -> slug
  useEffect(() => {
    let cancelled = false;
    void supabase
      .from('brands')
      .select('id, slug')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[PromptBuilder] load brands error:', error);
          return;
        }
        const map: Record<string, BrandSlug> = {};
        for (const row of data ?? []) {
          if (ALL_SLUGS.includes(row.slug as BrandSlug)) {
            map[row.id] = row.slug as BrandSlug;
          }
        }
        setBrandSlugById(map);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Marques disponibles pour l'étape 2 — dérivées du produit/variante choisi
  const availableBrandSlugs = useMemo<BrandSlug[]>(() => {
    if (!pickedItem) return ALL_SLUGS;
    const slugs = pickedItem.brandIds
      .map(id => brandSlugById[id])
      .filter((s): s is BrandSlug => Boolean(s));
    return slugs.length > 0 ? slugs : ALL_SLUGS;
  }, [pickedItem, brandSlugById]);

  // Quand le produit change, ajuste la marque automatiquement (cas 0 ou 1 marque)
  useEffect(() => {
    if (availableBrandSlugs.length === 0) return;
    if (!availableBrandSlugs.includes(brand)) {
      setBrand(availableBrandSlugs[0]);
    }
  }, [availableBrandSlugs, brand]);

  // Quand le produit change, pré-remplit la description (sauf si l'utilisateur a déjà tapé)
  useEffect(() => {
    if (!pickedItem) return;
    if (productDescriptionTouched) return;
    setProductDescription(pickedItem.displayName);
  }, [pickedItem, productDescriptionTouched]);

  useEffect(() => {
    const presets = getPresetsByBrand(brand);
    setPresetId(prev => {
      if (presets.find(p => p.id === prev)) return prev;
      return presets[0]?.id ?? '';
    });
  }, [brand]);

  const composed = useMemo(
    () =>
      composePrompt({
        brand,
        presetId,
        productDescription,
      }),
    [brand, presetId, productDescription]
  );

  const showBrandSelector = availableBrandSlugs.length !== 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1.5fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres du prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>
              Produit ou variante{' '}
              <span className="text-xs text-muted-foreground">
                (optionnel — pré-remplit la description)
              </span>
            </Label>
            <ProductOrVariantPicker
              value={pickedItem}
              onChange={item => {
                setPickedItem(item);
                setProductDescriptionTouched(false);
              }}
            />
            {pickedItem?.kind === 'product' &&
              pickedItem.brandIds.length === 0 && (
                <p className="text-xs text-amber-600">
                  Ce produit n'est rattaché à aucune marque interne. Choisis-en
                  une manuellement ci-dessous.
                </p>
              )}
            {pickedItem && availableBrandSlugs.length === 1 && (
              <p className="text-xs text-muted-foreground">
                Marque détectée :{' '}
                <strong>
                  {BRANDS.find(b => b.slug === availableBrandSlugs[0])?.name ??
                    availableBrandSlugs[0]}
                </strong>
              </p>
            )}
          </div>
          {showBrandSelector && (
            <div className="space-y-2">
              <Label>Marque</Label>
              <BrandSelector
                value={brand}
                onChange={setBrand}
                allowedSlugs={availableBrandSlugs}
              />
            </div>
          )}
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
            onChange={value => {
              setProductDescription(value);
              setProductDescriptionTouched(true);
            }}
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

'use client';

import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { Textarea } from '@verone/ui/components/ui/textarea';
import { Button } from '@verone/ui/components/ui/button';
import { ProductOrVariantPicker } from '@verone/products';
import type { PickedItem } from '@verone/products';
import { createClient } from '@verone/utils/supabase/client';
import { Wand2 } from 'lucide-react';
import { Switch } from '@verone/ui/components/ui/switch';
import { Label } from '@verone/ui/components/ui/label';

import { BRANDS } from '../../data/brands';
import { getPresetsByBrand } from '../../data/presets';
import { composePromptWithSources } from '../../lib/compose-prompt';
import { useGenerateMarketingImage } from '../../hooks/use-generate-marketing-image';
import type { BrandSlug, TargetChannel } from '../../types';

import { BrandSelector } from '../PromptBuilder/BrandSelector';
import { PresetSelector } from '../PromptBuilder/PresetSelector';
import { ChannelSelector } from './ChannelSelector';
import { SourceImagesSection } from './SourceImagesSection';
import { MediaPickerModal } from './MediaPickerModal';
import { GenerationResultCard } from './GenerationResultCard';
import type { BrandInfo } from '../MediaLibrary/MediaAssetCard';

// ============================================================================
// TYPES
// ============================================================================

const ALL_SLUGS = BRANDS.map(b => b.slug);
const supabase = createClient();

// ============================================================================
// HOOK : chargement des marques DB (slug → UUID)
// ============================================================================

function useBrandSlugMap() {
  const [brandSlugById, setBrandSlugById] = React.useState<
    Record<string, BrandSlug>
  >({});
  const [brandInfoList, setBrandInfoList] = React.useState<BrandInfo[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void supabase
      .from('brands')
      .select('id, slug, name, brand_color')
      .eq('is_active', true)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const slugMap: Record<string, BrandSlug> = {};
        const infoList: BrandInfo[] = [];
        for (const row of data) {
          if (ALL_SLUGS.includes(row.slug as BrandSlug)) {
            slugMap[row.id] = row.slug as BrandSlug;
          }
          infoList.push({
            id: row.id,
            slug: row.slug,
            name: row.name ?? '',
            brand_color: row.brand_color ?? null,
          });
        }
        setBrandSlugById(slugMap);
        setBrandInfoList(infoList);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { brandSlugById, brandInfoList };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MarketingStudio() {
  const { brandSlugById, brandInfoList } = useBrandSlugMap();

  // State formulaire
  const [noProduct, setNoProduct] = React.useState(false);
  const [pickedItems, setPickedItems] = React.useState<PickedItem[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [brand, setBrand] = React.useState<BrandSlug>('verone');
  const [presetId, setPresetId] = React.useState<string>(
    () => getPresetsByBrand('verone')[0]?.id ?? ''
  );
  const [targetChannel, setTargetChannel] =
    React.useState<TargetChannel>('instagram');
  const [customPrompt, setCustomPrompt] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const {
    generatePreview,
    savePreview,
    isGenerating,
    isSaving,
    previewData,
    savedAsset: _savedAsset,
    resetPreview,
  } = useGenerateMarketingImage();

  // Marques disponibles dérivées du produit sélectionné
  // En mode "sans produit lié" : toutes les marques disponibles
  const availableBrandSlugs = React.useMemo<BrandSlug[]>(() => {
    if (noProduct || pickedItems.length === 0) return ALL_SLUGS;
    const slugs = pickedItems
      .flatMap(item => item.brandIds)
      .map(id => brandSlugById[id])
      .filter((s): s is BrandSlug => Boolean(s));
    return slugs.length > 0 ? [...new Set(slugs)] : ALL_SLUGS;
  }, [noProduct, pickedItems, brandSlugById]);

  // Auto-sélectionner la marque si une seule est disponible
  React.useEffect(() => {
    if (!availableBrandSlugs.includes(brand)) {
      const first = availableBrandSlugs[0];
      if (first) setBrand(first);
    }
  }, [availableBrandSlugs, brand]);

  // Ajuster presetId quand la marque change
  React.useEffect(() => {
    const presets = getPresetsByBrand(brand);
    setPresetId(prev => {
      if (presets.find(p => p.id === prev)) return prev;
      return presets[0]?.id ?? '';
    });
  }, [brand]);

  // Prompt auto-composé
  const composedPrompt = React.useMemo(() => {
    return composePromptWithSources({
      brand,
      presetId,
      productDescription: pickedItems[0]?.displayName ?? '',
      sourceImagesCount: selectedAssetIds.length,
      targetChannel,
    });
  }, [brand, presetId, pickedItems, selectedAssetIds.length, targetChannel]);

  const promptDisplayed = customPrompt ?? composedPrompt?.text ?? '';

  const isFormValid =
    selectedAssetIds.length > 0 && brand && presetId && targetChannel;

  const productIds = pickedItems
    .filter(i => i.kind === 'product')
    .map(i => i.id);

  // Handlers
  const handleGenerate = React.useCallback(() => {
    if (!isFormValid) return;
    generatePreview({
      sourceImageIds: selectedAssetIds,
      productIds: productIds.length > 0 ? productIds : undefined,
      brandSlug: brand,
      presetId,
      targetChannel,
      customPrompt: customPrompt ?? undefined,
    });
  }, [
    isFormValid,
    generatePreview,
    selectedAssetIds,
    productIds,
    brand,
    presetId,
    targetChannel,
    customPrompt,
  ]);

  const handleSave = React.useCallback(() => {
    if (!previewData) return;
    savePreview({
      sourceImageIds: selectedAssetIds,
      productIds: productIds.length > 0 ? productIds : undefined,
      brandSlug: brand,
      presetId,
      targetChannel,
      customPrompt: customPrompt ?? undefined,
    });
  }, [
    previewData,
    savePreview,
    selectedAssetIds,
    productIds,
    brand,
    presetId,
    targetChannel,
    customPrompt,
  ]);

  const handleRegenerate = React.useCallback(() => {
    resetPreview();
    handleGenerate();
  }, [resetPreview, handleGenerate]);

  const handleNoProductToggle = React.useCallback((checked: boolean) => {
    setNoProduct(checked);
    if (checked) {
      setPickedItems([]);
    }
  }, []);

  const handlePickerSelect = React.useCallback((ids: string[]) => {
    setSelectedAssetIds(ids);
  }, []);

  const handlePromptChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCustomPrompt(e.target.value);
    },
    []
  );

  const handleResetPrompt = React.useCallback(() => {
    setCustomPrompt(null);
  }, []);

  // En mode "sans produit lié" : le sélecteur de marque est toujours visible
  const showBrandSelector = noProduct || availableBrandSlugs.length !== 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne formulaire */}
        <div className="space-y-4">
          {/* Étape 1 : Produit(s) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Étape 1 — Produit(s)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="no-product-toggle"
                  checked={noProduct}
                  onCheckedChange={handleNoProductToggle}
                />
                <Label
                  htmlFor="no-product-toggle"
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  Visuel sans produit lié (citation, ambiance, événement)
                </Label>
              </div>
              {!noProduct && (
                <ProductOrVariantPicker
                  value={pickedItems[0] ?? null}
                  onChange={item => setPickedItems(item ? [item] : [])}
                  eligibilityFilter="marketing_eligible"
                />
              )}
            </CardContent>
          </Card>

          {/* Étape 2 : Images sources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Étape 2 — Images sources (1 à 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SourceImagesSection
                selectedAssetIds={selectedAssetIds}
                onChange={setSelectedAssetIds}
                onOpenPicker={() => setPickerOpen(true)}
                disabledReason={
                  !noProduct && pickedItems.length === 0
                    ? "Choisis d'abord un produit à l'étape 1, ou active « Visuel sans produit lié »."
                    : null
                }
              />
            </CardContent>
          </Card>

          {/* Étape 3 : Marque */}
          {showBrandSelector && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Étape 3 — Marque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BrandSelector
                  value={brand}
                  onChange={setBrand}
                  allowedSlugs={availableBrandSlugs}
                />
              </CardContent>
            </Card>
          )}

          {/* Étape 4 : Mise en scène */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Étape {showBrandSelector ? 4 : 3} — Mise en scène
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PresetSelector
                brand={brand}
                value={presetId}
                onChange={setPresetId}
              />
            </CardContent>
          </Card>

          {/* Étape 5 : Canal cible */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Étape {showBrandSelector ? 5 : 4} — Canal cible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChannelSelector
                value={targetChannel}
                onChange={setTargetChannel}
              />
            </CardContent>
          </Card>

          {/* Étape 6 : Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Étape {showBrandSelector ? 6 : 5} — Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={promptDisplayed}
                onChange={handlePromptChange}
                rows={6}
                className="resize-none text-sm md:text-xs"
                placeholder="Le prompt sera généré automatiquement selon vos choix..."
              />
              {customPrompt !== null && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPrompt}
                  className="h-8 text-sm text-muted-foreground md:text-xs"
                >
                  Réinitialiser au prompt automatique
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Bouton Générer */}
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating || isSaving}
          >
            <Wand2 className="mr-2 h-5 w-5" />
            {isGenerating ? 'Génération en cours...' : "Générer l'image"}
          </Button>

          {!isFormValid && selectedAssetIds.length === 0 && (
            <p className="text-center text-sm text-muted-foreground md:text-xs">
              Sélectionnez au moins une image source pour générer.
            </p>
          )}
        </div>

        {/* Colonne résultat */}
        <div>
          <GenerationResultCard
            isGenerating={isGenerating}
            isSaving={isSaving}
            imageBase64={previewData?.imageBase64 ?? null}
            mimeType={previewData?.mimeType ?? null}
            modelUsed={previewData?.modelUsed ?? null}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* Modal picker — restreint aux images du produit/variante sélectionné(e) */}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        initialSelectedIds={selectedAssetIds}
        brands={brandInfoList}
        productId={
          noProduct
            ? null
            : pickedItems[0]?.kind === 'product'
              ? pickedItems[0].id
              : null
        }
        variantGroupId={
          noProduct
            ? null
            : pickedItems[0]?.kind === 'variant_group'
              ? pickedItems[0].id
              : pickedItems[0]?.kind === 'product'
                ? (pickedItems[0].variantGroupId ?? null)
                : null
        }
        onlyUnattached={noProduct}
      />
    </div>
  );
}

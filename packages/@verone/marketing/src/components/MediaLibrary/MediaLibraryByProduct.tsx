'use client';

import * as React from 'react';

import { Layers, Package, Tag } from 'lucide-react';

import { Badge } from '@verone/ui/components/ui/badge';
import { Card, CardContent } from '@verone/ui/components/ui/card';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui/components/ui/popover';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import type { MediaAsset, PublicationCount } from '@verone/products';

import type { BrandInfo } from './MediaAssetCard';

const supabase = createClient();

// Palette couleurs marque (synchronisée avec MediaAssetCard)
const BRAND_COLOR_FALLBACK: Record<string, string> = {
  verone: '#f97316',
  boemia: '#8b5cf6',
  solar: '#eab308',
  flos: '#22c55e',
};

function getBrandColor(brand: BrandInfo): string {
  if (brand.brand_color) return brand.brand_color;
  return BRAND_COLOR_FALLBACK[brand.slug] ?? '#6b7280';
}

// ============================================================================
// TYPES
// ============================================================================

interface ProductMeta {
  id: string;
  name: string;
  commercial_name: string | null;
  brand_ids: string[] | null;
}

interface VariantGroupMeta {
  id: string;
  name: string;
}

export type AssetGroup =
  | {
      kind: 'product';
      id: string;
      name: string;
      brandIds: string[];
      assets: MediaAsset[];
    }
  | {
      kind: 'variant_group';
      id: string;
      name: string;
      brandIds: string[];
      assets: MediaAsset[];
    }
  | {
      kind: 'unattached';
      id: 'unattached';
      name: 'Sans produit lié';
      brandIds: string[];
      assets: MediaAsset[];
    };

// Style + initiale pour les badges canal (anti-doublon)
function getChannelBadgeStyle(channel: string): string {
  const c = channel.toLowerCase();
  if (c.includes('meta') || c.includes('facebook') || c.includes('instagram'))
    return 'bg-blue-600 text-white';
  if (c.includes('pinterest')) return 'bg-red-600 text-white';
  if (c.includes('site') || c.includes('website') || c.includes('verone'))
    return 'bg-stone-700 text-white';
  if (c.includes('whatsapp')) return 'bg-green-600 text-white';
  if (c.includes('email') || c.includes('newsletter'))
    return 'bg-purple-600 text-white';
  if (c.includes('merchant') || c.includes('google'))
    return 'bg-amber-600 text-white';
  return 'bg-gray-600 text-white';
}

function getChannelInitial(channel: string): string {
  const c = channel.toLowerCase();
  if (c.includes('instagram')) return 'IG';
  if (c.includes('facebook') || (c.includes('meta') && !c.includes('merchant')))
    return 'FB';
  if (c.includes('pinterest')) return 'P';
  if (c.includes('whatsapp')) return 'W';
  if (c.includes('email') || c.includes('newsletter')) return 'M';
  if (c.includes('merchant') || c.includes('google')) return 'G';
  if (c.includes('site') || c.includes('website') || c.includes('verone'))
    return 'S';
  return channel.slice(0, 2).toUpperCase();
}

interface MediaLibraryByProductProps {
  assets: MediaAsset[];
  brands: BrandInfo[];
  loading: boolean;
  publicationCounts?: Map<string, PublicationCount>;
  onGroupClick?: (group: AssetGroup) => void;
  onAssetClick?: (asset: MediaAsset) => void;
  onBrandUpdate?: (assetId: string, brandIds: string[]) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaLibraryByProduct({
  assets,
  brands,
  loading,
  publicationCounts,
  onGroupClick,
  onAssetClick,
  onBrandUpdate,
}: MediaLibraryByProductProps) {
  const [products, setProducts] = React.useState<Record<string, ProductMeta>>(
    {}
  );
  const [variantGroups, setVariantGroups] = React.useState<
    Record<string, VariantGroupMeta>
  >({});
  const [metaLoading, setMetaLoading] = React.useState(false);

  // Charge les noms de produits / variantes uniquement pour les IDs présents
  const productIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map(a => a.product_id)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [assets]
  );
  const variantGroupIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map(a => a.variant_group_id)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [assets]
  );

  React.useEffect(() => {
    let cancelled = false;
    if (productIds.length === 0 && variantGroupIds.length === 0) {
      setProducts({});
      setVariantGroups({});
      return;
    }
    setMetaLoading(true);
    void Promise.all([
      productIds.length > 0
        ? supabase
            .from('products')
            .select('id, name, commercial_name, brand_ids')
            .in('id', productIds)
        : Promise.resolve({ data: [], error: null }),
      variantGroupIds.length > 0
        ? supabase
            .from('variant_groups')
            .select('id, name')
            .in('id', variantGroupIds)
        : Promise.resolve({ data: [], error: null }),
    ]).then(([productsResult, variantGroupsResult]) => {
      if (cancelled) return;
      const productsMap: Record<string, ProductMeta> = {};
      for (const row of (productsResult.data ?? []) as ProductMeta[]) {
        productsMap[row.id] = row;
      }
      const variantGroupsMap: Record<string, VariantGroupMeta> = {};
      for (const row of (variantGroupsResult.data ??
        []) as VariantGroupMeta[]) {
        variantGroupsMap[row.id] = row;
      }
      setProducts(productsMap);
      setVariantGroups(variantGroupsMap);
      setMetaLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productIds, variantGroupIds]);

  // Groupement
  const groups = React.useMemo<AssetGroup[]>(() => {
    const productGroups = new Map<string, MediaAsset[]>();
    const variantGroupAssets = new Map<string, MediaAsset[]>();
    const unattached: MediaAsset[] = [];

    for (const asset of assets) {
      if (asset.product_id) {
        const list = productGroups.get(asset.product_id) ?? [];
        list.push(asset);
        productGroups.set(asset.product_id, list);
      } else if (asset.variant_group_id) {
        const list = variantGroupAssets.get(asset.variant_group_id) ?? [];
        list.push(asset);
        variantGroupAssets.set(asset.variant_group_id, list);
      } else {
        unattached.push(asset);
      }
    }

    const result: AssetGroup[] = [];

    if (unattached.length > 0) {
      result.push({
        kind: 'unattached',
        id: 'unattached',
        name: 'Sans produit lié',
        brandIds: [],
        assets: unattached,
      });
    }

    for (const [vgId, list] of variantGroupAssets.entries()) {
      const meta = variantGroups[vgId];
      result.push({
        kind: 'variant_group',
        id: vgId,
        name: meta?.name ?? 'Variante',
        brandIds: [],
        assets: list,
      });
    }

    const productEntries: AssetGroup[] = [];
    for (const [pid, list] of productGroups.entries()) {
      const meta = products[pid];
      productEntries.push({
        kind: 'product',
        id: pid,
        name: meta?.commercial_name ?? meta?.name ?? 'Produit',
        brandIds: meta?.brand_ids ?? [],
        assets: list,
      });
    }
    productEntries.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    result.push(...productEntries);

    return result;
  }, [assets, products, variantGroups]);

  if (loading || metaLoading) {
    return (
      <div className="flex justify-center py-12 text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Aucune photo. Importe-en une via le bouton « Ajouter des photos ».
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <ProductGroupCard
          key={`${group.kind}-${group.id}`}
          group={group}
          brands={brands}
          publicationCounts={publicationCounts}
          onClick={() => onGroupClick?.(group)}
          onAssetClick={onAssetClick}
          onBrandUpdate={onBrandUpdate}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT — carte d'un groupe (produit/variante/à attribuer)
// ============================================================================

interface ProductGroupCardProps {
  group: AssetGroup;
  brands: BrandInfo[];
  publicationCounts?: Map<string, PublicationCount>;
  onClick?: () => void;
  onAssetClick?: (asset: MediaAsset) => void;
  onBrandUpdate?: (assetId: string, brandIds: string[]) => Promise<void>;
}

function ProductGroupCard({
  group,
  brands,
  publicationCounts,
  onClick,
  onAssetClick,
  onBrandUpdate,
}: ProductGroupCardProps) {
  const groupBrands = brands.filter(b => group.brandIds.includes(b.id));
  const previewAssets = group.assets.slice(0, 6);
  const moreCount = group.assets.length - previewAssets.length;
  const isUnattached = group.kind === 'unattached';

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isUnattached && 'border-amber-300 bg-amber-50/50'
      )}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {group.kind === 'variant_group' ? (
              <Layers className="h-4 w-4 text-muted-foreground" />
            ) : group.kind === 'unattached' ? (
              <Package className="h-4 w-4 text-amber-600" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
            <button
              type="button"
              onClick={onClick}
              className="text-left text-sm font-medium hover:underline"
            >
              {group.name}
            </button>
            <Badge variant="outline" className="text-[10px]">
              {group.assets.length} photo{group.assets.length > 1 ? 's' : ''}
            </Badge>
            {group.kind === 'variant_group' && (
              <Badge variant="secondary" className="text-[10px]">
                Variante
              </Badge>
            )}
            {isUnattached && (
              <Badge variant="secondary" className="text-[10px]">
                Contenu de marque
              </Badge>
            )}
          </div>
          {groupBrands.length > 0 && (
            <div className="flex gap-1">
              {groupBrands.map(brand => (
                <Badge
                  key={brand.id}
                  variant="secondary"
                  className="text-[10px]"
                >
                  {brand.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {isUnattached && (
          <p className="mb-3 text-xs text-amber-700">
            Visuels de marque sans produit lié (citations, ambiances,
            événements).
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {previewAssets.map(asset => {
            const pubCount = publicationCounts?.get(asset.id);
            const activePubs = pubCount?.active_count ?? 0;
            const activeChannels = pubCount?.active_channels ?? [];
            const assetBrands = brands.filter(b =>
              asset.brand_ids.includes(b.id)
            );
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onAssetClick?.(asset)}
                className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted transition-shadow hover:shadow-md"
                aria-label={asset.alt_text ?? 'Voir la photo'}
              >
                <CloudflareImage
                  cloudflareId={asset.cloudflare_image_id}
                  fallbackSrc={asset.public_url}
                  alt={asset.alt_text ?? ''}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  variant="public"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
                {activePubs > 0 && (
                  <span
                    className="absolute right-1 top-1 inline-flex items-center rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow"
                    title={`Publié ${activePubs} fois`}
                  >
                    ✓ {activePubs}
                  </span>
                )}
                {asset.source === 'ai_generated' && (
                  <span
                    className={cn(
                      'absolute inline-flex items-center rounded-full bg-fuchsia-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow',
                      isUnattached ? 'left-6 top-1' : 'left-1 top-1'
                    )}
                    title="Image générée par IA"
                  >
                    IA
                  </span>
                )}
                {/* Bouton quick-edit marque — uniquement sur les photos sans produit */}
                {isUnattached && onBrandUpdate && (
                  <BrandQuickEdit
                    asset={asset}
                    brands={brands}
                    onBrandUpdate={onBrandUpdate}
                  />
                )}
                {/* Badges canaux publiés (anti-doublon) */}
                {activeChannels.length > 0 && (
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    {activeChannels.slice(0, 4).map(ch => (
                      <span
                        key={ch}
                        className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-sm px-1 text-[9px] font-bold uppercase shadow ${getChannelBadgeStyle(ch)}`}
                        title={`Déjà publié sur ${ch}`}
                      >
                        {getChannelInitial(ch)}
                      </span>
                    ))}
                    {activeChannels.length > 4 && (
                      <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-sm bg-gray-700/80 px-1 text-[9px] font-bold text-white shadow">
                        +{activeChannels.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {/* Badges marque permanents (bottom-right, évite collision canaux) */}
                {assetBrands.length > 0 && (
                  <div className="absolute bottom-0 right-0 flex flex-wrap justify-end gap-0.5 bg-gradient-to-t from-black/60 to-transparent p-1">
                    {assetBrands.slice(0, 2).map(brand => (
                      <span
                        key={brand.id}
                        className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium text-white"
                        style={{ backgroundColor: getBrandColor(brand) }}
                      >
                        {brand.name}
                      </span>
                    ))}
                    {assetBrands.length > 2 && (
                      <span className="inline-flex items-center rounded bg-white/20 px-1 py-0.5 text-[9px] font-medium text-white">
                        +{assetBrands.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
          {moreCount > 0 && (
            <button
              type="button"
              onClick={onClick}
              className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              +{moreCount}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENT — Quick-edit marque (uniquement pour le groupe "unattached")
// ============================================================================

interface BrandQuickEditProps {
  asset: MediaAsset;
  brands: BrandInfo[];
  onBrandUpdate: (assetId: string, brandIds: string[]) => Promise<void>;
}

function BrandQuickEdit({ asset, brands, onBrandUpdate }: BrandQuickEditProps) {
  const [pending, setPending] = React.useState(false);

  const handleToggle = async (brandId: string) => {
    if (pending) return;
    const current = asset.brand_ids ?? [];
    const next = current.includes(brandId)
      ? current.filter(id => id !== brandId)
      : [...current, brandId];
    setPending(true);
    try {
      await onBrandUpdate(asset.id, next);
    } finally {
      setPending(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white shadow hover:bg-black/70"
          title="Changer la marque"
          aria-label="Changer la marque de cette photo"
        >
          <Tag className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-2"
        onClick={e => e.stopPropagation()}
        side="right"
        align="start"
      >
        <p className="mb-2 text-[10px] font-medium text-muted-foreground">
          Marques
        </p>
        <div className="flex flex-col gap-1">
          {brands.map(brand => {
            const isChecked = (asset.brand_ids ?? []).includes(brand.id);
            return (
              <button
                key={brand.id}
                type="button"
                disabled={pending}
                onClick={() => void handleToggle(brand.id).catch(console.error)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] transition-colors',
                  isChecked
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: getBrandColor(brand) }}
                />
                {brand.name}
                {isChecked && (
                  <span className="ml-auto text-[9px] text-primary">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

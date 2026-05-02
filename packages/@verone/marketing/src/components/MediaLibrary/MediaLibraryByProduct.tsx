'use client';

import * as React from 'react';

import { Layers, Package } from 'lucide-react';

import { Badge } from '@verone/ui/components/ui/badge';
import { Card, CardContent } from '@verone/ui/components/ui/card';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import type { MediaAsset } from '@verone/products';

import type { BrandInfo } from './MediaAssetCard';

const supabase = createClient();

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
      name: 'À attribuer';
      brandIds: string[];
      assets: MediaAsset[];
    };

interface MediaLibraryByProductProps {
  assets: MediaAsset[];
  brands: BrandInfo[];
  loading: boolean;
  onGroupClick?: (group: AssetGroup) => void;
  onAssetClick?: (asset: MediaAsset) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaLibraryByProduct({
  assets,
  brands,
  loading,
  onGroupClick,
  onAssetClick,
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
        name: 'À attribuer',
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
          onClick={() => onGroupClick?.(group)}
          onAssetClick={onAssetClick}
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
  onClick?: () => void;
  onAssetClick?: (asset: MediaAsset) => void;
}

function ProductGroupCard({
  group,
  brands,
  onClick,
  onAssetClick,
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
              <Badge variant="destructive" className="text-[10px]">
                Action requise
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
            Ces photos ne sont rattachées à aucun produit. Clique sur une photo
            pour l'attribuer.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {previewAssets.map(asset => (
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
            </button>
          ))}
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

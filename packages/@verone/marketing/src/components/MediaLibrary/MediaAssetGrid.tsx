'use client';

import * as React from 'react';

import { Button } from '@verone/ui/components/ui/button';
import { Skeleton } from '@verone/ui/components/ui/skeleton';
import type { MediaAsset } from '@verone/products';

import { MediaAssetCard } from './MediaAssetCard';
import type { BrandInfo } from './MediaAssetCard';

// ============================================================================
// TYPES
// ============================================================================

interface MediaAssetGridProps {
  assets: MediaAsset[];
  brands: BrandInfo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onAssetClick: (asset: MediaAsset) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaAssetGrid({
  assets,
  brands,
  loading,
  hasMore,
  onLoadMore,
  onAssetClick,
}: MediaAssetGridProps) {
  if (loading && assets.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!loading && assets.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Aucune photo ne correspond à ces filtres
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {assets.map(asset => (
          <MediaAssetCard
            key={asset.id}
            asset={asset}
            brands={brands}
            onClick={onAssetClick}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-h-[44px] md:min-h-[36px]"
          >
            {loading ? 'Chargement...' : 'Charger plus'}
          </Button>
        </div>
      )}
    </div>
  );
}

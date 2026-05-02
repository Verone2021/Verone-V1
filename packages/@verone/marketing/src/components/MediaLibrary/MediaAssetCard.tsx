'use client';

import * as React from 'react';

import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { Badge } from '@verone/ui/components/ui/badge';
import type { MediaAsset } from '@verone/products';

// ============================================================================
// TYPES
// ============================================================================

export interface BrandInfo {
  id: string;
  slug: string;
  name: string;
  brand_color: string | null;
}

interface MediaAssetCardProps {
  asset: MediaAsset;
  brands: BrandInfo[];
  onClick: (asset: MediaAsset) => void;
}

// Palette par défaut par slug quand brand_color est null
const BRAND_COLOR_FALLBACK: Record<string, string> = {
  verone: '#f97316', // orange
  boemia: '#8b5cf6', // violet
  solar: '#eab308', // jaune
  flos: '#22c55e', // vert
};

const ASSET_TYPE_LABEL: Record<string, string> = {
  product: 'Produit',
  lifestyle: 'Lifestyle',
  packshot: 'Packshot',
  logo: 'Logo',
  ambiance: 'Ambiance',
  other: 'Autre',
};

function getBrandColor(brand: BrandInfo): string {
  if (brand.brand_color) return brand.brand_color;
  return BRAND_COLOR_FALLBACK[brand.slug] ?? '#6b7280';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaAssetCard({
  asset,
  brands,
  onClick,
}: MediaAssetCardProps) {
  const assetBrands = brands.filter(b => asset.brand_ids.includes(b.id));

  const handleClick = React.useCallback(() => {
    onClick(asset);
  }, [asset, onClick]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(asset);
      }
    },
    [asset, onClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border bg-muted transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] min-w-[44px]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={asset.alt_text ?? 'Voir le détail de cet asset'}
    >
      {/* Image */}
      <CloudflareImage
        cloudflareId={asset.cloudflare_image_id}
        fallbackSrc={asset.public_url}
        alt={asset.alt_text ?? ''}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        variant="public"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />

      {/* Overlay au hover */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Badge type */}
        <Badge variant="secondary" className="mb-1 w-fit text-[10px]">
          {ASSET_TYPE_LABEL[asset.asset_type] ?? asset.asset_type}
        </Badge>

        {/* Badges marques */}
        <div className="flex flex-wrap gap-1">
          {assetBrands.slice(0, 2).map(brand => (
            <span
              key={brand.id}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: getBrandColor(brand) }}
            >
              {brand.name}
            </span>
          ))}
          {assetBrands.length > 2 && (
            <span className="inline-flex items-center rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white">
              +{assetBrands.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

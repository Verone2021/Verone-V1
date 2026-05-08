'use client';

import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@verone/ui/components/ui/button';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { X, Plus, ImageIcon } from 'lucide-react';
import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface SourceImageAsset {
  id: string;
  cloudflare_image_id: string | null;
  public_url: string | null;
  alt_text: string | null;
}

interface SourceImagesSectionProps {
  selectedAssetIds: string[];
  onChange: (ids: string[]) => void;
  onOpenPicker: () => void;
  maxImages?: number;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchAssetsById(ids: string[]): Promise<SourceImageAsset[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('media_assets')
    .select('id, cloudflare_image_id, public_url, alt_text')
    .in('id', ids)
    .limit(5);

  if (error) {
    console.error('[SourceImagesSection] fetch error:', error);
    return [];
  }
  return (data ?? []) as SourceImageAsset[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SourceImagesSection({
  selectedAssetIds,
  onChange,
  onOpenPicker,
  maxImages = 5,
}: SourceImagesSectionProps) {
  const { data: assets = [] } = useQuery<SourceImageAsset[]>({
    queryKey: ['media_assets_by_ids', selectedAssetIds],
    queryFn: () => fetchAssetsById(selectedAssetIds),
    enabled: selectedAssetIds.length > 0,
    staleTime: 30_000,
  });

  const handleRemove = React.useCallback(
    (id: string) => {
      onChange(selectedAssetIds.filter(aid => aid !== id));
    },
    [selectedAssetIds, onChange]
  );

  const canAddMore = selectedAssetIds.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Grille de thumbnails */}
      {assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted md:h-16 md:w-16"
            >
              {asset.cloudflare_image_id ? (
                <CloudflareImage
                  cloudflareId={asset.cloudflare_image_id}
                  fallbackSrc={asset.public_url ?? undefined}
                  alt={asset.alt_text ?? ''}
                  fill
                  className="object-cover"
                  variant="public"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={() => handleRemove(asset.id)}
                className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label={`Retirer l'image`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ajout */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenPicker}
          className="h-11 w-full sm:w-auto md:h-9"
        >
          <Plus className="mr-2 h-4 w-4" />
          {selectedAssetIds.length === 0
            ? 'Choisir des images sources'
            : `Ajouter des images (${selectedAssetIds.length}/${maxImages})`}
        </Button>
      )}

      {!canAddMore && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxImages} images sources atteint.
        </p>
      )}
    </div>
  );
}

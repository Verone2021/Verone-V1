'use client';

import { useState, useCallback, useEffect } from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/utils/supabase/types';

import { useMediaAssetMutations } from './use-media-asset-mutations';
import {
  MEDIA_ASSET_SELECT_COLS,
  sanitizeSearchInput,
  type MediaAsset,
  type MediaAssetType,
  type UploadAssetInput,
} from './use-media-assets.shared';

// Re-export public types for consumers
export type {
  MediaAsset,
  MediaAssetType,
  UploadAssetInput,
} from './use-media-assets.shared';

type MediaAssetUpdate = Database['public']['Tables']['media_assets']['Update'];

// ============================================================================
// PUBLIC API
// ============================================================================

export interface UseMediaAssetsOptions {
  /** UUID d'une marque, 'all' (no filter), ou 'no-brand' (brand_ids vide) */
  brandId?: string | null;
  assetType?: MediaAssetType | 'all';
  search?: string;
  archived?: boolean;
  pageSize?: number;
  enabled?: boolean;
}

interface UseMediaAssetsReturn {
  assets: MediaAsset[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  uploadAsset: (file: File, metadata: UploadAssetInput) => Promise<MediaAsset>;
  uploadMultiple: (
    files: File[],
    metadata: UploadAssetInput
  ) => Promise<MediaAsset[]>;
  updateAssetMetadata: (
    id: string,
    updates: Partial<MediaAssetUpdate>
  ) => Promise<MediaAsset>;
  archiveAsset: (id: string) => Promise<void>;
  unarchiveAsset: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMediaAssets({
  brandId,
  assetType,
  search,
  archived = false,
  pageSize = 50,
  enabled = true,
}: UseMediaAssetsOptions = {}): UseMediaAssetsReturn {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  // Flag boolean pour éviter la boucle infinie (cf. data-fetching.md)
  const [loaded, setLoaded] = useState(false);

  const supabase = createClient();

  const buildQuery = useCallback(
    (currentOffset: number) => {
      let query = supabase.from('media_assets').select(MEDIA_ASSET_SELECT_COLS);

      // Filtre marque
      if (brandId === 'no-brand') {
        query = query.eq('brand_ids', [] as string[]);
      } else if (brandId && brandId !== 'all' && brandId !== null) {
        query = query.contains('brand_ids', [brandId]);
      }

      // Filtre type
      if (assetType && assetType !== 'all') {
        query = query.eq('asset_type', assetType);
      }

      // Recherche textuelle — sanitize pour éviter injection PostgREST
      if (search && search.trim() !== '') {
        const safe = sanitizeSearchInput(search);
        if (safe.length > 0) {
          query = query.or(`alt_text.ilike.%${safe}%,notes.ilike.%${safe}%`);
        }
      }

      // Filtre archivé
      if (archived) {
        query = query.not('archived_at', 'is', null);
      } else {
        query = query.is('archived_at', null);
      }

      return query
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + pageSize - 1);
    },
    [supabase, brandId, assetType, search, archived, pageSize]
  );

  const fetchAssets = useCallback(
    async (reset = true) => {
      if (!enabled) return;

      try {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const { data, error: fetchError } = await buildQuery(currentOffset);

        if (fetchError) throw fetchError;

        const rows = (data ?? []) as unknown as MediaAsset[];

        if (reset) {
          setAssets(rows);
          setOffset(rows.length);
        } else {
          setAssets(prev => [...prev, ...rows]);
          setOffset(prev => prev + rows.length);
        }

        setHasMore(rows.length === pageSize);

        logger.info('Media assets chargés', {
          operation: 'fetch_media_assets',
          count: rows.length,
          reset,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Erreur chargement assets';
        logger.error('Erreur chargement media assets', err as Error, {
          operation: 'fetch_media_assets_failed',
        });
        setError(msg);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offset excluded intentionally (used only in reset=false path)
    [enabled, buildQuery, pageSize]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchAssets(false);
  }, [hasMore, loading, fetchAssets]);

  const refetch = useCallback(async () => {
    setLoaded(false);
    await fetchAssets(true);
  }, [fetchAssets]);

  // Auto-fetch initial — flag boolean au lieu de array.length (cf. data-fetching.md)
  useEffect(() => {
    if (enabled && !loaded) {
      void fetchAssets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchAssets causes loop if added
  }, [enabled, loaded]);

  // Refetch quand les filtres changent
  useEffect(() => {
    setLoaded(false);
    setOffset(0);
  }, [brandId, assetType, search, archived, pageSize]);

  // Mutations déléguées au hook séparé (split pour respecter limite 400 lignes)
  const {
    uploading,
    mutationError,
    uploadAsset,
    uploadMultiple,
    updateAssetMetadata,
    archiveAsset,
    unarchiveAsset,
  } = useMediaAssetMutations({ refetch, setAssets, archived });

  return {
    assets,
    loading,
    uploading,
    error: error ?? mutationError,
    hasMore,
    loadMore,
    uploadAsset,
    uploadMultiple,
    updateAssetMetadata,
    archiveAsset,
    unarchiveAsset,
    refetch,
  };
}

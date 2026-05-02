'use client';

import { useState, useCallback, useEffect } from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';
import { smartUploadImage } from '@verone/utils/upload';
import type { Database } from '@verone/utils/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export type MediaAsset = Database['public']['Tables']['media_assets']['Row'];
type MediaAssetInsert = Database['public']['Tables']['media_assets']['Insert'];
type MediaAssetUpdate = Database['public']['Tables']['media_assets']['Update'];

export type MediaAssetType =
  | 'product'
  | 'lifestyle'
  | 'packshot'
  | 'logo'
  | 'ambiance'
  | 'other';

export interface UploadAssetInput {
  assetType: MediaAssetType;
  brandIds: string[];
  altText?: string;
  tags?: string[];
  notes?: string;
}

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

// Colonnes sélectionnées explicitement (pas de select('*'))
const MEDIA_ASSET_SELECT_COLS = [
  'id',
  'cloudflare_image_id',
  'public_url',
  'storage_path',
  'alt_text',
  'width',
  'height',
  'file_size',
  'format',
  'asset_type',
  'brand_ids',
  'tags',
  'notes',
  'source_product_image_id',
  'created_at',
  'updated_at',
  'archived_at',
].join(', ');

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
  const [uploading, setUploading] = useState(false);
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

      // Recherche textuelle
      if (search && search.trim() !== '') {
        const escaped = search.trim();
        query = query.or(
          `alt_text.ilike.%${escaped}%,notes.ilike.%${escaped}%`
        );
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

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const uploadAsset = useCallback(
    async (file: File, metadata: UploadAssetInput): Promise<MediaAsset> => {
      try {
        setUploading(true);
        setError(null);

        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const randomId = Math.random().toString(36).substring(2);
        const path = `media-library/${metadata.assetType}/${Date.now()}-${randomId}.${fileExt}`;

        const uploadResult = await smartUploadImage(file, {
          bucket: 'product-images',
          path,
          ownerType: 'product', // ownerType 'media_asset' non supporté, 'product' est le plus proche
        });

        const insertData: MediaAssetInsert = {
          asset_type: metadata.assetType,
          brand_ids: metadata.brandIds,
          alt_text: metadata.altText ?? file.name,
          tags: metadata.tags ?? [],
          notes: metadata.notes,
          file_size: file.size,
          format: fileExt,
          storage_path: uploadResult.storagePath ?? path,
          public_url: uploadResult.supabasePublicUrl ?? null,
          cloudflare_image_id: uploadResult.cloudflareImageId ?? null,
        };

        const { data, error: insertError } = await supabase
          .from('media_assets')
          .insert([insertData])
          .select(MEDIA_ASSET_SELECT_COLS)
          .single();

        if (insertError) throw insertError;

        logger.info('Media asset uploadé', {
          operation: 'upload_media_asset',
          assetType: metadata.assetType,
          fileName: file.name,
        });

        // Rafraîchir la liste
        await refetch();

        return data as unknown as MediaAsset;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur upload';
        logger.error('Erreur upload media asset', err as Error, {
          operation: 'upload_media_asset_failed',
        });
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch causes loop if added
    [supabase]
  );

  const uploadMultiple = useCallback(
    async (
      files: File[],
      metadata: UploadAssetInput
    ): Promise<MediaAsset[]> => {
      const results: MediaAsset[] = [];

      for (const file of files) {
        try {
          const result = await uploadAsset(file, metadata);
          results.push(result);
        } catch (err) {
          logger.error('Erreur upload multiple asset', err as Error, {
            operation: 'upload_multiple_media_assets_failed',
            fileName: file.name,
          });
        }
      }

      return results;
    },
    [uploadAsset]
  );

  const updateAssetMetadata = useCallback(
    async (
      id: string,
      updates: Partial<MediaAssetUpdate>
    ): Promise<MediaAsset> => {
      try {
        setError(null);

        const { data, error: updateError } = await supabase
          .from('media_assets')
          .update(updates)
          .eq('id', id)
          .select(MEDIA_ASSET_SELECT_COLS)
          .single();

        if (updateError) throw updateError;

        logger.info('Métadonnées asset mises à jour', {
          operation: 'update_media_asset_metadata',
          id,
        });

        const updatedAsset = data as unknown as MediaAsset;
        setAssets(prev => prev.map(a => (a.id === id ? updatedAsset : a)));

        return updatedAsset;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur mise à jour';
        logger.error('Erreur mise à jour media asset', err as Error, {
          operation: 'update_media_asset_metadata_failed',
          id,
        });
        setError(msg);
        throw err;
      }
    },
    [supabase]
  );

  const archiveAsset = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('media_assets')
          .update({ archived_at: new Date().toISOString() })
          .eq('id', id);

        if (updateError) throw updateError;

        logger.info('Media asset archivé', {
          operation: 'archive_media_asset',
          id,
        });

        // Retirer de la liste courante (si on affiche les non-archivés)
        if (!archived) {
          setAssets(prev => prev.filter(a => a.id !== id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur archivage';
        logger.error('Erreur archivage media asset', err as Error, {
          operation: 'archive_media_asset_failed',
          id,
        });
        setError(msg);
        throw err;
      }
    },
    [supabase, archived]
  );

  const unarchiveAsset = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('media_assets')
          .update({ archived_at: null })
          .eq('id', id);

        if (updateError) throw updateError;

        logger.info('Media asset désarchivé', {
          operation: 'unarchive_media_asset',
          id,
        });

        // Retirer de la liste courante (si on affiche les archivés seulement)
        if (archived) {
          setAssets(prev => prev.filter(a => a.id !== id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur désarchivage';
        logger.error('Erreur désarchivage media asset', err as Error, {
          operation: 'unarchive_media_asset_failed',
          id,
        });
        setError(msg);
        throw err;
      }
    },
    [supabase, archived]
  );

  return {
    assets,
    loading,
    uploading,
    error,
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

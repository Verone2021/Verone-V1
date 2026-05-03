'use client';

import {
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';
import { smartUploadImage } from '@verone/utils/upload';
import type { Database } from '@verone/utils/supabase/types';

import {
  MEDIA_ASSET_SELECT_COLS,
  type MediaAsset,
  type UploadAssetInput,
} from './use-media-assets.shared';

type MediaAssetInsert = Database['public']['Tables']['media_assets']['Insert'];
type MediaAssetUpdate = Database['public']['Tables']['media_assets']['Update'];

interface UseMediaAssetMutationsOptions {
  refetch: () => Promise<void>;
  setAssets: Dispatch<SetStateAction<MediaAsset[]>>;
  archived: boolean;
}

interface UseMediaAssetMutationsReturn {
  uploading: boolean;
  mutationError: string | null;
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
}

export function useMediaAssetMutations({
  refetch,
  setAssets,
  archived,
}: UseMediaAssetMutationsOptions): UseMediaAssetMutationsReturn {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const uploadAsset = useCallback(
    async (file: File, metadata: UploadAssetInput): Promise<MediaAsset> => {
      try {
        setUploading(true);
        setMutationError(null);

        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const randomId = Math.random().toString(36).substring(2);
        const path = `media-library/${metadata.assetType}/${Date.now()}-${randomId}.${fileExt}`;

        const uploadResult = await smartUploadImage(file, {
          bucket: 'product-images',
          path,
          ownerType: 'product',
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
          product_id: metadata.productId ?? null,
          variant_group_id: metadata.variantGroupId ?? null,
          source: metadata.source ?? 'manual_upload',
          ai_prompt_used:
            metadata.source === 'ai_generated'
              ? (metadata.aiPromptUsed ?? null)
              : null,
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

        await refetch();

        return data as unknown as MediaAsset;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur upload';
        logger.error('Erreur upload media asset', err as Error, {
          operation: 'upload_media_asset_failed',
        });
        setMutationError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [supabase, refetch]
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
        setMutationError(null);

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
        setMutationError(msg);
        throw err;
      }
    },
    [supabase, setAssets]
  );

  const archiveAsset = useCallback(
    async (id: string): Promise<void> => {
      try {
        setMutationError(null);

        const { error: updateError } = await supabase
          .from('media_assets')
          .update({ archived_at: new Date().toISOString() })
          .eq('id', id);

        if (updateError) throw updateError;

        logger.info('Media asset archivé', {
          operation: 'archive_media_asset',
          id,
        });

        if (!archived) {
          setAssets(prev => prev.filter(a => a.id !== id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur archivage';
        logger.error('Erreur archivage media asset', err as Error, {
          operation: 'archive_media_asset_failed',
          id,
        });
        setMutationError(msg);
        throw err;
      }
    },
    [supabase, archived, setAssets]
  );

  const unarchiveAsset = useCallback(
    async (id: string): Promise<void> => {
      try {
        setMutationError(null);

        const { error: updateError } = await supabase
          .from('media_assets')
          .update({ archived_at: null })
          .eq('id', id);

        if (updateError) throw updateError;

        logger.info('Media asset désarchivé', {
          operation: 'unarchive_media_asset',
          id,
        });

        if (archived) {
          setAssets(prev => prev.filter(a => a.id !== id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur désarchivage';
        logger.error('Erreur désarchivage media asset', err as Error, {
          operation: 'unarchive_media_asset_failed',
          id,
        });
        setMutationError(msg);
        throw err;
      }
    },
    [supabase, archived, setAssets]
  );

  return {
    uploading,
    mutationError,
    uploadAsset,
    uploadMultiple,
    updateAssetMetadata,
    archiveAsset,
    unarchiveAsset,
  };
}
